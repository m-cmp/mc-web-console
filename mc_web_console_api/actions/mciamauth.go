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
	baseURL          url.URL
)

func init() {
	mcIamManagerHost = os.Getenv("MCIAM_HOST")

	baseURL.Scheme = "http"
	baseURL.Host = mcIamManagerHost
}

func McIamAuthLoginHandler(c buffalo.Context) error {
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

func McIamAuthLogoutHandler(c buffalo.Context) error {
	accessToken := c.Request().Header.Get("Authorization")
	refreshToken := c.Request().FormValue("refresh_token")

	validateErr := validate.Validate(
		&validators.StringIsPresent{Field: accessToken, Name: "Authorization"},
		&validators.StringIsPresent{Field: refreshToken, Name: "refresh_token"},
	)
	if validateErr.HasAny() {
		fmt.Println(validateErr)
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"err": validateErr.Error()}))
	}

	formData := url.Values{
		"refresh_token": {refreshToken},
	}

	endSessionPath := "/api/auth/logout"
	endSessionEndpoint := baseURL.ResolveReference(&url.URL{Path: endSessionPath})

	req, err := http.NewRequest("POST", endSessionEndpoint.String(), strings.NewReader(formData.Encode()))
	if err != nil {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"error": err.Error()}))
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Authorization", accessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"error": err.Error()}))
	}
	defer resp.Body.Close()

	if resp.Status != "204 No Content" {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"code": resp.Status}))
	}

	return c.Render(http.StatusNoContent, nil)
}

func McIamAuthGetUserInfoHandler(c buffalo.Context) error {
	accessToken := c.Request().Header.Get("Authorization")

	getUserInfoPath := "/api/auth/validate"
	getUserInfoEndpoint := baseURL.ResolveReference(&url.URL{Path: getUserInfoPath})

	req, err := http.NewRequest("GET", getUserInfoEndpoint.String(), nil)
	if err != nil {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"error": err.Error()}))
	}
	req.Header.Set("Authorization", accessToken)

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

	var userinfo map[string]interface{}
	if err := json.Unmarshal([]byte(respBody), &userinfo); err != nil {
		fmt.Println("JSON 파싱 에러:", err)
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"err": err.Error()}))
	}

	return c.Render(http.StatusOK, r.JSON(userinfo))
}
