package auth

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/validate"
	"github.com/gobuffalo/validate/validators"
	"github.com/gofrs/uuid"

	"mc_web_console_api/fwmodels/webconsole"
	"mc_web_console_api/models"
	"mc_web_console_api/util"

	mcmodels "mc_web_console_common_models"
)

var (
	mcIamManagerUrl            = util.MCIAMMANAGER
	getAccesstokenEndPoint     = mcIamManagerUrl + "/api/auth/login"
	accesstokenRefreshEndPoint = mcIamManagerUrl + "/api/auth/login/refresh"
	getUserInfoEndPoint        = mcIamManagerUrl + "/api/auth/userinfo"
	suspendAccesstokenEndPoint = mcIamManagerUrl + "/api/auth/logout"
)

func AuthMcIamLogin(c buffalo.Context, commonReq webconsole.CommonRequest) (webconsole.CommonResponse, error) {
	user := &mcmodels.UserLogin{}
	if err := c.Bind(user); err != nil {
		return webconsole.CommonResponseStatusBadRequest(nil), err
	}

	validateErr := validate.Validate(
		&validators.StringIsPresent{Field: user.Id, Name: "id"},
		&validators.StringIsPresent{Field: user.Password, Name: "password"},
	)
	if validateErr.HasAny() {
		return webconsole.CommonResponseStatusBadRequest(nil), validateErr
	}

	accessTokenResponse, err := getUserTokenWithIdPassword(user)
	if err != nil {
		return webconsole.CommonResponseStatusInternalServerError(nil), err
	}

	userInfo, err := getUserInfo("Bearer " + accessTokenResponse.AccessToken)
	if err != nil {
		return webconsole.CommonResponseStatusInternalServerError(nil), err
	}

	targetSubject, _ := uuid.FromString(userInfo.Sub)
	usersess := &models.Usersession{
		ID:               targetSubject,
		AccessToken:      accessTokenResponse.AccessToken,
		ExpiresIn:        accessTokenResponse.ExpiresIn,
		RefreshToken:     accessTokenResponse.RefreshToken,
		RefreshExpiresIn: accessTokenResponse.RefreshExpiresIn,
	}

	txerr := models.DB.Create(usersess)
	if txerr != nil {
		if strings.Contains(txerr.Error(), "SQLSTATE 23505") { // unique constraint violation catch
			txerr = models.DB.Update(usersess)
			if txerr != nil {
				return webconsole.CommonResponseStatusInternalServerError(nil), txerr
			}
		} else {
			return webconsole.CommonResponseStatusInternalServerError(nil), txerr
		}
	}

	return webconsole.CommonResponseStatusOK(accessTokenResponse), nil
}

// NOT IMPL
func AuthMcIamRefresh(c buffalo.Context, commonReq webconsole.CommonRequest) (webconsole.CommonResponse, error) {
	commonResponse := &webconsole.CommonResponse{}
	// headerAccessToken := c.Request().Header.Get("Authorization")
	// accessToken := strings.TrimPrefix(headerAccessToken, "Bearer ")

	// usersess := &models.Usersession{}
	// txerr := models.DB.Find(usersess, targetSubject)
	// if txerr != nil {
	// 	return c.Render(http.StatusBadRequest,
	// 		r.JSON(map[string]string{"txerr": txerr.Error()}))
	// }

	// accessTokenRequest := &mcmodels.AccessTokenRequest{}
	// if err := c.Bind(accessTokenRequest); err != nil {
	// 	return c.Render(http.StatusServiceUnavailable,
	// 		r.JSON(map[string]string{"err": err.Error()}))
	// }

	// validateErr := validate.Validate(
	// 	&validators.StringIsPresent{Field: accessTokenRequest.RefreshToken, Name: "refresh_token"},
	// )
	// if validateErr.HasAny() {
	// 	fmt.Println(validateErr)
	// 	return c.Render(http.StatusServiceUnavailable,
	// 		r.JSON(map[string]string{"err": validateErr.Error()}))
	// }

	// accessTokenResponse, err := getUserRefreshToken(accessTokenRequest, accessToken)
	// if err != nil {
	// 	return c.Render(http.StatusServiceUnavailable,
	// 		r.JSON(map[string]string{"err": err.Error()}))
	// }

	// userInfo, err := getUserInfo("Bearer " + accessTokenResponse.AccessToken)
	// if err != nil {
	// 	return c.Render(http.StatusServiceUnavailable,
	// 		r.JSON(map[string]string{"error": err.Error()}))
	// }

	// targetSubject, _ := uuid.FromString(userInfo.Sub)
	// usersess := &models.Usersession{
	// 	ID:               targetSubject,
	// 	AccessToken:      accessTokenResponse.AccessToken,
	// 	ExpiresIn:        accessTokenResponse.ExpiresIn,
	// 	RefreshToken:     accessTokenResponse.RefreshToken,
	// 	RefreshExpiresIn: accessTokenResponse.RefreshExpiresIn,
	// }

	// txerr := models.DB.Update(usersess)
	// if txerr != nil {
	// 	return c.Render(http.StatusServiceUnavailable,
	// 		r.JSON(map[string]string{"txerr": txerr.Error()}))
	// }

	// return c.Render(http.StatusOK, r.JSON(accessTokenResponse))
	return *commonResponse, nil
}

