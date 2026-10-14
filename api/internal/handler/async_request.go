package handler

import (
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"mc_web_console_api/internal/model"
	"mc_web_console_api/internal/repository"
	"mc_web_console_api/internal/service"
	"mc_web_console_api/pkg/errors"
	"mc_web_console_api/pkg/jwt"

	"github.com/labstack/echo/v4"
)

// ResolveUserIDFromRequest resolves user id from Bearer / raw JWT / session token.
// Used by Proxy upsert and async-request APIs under MCIAM (Keycloak) tokens.
func ResolveUserIDFromRequest(c echo.Context) string {
	if uid, ok := c.Get("userId").(string); ok && uid != "" {
		return uid
	}
	raw := extractRawAccessToken(c)
	if raw == "" {
		return ""
	}
	if claims, err := jwt.ParseToken(raw); err == nil && claims.UserID != "" {
		return claims.UserID
	}
	if db := repository.GetDB(); db != nil {
		var sess model.UserSession
		if err := db.Where("access_token = ?", raw).First(&sess).Error; err == nil {
			return sess.UserID
		}
	}
	return decodeUnverifiedJWTSubject(raw)
}

func extractRawAccessToken(c echo.Context) string {
	auth := c.Request().Header.Get("Authorization")
	if auth == "" {
		return ""
	}
	if strings.HasPrefix(strings.ToLower(auth), "bearer ") {
		return strings.TrimSpace(auth[7:])
	}
	return strings.TrimSpace(auth)
}

func decodeUnverifiedJWTSubject(token string) string {
	parts := strings.Split(token, ".")
	if len(parts) < 2 {
		return ""
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		payload, err = base64.StdEncoding.DecodeString(parts[1])
		if err != nil {
			return ""
		}
	}
	var claims map[string]interface{}
	if json.Unmarshal(payload, &claims) != nil {
		return ""
	}
	for _, key := range []string{"upn", "preferred_username", "email", "sub"} {
		if v, ok := claims[key].(string); ok && v != "" {
			return v
		}
	}
	return ""
}

func requireAsyncRepo() (*repository.AsyncRequestRepository, error) {
	db := repository.GetDB()
	if db == nil {
		return nil, errors.NewBadRequest("async request store unavailable (database not configured)")
	}
	return repository.NewAsyncRequestRepository(db), nil
}

// ListAsyncRequests GET /api/async-requests?q=&offset=&limit=
func ListAsyncRequests(c echo.Context) error {
	userID := ResolveUserIDFromRequest(c)
	if userID == "" {
		return errors.NewUnauthorized("Missing or invalid authorization")
	}
	repo, err := requireAsyncRepo()
	if err != nil {
		return err
	}
	q := strings.TrimSpace(c.QueryParam("q"))
	offset, _ := strconv.Atoi(c.QueryParam("offset"))
	if offset < 0 {
		offset = 0
	}
	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	rows, total, err := repo.ListByUser(userID, q, offset, limit)
	if err != nil {
		return errors.NewInternalServerError("Failed to list async requests", err)
	}
	dtos := make([]model.AsyncRequestDTO, 0, len(rows))
	for i := range rows {
		dtos = append(dtos, rows[i].ToDTO())
	}
	payload := model.AsyncRequestListDTO{
		Items:   dtos,
		Total:   total,
		HasMore: int64(offset+len(dtos)) < total,
	}
	resp := model.CommonResponseStatusOK(payload)
	return c.JSON(resp.Status.Code, resp)
}

// PatchAsyncRequestBody optional meta enrichment.
type PatchAsyncRequestBody struct {
	Label string `json:"label"`
	Href  string `json:"href"`
	NsID  string `json:"nsId"`
}

