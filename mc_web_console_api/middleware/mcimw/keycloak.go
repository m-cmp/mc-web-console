package mcimw

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/Nerzal/gocloak/v13"
	"github.com/gobuffalo/envy"
	"github.com/gobuffalo/validate/v3"
	"github.com/gobuffalo/validate/v3/validators"
)

type keycloak struct {
	KEYCLOAK_HOST          string
	KEYCLAOK_REALM         string
	KEYCLOAK               *gocloak.GoCloak
	KEYCLAOK_CLIENT        string
	KEYCLAOK_CLIENT_SECRET string
	KEYCLAOK_JWKSURL       string
}

type UserLogin struct {
	Id       string `json:"id"`
	Password string `json:"password"`
}

type UserLoginRefresh struct {
	RefreshToken string `json:"refresh_token"`
}

type UserLogout struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

var (
	EnvKeycloak = keycloak{
		KEYCLOAK_HOST:          envy.Get("KEYCLOAK_HOST", ""),
		KEYCLOAK:               gocloak.NewClient(envy.Get("KEYCLOAK_HOST", "")),
		KEYCLAOK_REALM:         envy.Get("KEYCLAOK_REALM", "mciam"),
		KEYCLAOK_CLIENT:        envy.Get("KEYCLAOK_CLIENT", "mciammanager"),
		KEYCLAOK_CLIENT_SECRET: envy.Get("KEYCLAOK_CLIENT_SECRET", "mciammanagerclientsecret"),
		KEYCLAOK_JWKSURL:       envy.Get("KEYCLOAK_HOST", "") + "/realms/" + envy.Get("KEYCLAOK_REALM", "mciam") + "/protocol/openid-connect/certs",
	}
)

func (k keycloak) AuthLoginHandler(res http.ResponseWriter, req *http.Request) {

	decoder := json.NewDecoder(req.Body)
	user := &UserLogin{}
	err := decoder.Decode(&user)
	if err != nil {
		res.WriteHeader(http.StatusBadRequest)
		fmt.Fprintln(res, err)
		return
	}
	defer req.Body.Close()

	validateErr := validate.Validate(
		&validators.StringIsPresent{Field: user.Id, Name: "id"},
		&validators.StringIsPresent{Field: user.Password, Name: "password"},
	)
	if validateErr.HasAny() {
		fmt.Println(validateErr)
		res.WriteHeader(http.StatusBadRequest)
		fmt.Fprintln(res, validateErr.Error())
		return
	}

	ctx := context.Background()
	accessTokenResponse, err := k.KEYCLOAK.Login(ctx, k.KEYCLAOK_CLIENT, k.KEYCLAOK_CLIENT_SECRET, k.KEYCLAOK_REALM, user.Id, user.Password)
	if err != nil {
		fmt.Println(err)
		res.WriteHeader(http.StatusBadRequest)
		fmt.Fprintln(res, err)
		return
	}

	jsonData, err := json.Marshal(accessTokenResponse)
	if err != nil {
		fmt.Println("JSON 변환 오류:", err)
		return
	}

	res.WriteHeader(http.StatusBadRequest)
	fmt.Fprintln(res, string(jsonData))
}

func (k keycloak) AuthLoginRefreshHandler(res http.ResponseWriter, req *http.Request) {

	decoder := json.NewDecoder(req.Body)
	user := &UserLoginRefresh{}
	err := decoder.Decode(&user)
	if err != nil {
		res.WriteHeader(http.StatusBadRequest)
		fmt.Fprintln(res, err)
		return
	}
	defer req.Body.Close()

	validateErr := validate.Validate(
		&validators.StringIsPresent{Field: user.RefreshToken, Name: "refresh_token"},
	)
	if validateErr.HasAny() {
		fmt.Println(validateErr)
		res.WriteHeader(http.StatusBadRequest)
		fmt.Fprintln(res, validateErr.Error())
		return
	}

	ctx := context.Background()
	accessTokenResponse, err := k.KEYCLOAK.RefreshToken(ctx, user.RefreshToken, k.KEYCLAOK_CLIENT, k.KEYCLAOK_CLIENT_SECRET, k.KEYCLAOK_REALM)
	if err != nil {
		fmt.Println(err)
		res.WriteHeader(http.StatusBadRequest)
		fmt.Fprintln(res, err)
		return
	}

	jsonData, err := json.Marshal(accessTokenResponse)
	if err != nil {
		fmt.Println("JSON 변환 오류:", err)
		return
	}

	res.WriteHeader(http.StatusBadRequest)
	fmt.Fprintln(res, string(jsonData))
}

