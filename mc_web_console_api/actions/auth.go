package actions

import (
	"mc_web_console_api/handler"
	"mc_web_console_api/handler/mciammanager"
	"mc_web_console_api/handler/self"
	"net/http"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
)

func AuthLogin(c buffalo.Context) error {
	commonResponse := &handler.CommonResponse{}
	commonRequest := &handler.CommonRequest{}
	c.Bind(commonRequest)

	if MCIAM_USE {
		commonResponse = mciammanager.McIamLogin(c, commonRequest)
		if commonResponse.Status.StatusCode != 200 && commonResponse.Status.StatusCode != 201 {
			return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
		}

		tx := c.Value("tx").(*pop.Connection)
		_, err := self.CreateUserSessFromResponseData(tx, commonResponse, commonRequest.Request.(map[string]interface{})["id"].(string))
		if err != nil {
			return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{"error": err.Error()}))
		}
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	} else {
		commonResponse = handler.CommonResponseStatusInternalServerError("NOT IMPL")
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}
}

func AuthLoginRefresh(c buffalo.Context) error {
	commonResponse := &handler.CommonResponse{}
	commonRequest := &handler.CommonRequest{}
	c.Bind(commonRequest)

	if MCIAM_USE {
		commonResponse = mciammanager.McIamLoginRefresh(c, commonRequest)
	} else {
		commonResponse = handler.CommonResponseStatusInternalServerError("NOT IMPL")
	}

	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func AuthLogout(c buffalo.Context) error {
	commonResponse := &handler.CommonResponse{}
	commonRequest := &handler.CommonRequest{}
	c.Bind(commonRequest)

	if MCIAM_USE {
		// rt, err := self.DestroyUserSessByAccesstokenforLogout(tx)

		// {
		// 	"refresh_token":"{{user_refresh_token}}"
		// }
		commonResponse = mciammanager.McIamLogout(c, commonRequest)
	} else {
		commonResponse = handler.CommonResponseStatusInternalServerError("NOT IMPL")
	}

	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func AuthGetUserInfo(c buffalo.Context) error {
	commonResponse := &handler.CommonResponse{}
	commonRequest := &handler.CommonRequest{}
	c.Bind(commonRequest)

	if MCIAM_USE {
		commonResponse = mciammanager.McIamGetUserInfo(c, commonRequest)
	} else {
		commonResponse = handler.CommonResponseStatusInternalServerError("NOT IMPL")
	}

	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}
