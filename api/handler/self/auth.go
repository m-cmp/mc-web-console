package self

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gopkg.in/yaml.v2"
)

type CmigAuthSetting struct {
	Setting Setting `yaml:"setting"`
	User    User    `yaml:"user"`
}

type Setting struct {
	Encryptionkey string `yaml:"encryptionkey"`
}

type User struct {
	Id        string `yaml:"id"`
	Password  string `yaml:"password"`
	FirstName string `yaml:"firstName"`
	LastName  string `yaml:"lastName"`
	Role      string `yaml:"role"`
	Email     string `yaml:"email"`
}

var (
	CmigUser        *User
	cmigAuthSetting CmigAuthSetting
	encryptionKey   []byte
	datfilename     = "../conf/selfiamuser.dat"
	conffilename    = "../conf/selfiamauthsetting.yaml"
)

func init() {
	MCIAM_USE, _ := strconv.ParseBool(os.Getenv("MCIAM_USE"))
	if !MCIAM_USE {
		initCmigAuth()
	}
}

func initCmigAuth() {
	data, err := os.ReadFile(conffilename)
	if err != nil {
		log.Fatalf("error: %v", err)
	}
	err = yaml.Unmarshal(data, &cmigAuthSetting)
	if err != nil {
		log.Fatalf("error: %v", err)
	}

	hash := sha256.New()
	if cmigAuthSetting.Setting.Encryptionkey == "" {
		log.Fatalf("error: %v", fmt.Errorf("encryptionkey is not provided"))
	}
	hash.Write([]byte(cmigAuthSetting.Setting.Encryptionkey))
	encryptionKey = hash.Sum(nil)

	CmigUser, err = loadUserFromEncryptedFile()
	if err != nil {
		log.Printf("Load User From Encrypted File Fail : %v\n", err)
		log.Printf("Trying to init user from %v\n", conffilename)

		password := cmigAuthSetting.User.Password
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		user := &User{
			Id:        cmigAuthSetting.User.Id,
			Password:  string(hashedPassword),
			FirstName: cmigAuthSetting.User.FirstName,
			LastName:  cmigAuthSetting.User.LastName,
			Role:      cmigAuthSetting.User.Role,
			Email:     cmigAuthSetting.User.Email,
		}

		err := saveUserToEncryptedFile(user)
		if err != nil {
			log.Fatalf("Error saving user: %v\n", err)
		}

		CmigUser, err = loadUserFromEncryptedFile()
		if err != nil {
			log.Fatalf("Load User From Encrypted File Fail : %v\n", err)
		}

		log.Println("User create success")
	}

	log.Println("Self User init success")
}

func loadUserFromEncryptedFile() (*User, error) {
	encryptedData, err := os.ReadFile(datfilename)
	if err != nil {
		return nil, err
	}

	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return nil, err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	nonceSize := gcm.NonceSize()
	nonce, ciphertext := encryptedData[:nonceSize], encryptedData[nonceSize:]

	decryptedData, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return nil, err
	}

	var user User
	err = json.Unmarshal(decryptedData, &user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func saveUserToEncryptedFile(user *User) error {
	userData, err := json.Marshal(user)
	if err != nil {
		return err
	}

	block, err := aes.NewCipher(encryptionKey)
	if err != nil {
		return err
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return err
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return err
	}

	encryptedData := gcm.Seal(nonce, nonce, userData, nil)

	return os.WriteFile(datfilename, encryptedData, 0644)
}

type UserLoginResponse struct {
	Accresstoken     string `json:"access_token"`
	ExpiresIn        int64  `json:"expires_in"`
	RefreshToken     string `json:"refresh_token"`
	RefreshExpiresIn int64  `json:"refresh_expires_in"`
}

type CmigAccesstokenClaims struct {
	*jwt.MapClaims
	Upn   string
	Name  string
	Email string
	Role  string
	Exp   int64
}

type CmigRefreshtokenClaims struct {
	*jwt.MapClaims
	Upn string
	Exp int64
}

func generateJWT() (*UserLoginResponse, error) {
	UserLoginRes := &UserLoginResponse{}

	exp := time.Now().Add(time.Minute * 10).Unix()

	claims := CmigAccesstokenClaims{
		Upn:   CmigUser.Id,
		Name:  CmigUser.LastName + " " + CmigUser.FirstName,
		Role:  CmigUser.Role,
		Email: CmigUser.Email,
		Exp:   exp,
		MapClaims: &jwt.MapClaims{
			"exp": exp,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString(encryptionKey)
	if err != nil {
		return nil, err
	}
	UserLoginRes.Accresstoken = signedToken
	UserLoginRes.ExpiresIn = exp

	refreshExp := time.Now().Add(time.Minute * 30).Unix()
	refreshClaims := CmigRefreshtokenClaims{
		Exp: exp,
		MapClaims: &jwt.MapClaims{
			"exp": exp,
		},
	}
	refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims)
	signedRefreshToken, err := refreshToken.SignedString(encryptionKey)
	if err != nil {
		return nil, err
	}
	UserLoginRes.RefreshToken = signedRefreshToken
	UserLoginRes.RefreshExpiresIn = refreshExp

	return UserLoginRes, nil
}

func GetUserToken(id string, password string) (*UserLoginResponse, error) {
	if CmigUser.Id == id {
		err := bcrypt.CompareHashAndPassword([]byte(CmigUser.Password), []byte(password))
		if err != nil {
			return nil, fmt.Errorf("unauthorized")
		}
		return generateJWT()
	}
	return nil, fmt.Errorf("unauthorized")
}

func RefreshAccessToken(refreshToken string) (*UserLoginResponse, error) {
	token, err := jwt.ParseWithClaims(refreshToken, &CmigAccesstokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return encryptionKey, nil
	})
	if err != nil {
		return nil, fmt.Errorf("token is invalid : %s", err.Error())
	}
	if claims, ok := token.Claims.(*CmigAccesstokenClaims); ok && token.Valid {
		if time.Now().Unix() > claims.Exp {
			return nil, fmt.Errorf("refresh token expired")
		}
		return generateJWT()
	} else {
		return nil, fmt.Errorf("token is invalid")
	}
}

func GetCmigTokenClaims(tokenString string) (*CmigAccesstokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &CmigAccesstokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return encryptionKey, nil
	})
	if err != nil {
		return nil, fmt.Errorf("token is invalid : %s", err.Error())
	}
	if claims, ok := token.Claims.(*CmigAccesstokenClaims); ok && token.Valid {
		return claims, nil
	} else {
		return nil, fmt.Errorf("token is invalid")
	}
}
