package actions

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"

	"github.com/gobuffalo/buffalo"
)

func SessionInitializer(c buffalo.Context) error {
	fmt.Println("SessionInitializer", ApiBaseHost.String()+c.Request().RequestURI)
	req, err := http.NewRequest(c.Request().Method, ApiBaseHost.String()+c.Request().RequestURI, c.Request().Body)
	if err != nil {
		return c.Render(http.StatusInternalServerError, defaultRender.JSON(map[string]interface{}{"error": err.Error()}))
	}
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return c.Render(http.StatusInternalServerError, defaultRender.JSON(map[string]interface{}{"error": err.Error()}))
	}
	defer resp.Body.Close()

	respBody, ioerr := io.ReadAll(resp.Body)
	if ioerr != nil {
		log.Println("Error CommonHttp reading response:", ioerr)
	}
	var data map[string]interface{}
	jsonerr := json.Unmarshal(respBody, &data)
	if jsonerr != nil {
		return c.Render(http.StatusInternalServerError, defaultRender.JSON(map[string]interface{}{"error": jsonerr.Error()}))
	}
	accessToken := data["responseData"].(map[string]interface{})["access_token"]
	c.Session().Set("Authorization", accessToken)
	return c.Render(http.StatusOK, defaultRender.JSON(map[string]interface{}{"status": "ok"}))
}

func UserLoginHandler(c buffalo.Context) error {
	return c.Render(http.StatusOK, defaultRender.HTML("pages/auth/login.html"))
}

func UserUnauthorizedHandler(c buffalo.Context) error {
	return c.Render(http.StatusOK, defaultRender.HTML("pages/auth/unauthorized.html"))
}

func UserLogoutHandler(c buffalo.Context) error {
	c.Session().Clear()
	return c.Render(http.StatusOK, defaultRender.HTML("pages/auth/logout.html"))
}
