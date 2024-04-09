package actions

import (
	"net/http"
	"net/url"

	"github.com/gobuffalo/buffalo"
)

func McIamAuthMiddleware(next buffalo.Handler) buffalo.Handler {
	return func(c buffalo.Context) error {
		accessToken := c.Session().Get("Authorization")
		if accessToken == nil {
			c.Flash().Add("danger", "No session")
			c.Session().Clear()
			return c.Redirect(http.StatusUnauthorized, LoginPath)
		}

		getUserInfoEndpoint := APIbaseHost.ResolveReference(&url.URL{Path: APIValidatePath})

		req, err := http.NewRequest("GET", getUserInfoEndpoint.String(), nil)
		if err != nil {
			c.Session().Clear()
			c.Flash().Add("danger", "Error creating authentication session request")
			return c.Redirect(http.StatusUnauthorized, LoginPath)
		}
		req.Header.Set("Authorization", "Bearer "+accessToken.(string))

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			c.Session().Clear()
			c.Flash().Add("danger", "Authentication Server Error")
			return c.Redirect(http.StatusUnauthorized, LoginPath)
		}
		defer resp.Body.Close()

		if resp.Status != "200 OK" {
			c.Session().Clear()
			c.Flash().Add("danger", "Session Expiration")
			return c.Redirect(http.StatusUnauthorized, LoginPath)
		}

		return next(c)
	}
}
