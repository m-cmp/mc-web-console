package actions

import (
	"log"
	"mc_web_console_api/handler"
	"mc_web_console_api/handler/self"
	"mc_web_console_api/models"
	"net/http"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
)

// SELF AUTH

func AuthLogin(c buffalo.Context) error {
	commonRequest := &handler.CommonRequest{}
	if err := c.Bind(commonRequest); err != nil {
		commonResponse := handler.CommonResponseStatusBadRequest(err)
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	id := commonRequest.Request.(map[string]interface{})["id"].(string)
	password := commonRequest.Request.(map[string]interface{})["password"].(string)

	tokenSet, err := self.GetUserToken(id, password)
	if err != nil {
		commonResponse := handler.CommonResponseStatusBadRequest(err)
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	tx := c.Value("tx").(*pop.Connection)
	userSess := &models.Usersess{
		UserID:           id,
		AccessToken:      tokenSet.Accresstoken,
		ExpiresIn:        float64(tokenSet.ExpiresIn),
		RefreshToken:     tokenSet.RefreshToken,
		RefreshExpiresIn: float64(tokenSet.RefreshExpiresIn),
	}
	_, err = self.CreateUserSess(tx, userSess)
	if err != nil {
		commonResponse := handler.CommonResponseStatusBadRequest(err)
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	commonResponse := handler.CommonResponseStatusOK(tokenSet)
	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func AuthLoginRefresh(c buffalo.Context) error {

	tx := c.Value("tx").(*pop.Connection)
	userId := c.Value("UserId").(string)
	sess, err := self.GetUserByUserId(tx, userId)
	if err != nil {
		app.Logger.Error(err.Error())
		commonResponse := handler.CommonResponseStatusBadRequest(err.Error())
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	tokenSet, err := self.RefreshAccessToken(sess.RefreshToken)
	if err != nil {
		app.Logger.Error(err.Error())
		commonResponse := handler.CommonResponseStatusBadRequest(err.Error())
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	sess.AccessToken = tokenSet.Accresstoken
	sess.ExpiresIn = float64(tokenSet.ExpiresIn)
	sess.RefreshToken = tokenSet.Accresstoken
	sess.RefreshExpiresIn = float64(tokenSet.RefreshExpiresIn)

	_, err = self.UpdateUserSess(tx, sess)
	if err != nil {
		app.Logger.Error(err.Error())
		commonResponse := handler.CommonResponseStatusBadRequest(err.Error())
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	commonResponse := handler.CommonResponseStatusOK(tokenSet)

	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func AuthLogout(c buffalo.Context) error {
	tx := c.Value("tx").(*pop.Connection)
	_, err := self.DestroyUserSessByAccesstokenforLogout(tx, c.Value("UserId").(string))
	if err != nil {
		log.Println("AuthLogout err : ", err.Error())
		commonResponse := handler.CommonResponseStatusBadRequest("no user session")
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}
	commonResponse := handler.CommonResponseStatusNoContent(nil)
	return c.Render(http.StatusOK, r.JSON(commonResponse))
}

func AuthUserinfo(c buffalo.Context) error {
	commonResponse := handler.CommonResponseStatusOK(map[string]interface{}{
		"userid":   c.Value("UserId").(string),
		"username": c.Value("UserName").(string),
		"email":    c.Value("Email").(string),
		"role":     c.Value("Role").(string),
	})
	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func AuthValidate(c buffalo.Context) error {
	commonResponse := handler.CommonResponseStatusOK(nil)
	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

// MCMP AUTH

func AuthMCIAMLogin(c buffalo.Context) error {
	commonRequest := &handler.CommonRequest{}
	c.Bind(commonRequest)

	commonResponse, _ := handler.AnyCaller(c, "login", commonRequest, false)
	if commonResponse.Status.StatusCode != 200 && commonResponse.Status.StatusCode != 201 {
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	tx := c.Value("tx").(*pop.Connection)
	_, err := self.CreateUserSessFromResponseData(tx, commonResponse, commonRequest.Request.(map[string]interface{})["id"].(string))
	if err != nil {
		return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{"error": err.Error()}))
	}

	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func AuthMCIAMLoginRefresh(c buffalo.Context) error {
	commonRequest := &handler.CommonRequest{}
	if err := c.Bind(commonRequest); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{"error": "Binding error: " + err.Error()}))
	}

	if commonRequest.Request == nil {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{"error": "Request data is missing"}))
	}

	requestData, ok := commonRequest.Request.(map[string]interface{})
	if !ok {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{"error": "Invalid request format"}))
	}

	_, hasRefreshToken := requestData["refresh_token"]
	if !hasRefreshToken {
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{"error": "refresh_token is required"}))
	}

	tx := c.Value("tx").(*pop.Connection)

	var refreshRes *handler.CommonResponse
	var err error

	if commonRequest.Request != nil {
		refreshRes, err = handler.AnyCaller(c, "loginrefresh", commonRequest, false)

		if err != nil {
			return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{"error": "AnyCaller error: " + err.Error()}))
		}
	} else {
		userId := c.Value("UserId")
		if userId == nil {
			return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{"error": "UserId not found in context"}))
		}

		sess, err := self.GetUserByUserId(tx, userId.(string))
		if err != nil {
			return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{"error": err.Error()}))
		}

		commonRequest.Request = map[string]interface{}{"refresh_token": sess.RefreshToken}

		refreshRes, err = handler.AnyCaller(c, "loginrefresh", commonRequest, false)

		if err != nil {
			return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{"error": "AnyCaller error: " + err.Error()}))
		}
	}

	if refreshRes == nil {
		return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{"error": "Response is nil from AnyCaller"}))
	}

	if refreshRes.Status.StatusCode != 200 {
		errorResponse := &handler.CommonResponse{
			ResponseData: refreshRes.ResponseData,
			Status: handler.WebStatus{
				StatusCode: refreshRes.Status.StatusCode,
				Message:    refreshRes.Status.Message,
			},
		}

		return c.Render(refreshRes.Status.StatusCode, r.JSON(errorResponse))
	}

	if refreshRes.ResponseData == nil {
		return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{"error": "ResponseData is nil from AnyCaller"}))
	}

	commonResponse := handler.CommonResponseStatusOK(refreshRes.ResponseData)

	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func AuthMCIAMLogout(c buffalo.Context) error {
	tx := c.Value("tx").(*pop.Connection)
	rt, err := self.DestroyUserSessByAccesstokenforLogout(tx, c.Value("UserId").(string))
	if err != nil {
		commonResponse := handler.CommonResponseStatusBadRequest(err.Error())
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}
	commonRequest := &handler.CommonRequest{
		Request: map[string]string{
			"refresh_token": rt,
		},
	}
	commonResponse, _ := handler.AnyCaller(c, "logout", commonRequest, true)
	return c.Render(http.StatusOK, r.JSON(commonResponse))
}

func AuthMCIAMUserinfo(c buffalo.Context) error {
	commonRequest := &handler.CommonRequest{}
	commonResponse, _ := handler.AnyCaller(c, "getuserinfo", commonRequest, true)
	return c.Render(200, r.JSON(commonResponse))
}

func AuthMCIAMValidate(c buffalo.Context) error {
	commonRequest := &handler.CommonRequest{}
	c.Bind(commonRequest)
	commonResponse, _ := handler.AnyCaller(c, "authgetuservalidate", commonRequest, true)
	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}