// PatchAsyncRequest PATCH /api/async-requests/:requestId
func PatchAsyncRequest(c echo.Context) error {
	userID := ResolveUserIDFromRequest(c)
	if userID == "" {
		return errors.NewUnauthorized("Missing or invalid authorization")
	}
	requestID := c.Param("requestId")
	if requestID == "" {
		return errors.NewBadRequest("requestId is required")
	}
	var body PatchAsyncRequestBody
	_ = c.Bind(&body)
	repo, err := requireAsyncRepo()
	if err != nil {
		return err
	}
	if err := repo.PatchMeta(requestID, userID, body.Label, body.Href, body.NsID); err != nil {
		return errors.NewInternalServerError("Failed to patch async request", err)
	}
	resp := model.CommonResponseStatusOK(map[string]string{"requestId": requestID})
	return c.JSON(resp.Status.Code, resp)
}

// DeleteAsyncRequest DELETE /api/async-requests/:requestId
func DeleteAsyncRequest(c echo.Context) error {
	userID := ResolveUserIDFromRequest(c)
	if userID == "" {
		return errors.NewUnauthorized("Missing or invalid authorization")
	}
	requestID := c.Param("requestId")
	if requestID == "" {
		return errors.NewBadRequest("requestId is required")
	}
	repo, err := requireAsyncRepo()
	if err != nil {
		return err
	}
	if err := repo.DeleteByRequestIDAndUser(requestID, userID); err != nil {
		return errors.NewInternalServerError("Failed to dismiss async request", err)
	}
	resp := model.CommonResponseStatusOK(map[string]string{"requestId": requestID})
	return c.JSON(resp.Status.Code, resp)
}

// ClearFinishedAsyncRequests DELETE /api/async-requests?finished=1
func ClearFinishedAsyncRequests(c echo.Context) error {
	userID := ResolveUserIDFromRequest(c)
	if userID == "" {
		return errors.NewUnauthorized("Missing or invalid authorization")
	}
	if c.QueryParam("finished") != "1" && c.QueryParam("finished") != "true" {
		return c.NoContent(http.StatusMethodNotAllowed)
	}
	repo, err := requireAsyncRepo()
	if err != nil {
		return err
	}
	if err := repo.DeleteFinishedByUser(userID); err != nil {
		return errors.NewInternalServerError("Failed to clear finished requests", err)
	}
	resp := model.CommonResponseStatusOK(map[string]string{"cleared": "finished"})
	return c.JSON(resp.Status.Code, resp)
}

// PersistTrackedProxyRequest upserts Handling before proxy Do (best-effort).
func PersistTrackedProxyRequest(
	c echo.Context,
	subsystemName, operationID, requestID string,
) {
	if requestID == "" || !strings.EqualFold(subsystemName, "mc-infra-manager") {
		return
	}
	db := repository.GetDB()
	if db == nil {
		return
	}
	if !service.IsAsyncTrackOperation(operationID) {
		return
	}
	userID := ResolveUserIDFromRequest(c)
	if userID == "" {
		log.Printf("async persist skip: no userId for requestId=%s op=%s", requestID, operationID)
		return
	}
	label := c.Request().Header.Get("x-mcwc-label")
	href := c.Request().Header.Get("x-mcwc-href")
	nsID := c.Request().Header.Get("x-mcwc-ns-id")
	if label == "" {
		label = operationID
	}
	row := &model.AsyncRequest{
		RequestID:   requestID,
		UserID:      userID,
		OperationID: operationID,
		Label:       label,
		Status:      model.AsyncStatusHandling,
		Href:        href,
		NsID:        nsID,
		StartedAt:   time.Now().UTC(),
	}
	repo := repository.NewAsyncRequestRepository(db)
	if err := repo.UpsertHandling(row); err != nil {
		log.Printf("async persist upsert error requestId=%s: %v", requestID, err)
	}
}

// MarkTrackedProxyError sets Error when proxy transport fails.
func MarkTrackedProxyError(requestID, message string) {
	db := repository.GetDB()
	if db == nil || requestID == "" {
		return
	}
	repo := repository.NewAsyncRequestRepository(db)
	_ = repo.UpdateStatus(requestID, model.AsyncStatusError, message)
}
