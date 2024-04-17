package actions

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"

	"github.com/gobuffalo/buffalo"

	mcmodels "mc_web_console_common_models"
)

func McIamAuthMiddleware(next buffalo.Handler) buffalo.Handler {
	return func(c buffalo.Context) error {
		accessToken := c.Session().Get("Authorization")
		if accessToken == nil {
			c.Flash().Add("danger", "No session")
			c.Session().Clear()
			return c.Redirect(http.StatusSeeOther, "authLoginPath()")
		}

		userinfo, msg, err := getUserInfo(c)
		if err != nil {
			log.Println(err.Error())
			c.Session().Clear()
			c.Flash().Add("danger", msg)
			return c.Redirect(http.StatusSeeOther, "authLoginPath()")
		}

		fmt.Println("userinfo.Name", userinfo.Name)

		c.Set("name", userinfo.Name)

		return next(c)
	}
}

func getUserInfo(c buffalo.Context) (mcmodels.UserInfo, string, error) {
	userinfo := &mcmodels.UserInfo{}

	status, userinfoByte, err := CommonAPIGet(APIUserInfoPath, c)
	if err != nil {
		msg := status.Status + " Error Get Userinfo from MC-IAM-MANAGER"
		return *userinfo, msg, err
	}
	if status.StatusCode != 200 {
		msg := status.Status + " Error Get Userinfo from MC-IAM-MANAGER"
		return *userinfo, msg, errors.New(msg)
	}

	if err := json.Unmarshal([]byte(userinfoByte), &userinfo); err != nil {
		msg := "Authentication Info Error"
		return *userinfo, msg, err
	}

	return *userinfo, "", nil
}
