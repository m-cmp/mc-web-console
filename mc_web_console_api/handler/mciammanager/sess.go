package mciammanager

import (
	"fmt"
	"log"
	"mc_web_console_api/handler"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/buffalo/render"

	"github.com/m-cmp/mc-iam-manager/iamtokenvalidator"
	"github.com/spf13/viper"
)

func init() {
	certEndPoint := getCertsEndpoint()
	err := iamtokenvalidator.GetPubkeyIamManager(certEndPoint)
	if err != nil {
		panic("Get jwks fail :" + err.Error())
	}
}

func getCertsEndpoint() string {
	viper.SetConfigName("api")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("./conf")
	if err := viper.ReadInConfig(); err != nil {
		log.Fatalf("Error reading config file, %s", err)
	}
	baseUrl := viper.Get("services.mc-iam-manager.baseurl").(string)
	certUri := viper.Get("serviceActions.mc-iam-manager.Getcerts.resourcePath").(string)
	fmt.Println("Cert Endpoint is : ", baseUrl+certUri)
	return baseUrl + certUri
}

func DefaultMiddleware(next buffalo.Handler) buffalo.Handler {
	return func(c buffalo.Context) error {
		fmt.Println("@@@@@DefaultMiddleware ")
		accessToken := strings.TrimPrefix(c.Request().Header.Get("Authorization"), "Bearer ")
		err := iamtokenvalidator.IsTokenValid(accessToken)
		if err != nil {
			log.Println(err.Error())
			return c.Render(http.StatusInternalServerError, render.JSON(map[string]interface{}{"error": err.Error()}))
		}
		claims, err := iamtokenvalidator.GetTokenClaimsByIamManagerClaims(accessToken)
		if err != nil {
			log.Println(err.Error())
			return c.Render(http.StatusInternalServerError, render.JSON(map[string]interface{}{"error": err.Error()}))
		}

		c.Set("Authorization", c.Request().Header.Get("Authorization"))
		c.Set("UserId", claims.UserId)           // need jwtprofile
		c.Set("UserName", claims.UserName)       // need jwtprofile
		c.Set("Roles", claims.RealmAccess.Roles) // need jwtprofile

		// c.Set("Email", claims.Email)             // need jwtprofile

		return next(c)
	}
}

func ApiMiddleware(next buffalo.Handler) buffalo.Handler {
	return func(c buffalo.Context) error {
		operationId := strings.ToLower(c.Param("operationId"))
		framework, _, _, err := handler.GetApiSpec(operationId)
		if err != nil || framework == "" {
			commonResponse := handler.CommonResponseStatusNotFound(operationId + "-" + err.Error())
			return c.Render(commonResponse.Status.StatusCode, render.JSON(commonResponse))
		}

		commonRequest := &handler.CommonRequest{
			Request: map[string]string{
				"framework":   framework,
				"operationid": operationId,
			},
		}
		commonResponse, err := handler.AnyCaller(c, "Getpermissionticket", commonRequest, true)
		if err != nil || commonResponse.Status.StatusCode != 200 {
			return c.Render(commonResponse.Status.StatusCode, render.JSON(commonResponse))
		}

		c.Set("Authorization", commonResponse.ResponseData.(map[string]interface{})["access_token"])

		return next(c)
	}
}

func SelfApiMiddleware(next buffalo.Handler) buffalo.Handler {
	return func(c buffalo.Context) error {
		operationId := strings.ToLower(strings.TrimPrefix(c.Request().RequestURI, "/api/"))
		framework, _, _, err := handler.GetApiSpec(operationId)
		if err != nil || framework == "" {
			commonResponse := handler.CommonResponseStatusNotFound(operationId + "-" + err.Error())
			return c.Render(commonResponse.Status.StatusCode, render.JSON(commonResponse))
		}
		commonRequest := &handler.CommonRequest{
			Request: map[string]string{
				"framework":   framework,
				"operationid": operationId,
			},
		}
		commonResponse, err := handler.AnyCaller(c, "Getpermissionticket", commonRequest, true)
		if err != nil || commonResponse.Status.StatusCode != 200 {
			return c.Render(commonResponse.Status.StatusCode, render.JSON(commonResponse))
		}

		c.Set("Authorization", commonResponse.ResponseData.(map[string]interface{})["access_token"])

		return next(c)
	}
}
