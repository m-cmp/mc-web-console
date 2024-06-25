package mciammanager

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/buffalo/render"
	"github.com/golang-jwt/jwt"
	"github.com/lestrrat-go/jwx/jwk"
)

var (
	jwkSet jwk.Set
)

type CustomClaims struct {
	*jwt.StandardClaims
	Exp int `json:"exp"`
	// Iat            int      `json:"iat"`
	// Jti            string   `json:"jti"`
	// Iss            string   `json:"iss"`
	// Aud            string   `json:"aud"`
	Sub string `json:"sub"`
	// Typ            string   `json:"typ"`
	// Azp            string   `json:"azp"`
	// SessionState   string   `json:"session_state"`
	// Acr            string   `json:"acr"`
	// AllowedOrigins []string `json:"allowed-origins"`
	//
	RealmAccess struct {
		Roles []string `json:"roles"`
	} `json:"realm_access"`
	//
	// Scope             string   `json:"scope"`
	// Sid               string   `json:"sid"`
	Upn string `json:"upn"`
	// EmailVerified     bool     `json:"email_verified"`
	// Name              string   `json:"name"`
	// Groups            []string `json:"groups"`
	PreferredUsername string `json:"preferred_username"`
	// RealmRole []string `json:"realmRole"`
	// GivenName         string   `json:"given_name"`
	// FamilyName        string   `json:"family_name"`
	// Email             string   `json:"email"`
}

func init() {
	var err error
	jwkSet, err = jwk.Fetch(context.Background(), MCIAMMANAGER+"/api/auth/certs")
	if err != nil {
		panic("failed to fetch JWK: " + err.Error())
	}
}

func Middleware(role string) buffalo.MiddlewareFunc {
	return func(next buffalo.Handler) buffalo.Handler {
		return func(c buffalo.Context) error {
			accessToken := strings.TrimPrefix(c.Request().Header.Get("Authorization"), "Bearer ")
			isvalid, err := IsTokenValid(c, accessToken)
			if err != nil {
				log.Println(err.Error())
				return c.Render(http.StatusInternalServerError, render.JSON(map[string]interface{}{"error": err.Error()}))
			}
			if !isvalid {
				return c.Render(http.StatusUnauthorized, render.JSON(map[string]interface{}{"error": "token is invalid"}))
			}
			if !IsTokenHasRole(c, role) {
				return c.Render(http.StatusUnauthorized, render.JSON(map[string]interface{}{"error": "role is invalid"}))
			}
			return next(c)
		}
	}
}

func IsTokenValid(c buffalo.Context, tokenString string) (bool, error) {
	token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, keyfunction)
	if err != nil {
		return false, fmt.Errorf("failed to parse token: %s", err.Error())
	}

	if claims, ok := token.Claims.(*CustomClaims); ok && token.Valid {
		c.Set("Sub", claims.Sub)
		c.Set("PreferredUsername", claims.PreferredUsername)
		c.Set("RealmAccessRoles", claims.RealmAccess.Roles)
		c.Set("Upn", claims.Upn)
		return true, nil
	} else {
		return false, nil
	}
}

func IsTokenHasRole(c buffalo.Context, role string) bool {
	if role == "" {
		return true
	}
	realmAccess := c.Value("RealmAccessRoles").([]string)
	return contains(realmAccess, role)
}

func keyfunction(token *jwt.Token) (interface{}, error) {
	if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
		return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
	}
	kid := token.Header["kid"].(string)
	keys, nokey := jwkSet.LookupKeyID(kid)
	if !nokey {
		return nil, fmt.Errorf("no keys found for kid: %s", kid)
	}
	var raw interface{}
	if err := keys.Raw(&raw); err != nil {
		return nil, fmt.Errorf("failed to get key: %s", err)
	}
	return raw, nil
}

func contains(slice []string, item string) bool {
	for _, v := range slice {
		if v == item {
			return true
		}
	}
	return false
}