func AuthMcIamLogout(c buffalo.Context, commonReq webconsole.CommonRequest) (webconsole.CommonResponse, error) {
	accessToken := c.Request().Header.Get("Authorization")
	userInfo, err := getUserInfo(accessToken)
	if err != nil {
		return webconsole.CommonResponseStatusInternalServerError(nil), err
	}
	targetSubject, _ := uuid.FromString(userInfo.Sub)

	usersess := &models.Usersession{}
	txerr := models.DB.Find(usersess, targetSubject)
	if txerr != nil {
		return webconsole.CommonResponseStatusBadRequest(nil), txerr
	}

	validateErr := validate.Validate(
		&validators.StringIsPresent{Field: accessToken, Name: "Authorization"},
		&validators.StringIsPresent{Field: usersess.RefreshToken, Name: "refresh_token"},
	)
	if validateErr.HasAny() {
		return webconsole.CommonResponseStatusBadRequest(nil), validateErr
	}

	accessTokenRequest := &mcmodels.AccessTokenRequest{
		RefreshToken: usersess.RefreshToken,
	}

	status, _, err := util.CommonAPIPost(suspendAccesstokenEndPoint, accessTokenRequest, c)
	if err != nil {
		return webconsole.CommonResponseStatusInternalServerError(nil), err
	}
	if status.StatusCode != 200 {
		return webconsole.CommonResponseStatusInternalServerError(nil), errors.New(status.Status)
	}

	txerr = models.DB.Destroy(usersess)
	if txerr != nil {
		return webconsole.CommonResponseStatusInternalServerError(nil), txerr
	}

	return webconsole.CommonResponseStatusOK(nil), nil
}

func AuthMcIamGetUserInfo(c buffalo.Context, commonReq webconsole.CommonRequest) (webconsole.CommonResponse, error) {
	accessToken := c.Request().Header.Get("Authorization")
	userInfo, err := getUserInfo(accessToken)
	if err != nil {
		return webconsole.CommonResponseStatusInternalServerError(nil), err
	}
	return webconsole.CommonResponseStatusOK(userInfo), nil
}

func AuthMcIamGetUserValidate(c buffalo.Context, commonReq webconsole.CommonRequest) (webconsole.CommonResponse, error) {
	accessToken := c.Request().Header.Get("Authorization")
	_, err := getUserInfo(accessToken)
	if err != nil {
		return webconsole.CommonResponseStatusStatusUnauthorized(nil), err
	}
	return webconsole.CommonResponseStatusOK(nil), nil
}

func getUserInfo(accessToken string) (mcmodels.UserInfo, error) {

	var userinfoReturn mcmodels.UserInfo

	req, err := http.NewRequest("GET", getUserInfoEndPoint, nil)
	if err != nil {
		return userinfoReturn, err
	}
	req.Header.Set("Authorization", accessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return userinfoReturn, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Failed to read response body:", err)
		return userinfoReturn, err
	}

	if resp.StatusCode != 200 {
		return userinfoReturn, errors.New(resp.Status)
	}
	fmt.Println("#########", string(respBody))
	if err := json.Unmarshal([]byte(respBody), &userinfoReturn); err != nil {
		fmt.Println("JSON 파싱 에러:", err)
		return userinfoReturn, err
	}

	return userinfoReturn, nil
}

func getUserTokenWithIdPassword(user *mcmodels.UserLogin) (*mcmodels.AccessTokenResponse, error) {
	accessTokenResponse := &mcmodels.AccessTokenResponse{}

	status, data, err := util.CommonAPIPostWithoutAccessToken(getAccesstokenEndPoint, user)
	if err != nil {
		log.Println(err.Error())
		return accessTokenResponse, err
	}
	if status.StatusCode != 200 {
		log.Println("getUserToken Status err : ", status.Status)
		return accessTokenResponse, errors.New(status.Status)
	}

	jsonerr := json.Unmarshal(data, accessTokenResponse)
	if jsonerr != nil {
		log.Println("getUserToken Unmarshal err :", err.Error())
		return accessTokenResponse, err
	}

	return accessTokenResponse, nil
}

func getUserTokenWithRefreshToken(accessTokenRequest *mcmodels.AccessTokenRequest, c buffalo.Context) (*mcmodels.AccessTokenResponse, error) {
	accessTokenResponse := &mcmodels.AccessTokenResponse{}

	status, data, err := util.CommonAPIPost(accesstokenRefreshEndPoint, accessTokenRequest, c)
	if err != nil {
		log.Println(err.Error())
		return accessTokenResponse, err
	}
	if status.StatusCode != 200 {
		log.Println("getUserRefreshToken Status err : ", status.Status)
		return accessTokenResponse, errors.New(status.Status)
	}

	jsonerr := json.Unmarshal(data, accessTokenResponse)
	if jsonerr != nil {
		log.Println("getUserRefreshToken Unmarshal err :", err.Error())
		return accessTokenResponse, err
	}

	return accessTokenResponse, nil
}

// 외부에서 정의
// func AuthMcIamMiddleware(c buffalo.Handler) buffalo.Handler {
// 	return func(c buffalo.Context) error {
// 		accessToken := c.Request().Header.Get("Authorization")
// 		_, err := getUserInfo(accessToken)
// 		if err != nil {
// 			return c.Render(http.StatusServiceUnavailable,
// 				r.JSON(map[string]string{"error": err.Error()}))
// 		}

// 		return next(c)
// 	}
// }
