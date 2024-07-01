package middleware

import (
	"context"
	"crypto/tls"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gobuffalo/buffalo"
	"github.com/golang-jwt/jwt"
	"github.com/lestrrat-go/jwx/jwk"
)

var MCIAMMANAGER = os.Getenv("MCIAMMANAGER")

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
	// TODO : TLSClientConfig InsecureSkipVerify 해제 v0.2.0 이후 작업예정
	customTransport := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify: true},
	}
	client := &http.Client{Transport: customTransport}
	var err error
	jwkSet, err = jwk.Fetch(context.Background(), MCIAMMANAGER+"/api/auth/certs", jwk.WithHTTPClient(client))
	if err != nil {
		panic("failed to fetch JWK: " + err.Error())
	}
}

func Middleware(role string) buffalo.MiddlewareFunc {
	return func(next buffalo.Handler) buffalo.Handler {
		return func(c buffalo.Context) error {
			accessToken := c.Session().Get("Authorization")
			if _, ok := accessToken.(string); !ok {
				log.Println("token is not exist")
				return c.Redirect(303, "/auth/unauthorized")
			}
			isvalid, err := IsTokenValid(c, accessToken.(string))
			if err != nil {
				log.Println(err.Error())
				return c.Redirect(303, "/auth/unauthorized")
			}
			if !isvalid {
				log.Println("token is invalid")
				return c.Redirect(303, "/auth/unauthorized")
			}
			if !IsTokenHasRole(c, role) {
				log.Println("role is invalid")
				return c.Redirect(303, "/auth/unauthorized")
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
