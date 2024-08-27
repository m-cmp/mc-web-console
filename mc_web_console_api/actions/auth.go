package actions

import (
	"mc_web_console_api/handler"
	"mc_web_console_api/handler/self"
	"net/http"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
)

func AuthLogin(c buffalo.Context) error {
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

func AuthLoginRefresh(c buffalo.Context) error {
	commonRequest := &handler.CommonRequest{}
	c.Bind(commonRequest)

	tx := c.Value("tx").(*pop.Connection)
	var refreshRes *handler.CommonResponse

	if commonRequest.Request != nil {
		refreshRes, _ = handler.AnyCaller(c, "loginrefresh", commonRequest, true)
	} else {
		sess, err := self.GetUserByUserId(tx, c.Value("UserId").(string))
		if err != nil {
			return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{"error": err.Error()}))
		}
		commonRequest.Request = map[string]interface{}{"refresh_token": sess.RefreshToken}
		refreshRes, _ = handler.AnyCaller(c, "loginrefresh", commonRequest, true)
	}

	_, err := self.UpdateUserSesssFromResponseData(tx, refreshRes, c.Value("UserId").(string))
	if err != nil {
		return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{"error": err.Error()}))
	}

	return c.Render(refreshRes.Status.StatusCode, r.JSON(refreshRes))
}

func AuthLogout(c buffalo.Context) error {
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

func AuthUserinfo(c buffalo.Context) error {
	return c.Render(200, r.JSON(map[string]interface{}{
		"userId":   c.Value("UserId"),
		"userName": c.Value("UserName"),
		"roles":    c.Value("Roles"),
	}))
}

func AuthValidate(c buffalo.Context) error {
	commonRequest := &handler.CommonRequest{}
	c.Bind(commonRequest)
	commonResponse, _ := handler.AnyCaller(c, "authgetuservalidate", commonRequest, true)
	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}