func (k keycloak) AuthLogoutHandler(res http.ResponseWriter, req *http.Request) {

	decoder := json.NewDecoder(req.Body)
	user := &UserLogout{}
	err := decoder.Decode(&user)
	if err != nil {
		res.WriteHeader(http.StatusBadRequest)
		fmt.Fprintln(res, err)
		return
	}
	defer req.Body.Close()

	validateErr := validate.Validate(
		&validators.StringIsPresent{Field: user.RefreshToken, Name: "refresh_token"},
	)
	if validateErr.HasAny() {
		fmt.Println(validateErr)
		res.WriteHeader(http.StatusBadRequest)
		fmt.Fprintln(res, validateErr.Error())
		return
	}

	ctx := context.Background()
	err = k.KEYCLOAK.Logout(ctx, k.KEYCLAOK_CLIENT, k.KEYCLAOK_CLIENT_SECRET, k.KEYCLAOK_REALM, user.RefreshToken)
	if err != nil {
		fmt.Println(err)
		res.WriteHeader(http.StatusBadRequest)
		fmt.Fprintln(res, err)
		return
	}

	res.WriteHeader(http.StatusOK)
	fmt.Fprintln(res, nil)
}

func (k keycloak) AuthGetUserInfo(res http.ResponseWriter, req *http.Request) {
	accessToken := strings.TrimPrefix(req.Header.Get("Authorization"), "Bearer ")
	validateErr := validate.Validate(
		&validators.StringIsPresent{Field: accessToken, Name: "Authorization"},
	)
	if validateErr.HasAny() {
		fmt.Println(validateErr)
		res.WriteHeader(http.StatusBadRequest)
		fmt.Fprintln(res, validateErr.Error())
		return
	}

	ctx := context.Background()

	userinfo, err := k.KEYCLOAK.GetUserInfo(ctx, accessToken, k.KEYCLAOK_REALM)
	if err != nil {
		fmt.Println(err)
		res.WriteHeader(http.StatusBadRequest)
		fmt.Fprintln(res, err)
		return
	}

	jsonData, err := json.Marshal(userinfo)
	if err != nil {
		fmt.Println(err)
		res.WriteHeader(http.StatusBadRequest)
		fmt.Fprintln(res, err)
		return
	}

	res.WriteHeader(http.StatusOK)
	fmt.Fprintln(res, string(jsonData))
}

func (k keycloak) AuthGetUserValidate(res http.ResponseWriter, req *http.Request) {
	accessToken := strings.TrimPrefix(req.Header.Get("Authorization"), "Bearer ")
	validateErr := validate.Validate(
		&validators.StringIsPresent{Field: accessToken, Name: "Authorization"},
	)
	if validateErr.HasAny() {
		fmt.Println(validateErr)
		res.WriteHeader(http.StatusBadRequest)
		fmt.Fprintln(res, validateErr.Error())
		return
	}

	ctx := context.Background()

	_, err := k.KEYCLOAK.GetUserInfo(ctx, accessToken, k.KEYCLAOK_REALM)
	if err != nil {
		fmt.Println(err)
		res.WriteHeader(http.StatusBadRequest)
		fmt.Fprintln(res, err)
		return
	}

	res.WriteHeader(http.StatusOK)
	fmt.Fprintln(res, nil)
}
