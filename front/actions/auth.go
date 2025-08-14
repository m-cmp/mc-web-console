package actions

import (
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/gobuffalo/buffalo"
)

func SessionInitializer(c buffalo.Context) error {
	req, err := http.NewRequest(c.Request().Method, ApiBaseHost.String()+c.Request().RequestURI, c.Request().Body)
	if err != nil {
		return c.Render(http.StatusInternalServerError, defaultRender.JSON(map[string]interface{}{"error": err.Error()}))
	}

	// Authorization 헤더 추가
	if authHeader := c.Request().Header.Get("Authorization"); authHeader != "" {
		req.Header.Set("Authorization", authHeader)
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
		return c.Render(http.StatusInternalServerError, defaultRender.JSON(map[string]interface{}{"error": ioerr.Error()}))
	}

	var data map[string]interface{}
	jsonerr := json.Unmarshal(respBody, &data)
	if jsonerr != nil {
		return c.Render(http.StatusInternalServerError, defaultRender.JSON(map[string]interface{}{"error": jsonerr.Error()}))
	}
	if resp.StatusCode != 200 {
		errmsg := data["responseData"].(map[string]interface{})["message"]
		log.Println("resp.StatusCode err :", errmsg)
		return c.Render(resp.StatusCode, defaultRender.JSON(map[string]interface{}{"message": errmsg}))
	}

	// access_token과 refresh_token을 각각 추출
	responseDataMap := data["responseData"].(map[string]interface{})
	accessToken := responseDataMap["access_token"].(string)
	refreshToken := responseDataMap["refresh_token"].(string)

	return c.Render(http.StatusOK, defaultRender.JSON(map[string]interface{}{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	}))
}

func UserLogin(c buffalo.Context) error {
	return c.Render(http.StatusOK, defaultRender.HTML("pages/auth/login.html"))
}

func UserLogout(c buffalo.Context) error {
	c.Session().Clear()
	return c.Render(http.StatusOK, defaultRender.HTML("pages/auth/logout.html"))
}

func UserUnauthorized(c buffalo.Context) error {
	return c.Render(http.StatusOK, defaultRender.HTML("pages/auth/unauthorized.html"))
}
