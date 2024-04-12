package actions

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/validate"
	"github.com/gobuffalo/validate/validators"

	"models"
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

func McIamAuthLoginContorller(c buffalo.Context) error {
	user := &models.UserLogin{}
	if err := c.Bind(user); err != nil {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"err": err.Error()}))
	}

	validateErr := validate.Validate(
		&validators.StringIsPresent{Field: user.Id, Name: "id"},
		&validators.StringIsPresent{Field: user.Password, Name: "password"},
	)
	if validateErr.HasAny() {
		fmt.Println(validateErr)
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"err": validateErr.Error()}))
	}

	accessTokenResponse, err := getUserToken(user)
	if err != nil {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"err": err.Error()}))
	}

	return c.Render(http.StatusOK, r.JSON(accessTokenResponse))
}

func McIamAuthLogoutContorller(c buffalo.Context) error {
	accessTokenRequest := &models.AccessTokenRequest{}
	if err := c.Bind(accessTokenRequest); err != nil {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"Binderr": err.Error()}))
	}
	accessToken := c.Request().Header.Get("Authorization")

	validateErr := validate.Validate(
		&validators.StringIsPresent{Field: accessToken, Name: "Authorization"},
		&validators.StringIsPresent{Field: accessTokenRequest.RefreshToken, Name: "refresh_token"},
	)
	if validateErr.HasAny() {
		fmt.Println(validateErr)
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"validateErr": validateErr.Error()}))
	}

	jsonData, err := json.Marshal(accessTokenRequest)
	if err != nil {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"Marshalerr": err.Error()}))
	}

	endSessionPath := "/api/auth/logout"
	endSessionEndpoint := baseURL.ResolveReference(&url.URL{Path: endSessionPath})

	req, err := http.NewRequest("POST", endSessionEndpoint.String(), bytes.NewBuffer(jsonData))
	if err != nil {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"error": err.Error()}))
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", accessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"error": err.Error()}))
	}
	defer resp.Body.Close()

	if resp.StatusCode != 204 {
		return c.Render(resp.StatusCode,
			r.JSON(map[string]string{"code": resp.Status}))
	}

	return c.Render(http.StatusNoContent, nil)
}

func McIamAuthGetUserInfoContorller(c buffalo.Context) error {
	userInfo, err := getUserInfo(c)
	if err != nil {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"error": err.Error()}))
	}
	return c.Render(http.StatusOK, r.JSON(userInfo))
}

func McIamAuthGetUserValidateContorller(c buffalo.Context) error {
	_, err := getUserInfo(c)
	if err != nil {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"error": err.Error()}))
	}
	return c.Render(http.StatusOK, nil)
}

func McIamAuthMiddleware(next buffalo.Handler) buffalo.Handler {
	return func(c buffalo.Context) error {

		_, err := getUserInfo(c)
		if err != nil {
			return c.Render(http.StatusServiceUnavailable,
				r.JSON(map[string]string{"error": err.Error()}))
		}

		return next(c)
	}
}

func getUserInfo(c buffalo.Context) (models.UserInfo, error) {

	var userinfoReturn models.UserInfo

	accessToken := c.Request().Header.Get("Authorization")

	getUserInfoPath := "/api/auth/userinfo"
	getUserInfoEndpoint := baseURL.ResolveReference(&url.URL{Path: getUserInfoPath})

	req, err := http.NewRequest("GET", getUserInfoEndpoint.String(), nil)
	if err != nil {
		return userinfoReturn, err
	}
	req.Header.Set("Authorization", accessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return userinfoReturn, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println("Failed to read response body:", err)
		return userinfoReturn, err
	}

	if resp.StatusCode != 200 {
		return userinfoReturn, errors.New(string(respBody))
	}
	fmt.Println("#########", string(respBody))
	if err := json.Unmarshal([]byte(respBody), &userinfoReturn); err != nil {
		fmt.Println("JSON 파싱 에러:", err)
		return userinfoReturn, err
	}

	return userinfoReturn, nil
}

func getUserToken(user *models.UserLogin) (*models.AccessTokenResponse, error) {
	var accessTokenResponse models.AccessTokenResponse

	jsonData, err := json.Marshal(user)
	if err != nil {
		log.Println(err.Error())
		return &accessTokenResponse, err
	}

	tokenPath := "/api/auth/login"
	tokenEndpoint := baseURL.ResolveReference(&url.URL{Path: tokenPath})
	resp, err := http.Post(tokenEndpoint.String(), "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Println(err.Error())
		return &accessTokenResponse, err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Println("Failed to read response body:", err.Error())
		return &accessTokenResponse, err
	}

	if resp.StatusCode != 200 {
		log.Println(resp.Status)
		return &accessTokenResponse, errors.New(string(respBody))
	}

	jsonerr := json.Unmarshal(respBody, &accessTokenResponse)
	if jsonerr != nil {
		log.Println("Failed to parse response:", err.Error())
		return &accessTokenResponse, err
	}

	return &accessTokenResponse, nil
}
