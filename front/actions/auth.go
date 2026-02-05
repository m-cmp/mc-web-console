package actions

import (
	"encoding/json"
	"io"
	"log"
	"net/http"

	"github.com/labstack/echo-contrib/session"
	"github.com/labstack/echo/v4"
)

func SessionInitializer(c echo.Context) error {
	req, err := http.NewRequest(c.Request().Method, ApiBaseHost.String()+c.Request().RequestURI, c.Request().Body)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}

	// Authorization 헤더 추가
	if authHeader := c.Request().Header.Get("Authorization"); authHeader != "" {
		req.Header.Set("Authorization", authHeader)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
	}
	defer resp.Body.Close()

	respBody, ioerr := io.ReadAll(resp.Body)
	if ioerr != nil {
		log.Println("Error CommonHttp reading response:", ioerr)
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": ioerr.Error()})
	}

	var data map[string]interface{}
	jsonerr := json.Unmarshal(respBody, &data)
	if jsonerr != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{"error": jsonerr.Error()})
	}

	if resp.StatusCode != 200 {
		errmsg := data["responseData"].(map[string]interface{})["message"]
		log.Println("resp.StatusCode err :", errmsg)
		return c.JSON(resp.StatusCode, map[string]interface{}{"message": errmsg})
	}

	// access_token과 refresh_token을 각각 추출
	responseDataMap := data["responseData"].(map[string]interface{})
	accessToken := responseDataMap["access_token"].(string)
	refreshToken := responseDataMap["refresh_token"].(string)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
	})
}

func UserLogin(c echo.Context) error {
	// 로그인 페이지는 레이아웃 없이 렌더링
	return RenderWithoutLayout(c, http.StatusOK, "pages/auth/login.html", nil)
}

func UserLogout(c echo.Context) error {
	// Session clear
	sess, _ := session.Get("mc_web_console", c)
	sess.Options.MaxAge = -1
	sess.Save(c.Request(), c.Response())

	// 로그아웃 페이지는 레이아웃 없이 렌더링
	return RenderWithoutLayout(c, http.StatusOK, "pages/auth/logout.html", nil)
}

func UserUnauthorized(c echo.Context) error {
	// Unauthorized 페이지는 레이아웃 없이 렌더링
	return RenderWithoutLayout(c, http.StatusOK, "pages/auth/unauthorized.html", nil)
}
