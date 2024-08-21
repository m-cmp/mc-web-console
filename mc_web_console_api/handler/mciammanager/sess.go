package mciammanager

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/buffalo/render"
	"github.com/golang-jwt/jwt/v4"

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

type webConsoleClaims struct {
	*jwt.RegisteredClaims
	UserId            string `json:"upn"`
	UserName          string `json:"name"`
	Email             string `json:"email"`
	PreferredUsername string `json:"preferred_username"`
	RealmAccess       struct {
		Roles []string `json:"roles"`
	} `json:"realm_access"`
}

func Middleware() buffalo.MiddlewareFunc {
	return func(next buffalo.Handler) buffalo.Handler {
		return func(c buffalo.Context) error {
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
}
