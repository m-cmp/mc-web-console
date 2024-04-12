package actions

import (
	"encoding/json"
	"io"
	"log"
	"mc_web_console_front/models"
	"net/http"
	"net/url"

	"github.com/gobuffalo/buffalo"
)

func McIamAuthMiddleware(next buffalo.Handler) buffalo.Handler {
	return func(c buffalo.Context) error {
		accessToken := c.Session().Get("Authorization")
		if accessToken == nil {
			log.Println("accessToken == nil")
			c.Flash().Add("danger", "No session")
			c.Session().Clear()
			return c.Redirect(http.StatusSeeOther, "authLoginPath()")
		}

		getUserInfoEndpoint := APIbaseHost.ResolveReference(&url.URL{Path: APIUserInfoPath})

		req, err := http.NewRequest("GET", getUserInfoEndpoint.String(), nil)
		if err != nil {
			c.Session().Clear()
			c.Flash().Add("danger", "Error creating authentication session request")
			return c.Redirect(http.StatusSeeOther, "/")
		}
		req.Header.Set("Authorization", "Bearer "+accessToken.(string))

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			c.Session().Clear()
			c.Flash().Add("danger", "Authentication Server Error")
			return c.Redirect(http.StatusSeeOther, "authLoginPath()")
		}
		defer resp.Body.Close()

		if resp.StatusCode != 200 {
			c.Session().Clear()
			c.Flash().Add("danger", "Session Expiration")
			return c.Redirect(http.StatusSeeOther, "authLoginPath()")
		}

		respBody, err := io.ReadAll(resp.Body)
		if err != nil {
			c.Session().Clear()
			c.Flash().Add("danger", "Authentication Info Error")
			return c.Redirect(http.StatusSeeOther, "authLoginPath()")
		}

		var userinfo models.UserInfo
		if err := json.Unmarshal([]byte(respBody), &userinfo); err != nil {
			c.Session().Clear()
			c.Flash().Add("danger", "Authentication Info Error")
			return c.Redirect(http.StatusSeeOther, "authLoginPath()")
		}

		c.Set("name", userinfo.Name)

		return next(c)
	}
}
