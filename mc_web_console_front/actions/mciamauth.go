package actions

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/validate"
	"github.com/gobuffalo/validate/validators"

	mcmodels "mc_web_console_common_models"
)

func UserLoginHandler(c buffalo.Context) error {
	if c.Request().Method == "POST" {
		user := &mcmodels.UserLogin{}
		if err := c.Bind(user); err != nil {
			return c.Render(http.StatusBadRequest,
				r.JSON(map[string]string{"err": err.Error()}))
		}

		validateErr := validate.Validate(
			&validators.StringIsPresent{Field: user.Id, Name: "id"},
			&validators.StringIsPresent{Field: user.Password, Name: "password"},
		)
		if validateErr.HasAny() {
			log.Println(validateErr)
			return c.Render(http.StatusBadRequest,
				r.JSON(map[string]string{"err": validateErr.Error()}))
		}

		status, respBody, err := CommonAPIPostWithoutAccessToken(APILoginPath, user)
		if err != nil {
			log.Println(err.Error())
			return c.Render(status.StatusCode,
				r.JSON(map[string]string{"err": err.Error()}))
		}
		if status.StatusCode != 200 {
			return c.Render(status.StatusCode,
				r.JSON(map[string]string{"err": status.Status}),
			)
		}

		var accessTokenResponse mcmodels.AccessTokenResponse
		jsonerr := json.Unmarshal(respBody, &accessTokenResponse)
		if jsonerr != nil {
			log.Println(jsonerr.Error())
			return c.Render(http.StatusServiceUnavailable,
				r.JSON(map[string]string{"err": jsonerr.Error()}))
		}

		c.Session().Set("Authorization", accessTokenResponse.AccessToken)

		return c.Render(http.StatusOK,
			r.JSON(map[string]string{
				"redirect": RootPathForRedirectString,
			}))
	}

	accessToken := c.Session().Get("Authorization")
	if accessToken != nil {
		c.Flash().Add("success", "You are already logged in.")
		return c.Redirect(http.StatusSeeOther,
			"webconsoleDepth1Depth2Depth3Path()",
			RootPathForRedirect,
		)
	}

	return c.Render(http.StatusOK, r.HTML("auth/login.html"))
}

func UserLogoutHandler(c buffalo.Context) error {
	status, _, err := CommonAPIGet(APILogoutPath, c)
	if err != nil {
		log.Println(err.Error())
		return c.Render(status.StatusCode,
			r.JSON(map[string]string{"err": err.Error()}))
	}
	if status.StatusCode != 200 {
		return c.Render(status.StatusCode,
			r.JSON(map[string]string{"err": status.Status}),
		)
	}

	c.Session().Clear()
	c.Flash().Add("success", "Logout")
	return c.Redirect(http.StatusSeeOther, "authLoginPath()")
}

func UserRegisterpageHandler(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.HTML("auth/login.html"))
}

// func GetUserRefreshTokenHandler(c buffalo.Context) (mcmodels.AccessTokenResponse, string, error) {
// 	status, respBody, err := CommonAPIPost(APILoginRefreshPath, accessTokenRequest, c)
// }
