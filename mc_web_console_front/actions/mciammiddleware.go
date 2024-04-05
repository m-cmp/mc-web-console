package actions

import (
	"net/http"
	"net/url"
	"os"

	"github.com/gobuffalo/buffalo"
)

var (
	mcIamManagerHost string
	baseURL          url.URL
)

func init() {
	mcIamManagerHost = os.Getenv("MCIAM_HOST")

	baseURL.Scheme = "http"
	baseURL.Host = mcIamManagerHost
}

func McIamAuthMiddleware(next buffalo.Handler) buffalo.Handler {
	return func(c buffalo.Context) error {
		accessToken := c.Session().Get("Authorization").(string)

		getUserInfoPath := "/api/auth/validate"
		getUserInfoEndpoint := baseURL.ResolveReference(&url.URL{Path: getUserInfoPath})

		req, err := http.NewRequest("GET", getUserInfoEndpoint.String(), nil)
		if err != nil {
			return c.Render(http.StatusServiceUnavailable,
				r.JSON(map[string]string{"error": err.Error()}))
		}
		req.Header.Set("Authorization", "Bearer "+accessToken)

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			return c.Render(http.StatusServiceUnavailable,
				r.JSON(map[string]string{"error": err.Error()}))
		}
		defer resp.Body.Close()

		if resp.Status != "200 OK" {
			// return c.Render(http.StatusUnauthorized,
			// 	r.JSON(map[string]string{"code": "401 Unauthorized"}))
			return c.Redirect(302, "/auth/login/")
		}
		return next(c)
	}
}
