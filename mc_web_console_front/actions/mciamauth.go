package actions

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mc_web_console_front/models"
	"net/http"
	"net/url"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/validate"
	"github.com/gobuffalo/validate/validators"
)

func UserLoginpageHandler(c buffalo.Context) error {
	accessToken := c.Session().Get("Authorization")
	if accessToken != nil {
		c.Flash().Add("success", "You are already loged in")
		return c.Redirect(http.StatusFound, "/")
	}

	return c.Render(http.StatusOK, r.HTML("auth/login.html"))
}

func UserLoginHandler(c buffalo.Context) error {
	user := &models.UserLogin{}
	if err := c.Bind(user); err != nil {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"err": err.Error()}))
	}

	fmt.Println("###############", user)

	validateErr := validate.Validate(
		&validators.StringIsPresent{Field: user.Id, Name: "id"},
		&validators.StringIsPresent{Field: user.Password, Name: "password"},
	)
	if validateErr.HasAny() {
		fmt.Println(validateErr)
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"err": validateErr.Error()}))
	}

	jsonData, err := json.Marshal(user)
	if err != nil {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"err": validateErr.Error()}))
	}

	userLoginEndpoint := APIbaseHost.ResolveReference(&url.URL{Path: APILoginPath})

	resp, err := http.Post(userLoginEndpoint.String(), "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Println(err.Error())
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"err": validateErr.Error()}))
	}
	defer resp.Body.Close()

	if resp.Status != "200 OK" {
		fmt.Println(resp.Status)
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"err": resp.Status}))
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Println(err.Error())
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"err": err.Error()}))
	}

	var accessTokenResponse models.AccessTokenResponse
	jsonerr := json.Unmarshal(respBody, &accessTokenResponse)
	if jsonerr != nil {
		fmt.Println(jsonerr.Error())
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"err": jsonerr.Error()}))
	}

	c.Session().Set("Authorization", accessTokenResponse.AccessToken)

	fmt.Println("#### USER LOGIN SUCCESS ####", user)

	return c.Redirect(http.StatusFound, "/")
}

func UserRegisterpageHandler(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.HTML("auth/login.html"))
}
