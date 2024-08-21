package actions

import (
	"fmt"
	"mc_web_console_api/handler"
	"mc_web_console_api/handler/self"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
)

func AuthLogin(c buffalo.Context) error {
	commonRequest := &handler.CommonRequest{}
	c.Bind(commonRequest)

	commonResponse, _ := AnyCaller(c, "login", commonRequest, false)
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
	commonResponse, _ := AnyCaller(c, "loginrefresh", commonRequest, true)

	fmt.Println("@@@@@@@@@@@@@@@ commonResponse", commonResponse)

	tx := c.Value("tx").(*pop.Connection)
	fmt.Println("@@@@@@@@@@@@@@@ pop")
	_, err := self.UpdateUserSesssFromResponseData(tx, commonResponse, c.Value("UserId").(string))
	if err != nil {
		return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{"error": err.Error()}))
	}

	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func AuthLogout(c buffalo.Context) error {
	accessToken := strings.TrimPrefix(c.Request().Header.Get("Authorization"), "Bearer ")
	tx := c.Value("tx").(*pop.Connection)
	rt, err := self.DestroyUserSessByAccesstokenforLogout(tx, accessToken)
	if err != nil {
		commonResponse := handler.CommonResponseStatusBadRequest(err.Error())
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}
	commonRequest := &handler.CommonRequest{
		Request: map[string]string{
			"refresh_token": rt,
		},
	}
	commonResponse, _ := AnyCaller(c, "logout", commonRequest, true)
	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func AuthGetUserInfo(c buffalo.Context) error {
	commonRequest := &handler.CommonRequest{}
	c.Bind(commonRequest)
	commonResponse, _ := AnyCaller(c, "getuserinfo", commonRequest, true)
	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}
