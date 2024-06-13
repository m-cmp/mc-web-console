package actions

import (
	"fmt"
	"net/http"

	"github.com/gobuffalo/buffalo"
	"github.com/mitchellh/mapstructure"

	mcmodels "mc_web_console_common_models"
)

func UserLoginHandler(c buffalo.Context) error {
	if c.Request().Method == "POST" {

		commonRequest := &CommonRequest{}
		if err := c.Bind(commonRequest); err != nil {
			return c.Render(http.StatusBadRequest,
				defaultRender.JSON(CommonResponseProvider(http.StatusBadRequest, err.Error())))
		}

		commonResponse, err := CommonCallerWithoutToken(http.MethodPost, APILoginPath, commonRequest)
		if err != nil {
			return c.Render(commonResponse.Status.StatusCode,
				defaultRender.JSON(CommonResponseProvider(commonResponse.Status.StatusCode, err.Error())))
		}

		accessTokenResponse := &mcmodels.AccessTokenResponse{}
		if err := mapstructure.Decode(commonResponse.ResponseData, accessTokenResponse); err != nil {
			return c.Render(http.StatusInternalServerError,
				defaultRender.JSON(CommonResponseProvider(http.StatusInternalServerError, err.Error())))
		}
		c.Session().Set("Authorization", accessTokenResponse.AccessToken)
		fmt.Print("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@", accessTokenResponse.AccessToken)
		return c.Render(http.StatusOK,
			defaultRender.JSON(CommonResponseProvider(http.StatusOK, map[string]string{
				"redirect": RootPathForRedirectString,
			})))
	}

	accessToken := c.Session().Get("Authorization")
	if accessToken != nil {
		c.Flash().Add("success", "You are already logged in.")
		return c.Redirect(http.StatusSeeOther,
			"webconsoleDepth1Depth2Depth3Path()",
			RootPathForRedirect,
		)
	}

	return c.Render(http.StatusOK, defaultRender.HTML("pages/auth/login.html"))
}

func UserLogoutHandler(c buffalo.Context) error {

	commonResponse, err := CommonCaller(http.MethodPost, APILogoutPath, &CommonRequest{}, c)
	if err != nil {
		return c.Render(commonResponse.Status.StatusCode,
			defaultRender.JSON(CommonResponseProvider(commonResponse.Status.StatusCode, err.Error())))
	}
	c.Session().Clear()
	if commonResponse.Status.StatusCode != 200 {
		return c.Render(commonResponse.Status.StatusCode,
			defaultRender.JSON(CommonResponseProvider(commonResponse.Status.StatusCode, commonResponse.ResponseData)))
	}
	c.Flash().Add("success", "Logout")
	return c.Redirect(http.StatusSeeOther, "authLoginPath()")
}

func UserRegisterpageHandler(c buffalo.Context) error {
	return c.Render(http.StatusOK, defaultRender.HTML("pages/auth/login.html"))
}
