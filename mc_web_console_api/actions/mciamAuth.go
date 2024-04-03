package actions

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/validate"
	"github.com/gobuffalo/validate/validators"

	"mc_web_console_api/iammodels"
)

var (
	mcIamManagerHost string
)

func init() {
	mcIamManagerHost = os.Getenv("MCIAM_HOST")
}

func MCAuthLoginHandler(c buffalo.Context) error {
	user := &iammodels.UserLogin{}
	user.Id = c.Request().FormValue("id")
	user.Password = c.Request().FormValue("password")

	validateErr := validate.Validate(
		&validators.StringIsPresent{Field: user.Id, Name: "id"},
		&validators.StringIsPresent{Field: user.Password, Name: "password"},
	)
	if validateErr.HasAny() {
		fmt.Println(validateErr)
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"err": validateErr.Error()}))
	}

	formData := url.Values{
		"id":       {user.Id},
		"password": {user.Password},
	}

	baseURL := &url.URL{
		Scheme: "http",
		Host:   mcIamManagerHost,
	}
	tokenPath := "/api/auth/login"
	tokenEndpoint := baseURL.ResolveReference(&url.URL{Path: tokenPath})
	req, _ := http.NewRequest("POST", tokenEndpoint.String(), strings.NewReader(formData.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"error": err.Error()}))
	}
	defer resp.Body.Close()

	if resp.Status != "200 OK" {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"code": resp.Status}))
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Failed to read response body:", err)
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"err": err.Error()}))
	}

	var accessTokenResponse iammodels.KeycloakAccessTokenResponse
	jsonerr := json.Unmarshal(respBody, &accessTokenResponse)
	if jsonerr != nil {
		fmt.Println("Failed to parse response:", err)
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"err": jsonerr.Error()}))
	}

	return c.Render(http.StatusOK, r.JSON(accessTokenResponse))
}

func MCAuthLogoutHandler(c buffalo.Context) error {

	return c.Render(http.StatusOK, r.JSON((map[string]string{"msg": "MCAuthLogoutHandler"})))
}

func MCAuthGetSecurityKeyHandler(c buffalo.Context) error {

	return c.Render(http.StatusOK, r.JSON((map[string]string{"msg": "MCAuthGetSecurityKeyHandler"})))
}
