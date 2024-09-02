package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/json"
	"io"
	"log"
	"os"

	"golang.org/x/crypto/bcrypt"
	"gopkg.in/yaml.v3"
)

type CmigAuthSetting struct {
	Setting Setting `yaml:"setting"`
	User    User    `yaml:"user"`
}

type Setting struct {
	EncryptionKey string `yaml:"encryptionKey"`
}

type User struct {
	Id        string `yaml:"id"`
	Password  string `yaml:"password"`
	FirstName string `yaml:"firstName"`
	LastName  string `yaml:"lastName"`
	Email     string `yaml:"email"`
}

var cmigAuthSetting CmigAuthSetting

var encryptionKey []byte

func init() {
	data, err := os.ReadFile("cmigauthsetting.yaml")
	if err != nil {
		log.Fatalf("error: %v", err)
	}
	err = yaml.Unmarshal(data, &cmigAuthSetting)
	if err != nil {
		log.Fatalf("error: %v", err)
	}

	hash := sha256.New()
	hash.Write([]byte(cmigAuthSetting.Setting.EncryptionKey))
	encryptionKey = hash.Sum(nil)
}

func saveUserToEncryptedFile(user *User, filename string) error {
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

	return os.WriteFile(filename, encryptedData, 0644)
}

func loadUserFromEncryptedFile(filename string) (*User, error) {
	encryptedData, err := os.ReadFile(filename)
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

func checkPassword(storedHash, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password))
	return err == nil
}

func main() {
	password := cmigAuthSetting.User.Password
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	user := &User{
		Id:        cmigAuthSetting.User.Id,
		Password:  string(hashedPassword),
		FirstName: cmigAuthSetting.User.FirstName,
		LastName:  cmigAuthSetting.User.LastName,
		Email:     cmigAuthSetting.User.Email,
	}

	filename := "../cmiguser.dat"

	err := saveUserToEncryptedFile(user, filename)
	if err != nil {
		log.Println("Error saving user:", err)
		return
	}
	log.Println("User saved to", filename)

	loadedUser, err := loadUserFromEncryptedFile(filename)
	if err != nil {
		log.Println("Error loading user:", err)
		return
	}
	log.Printf("Loaded User: %+v\n", loadedUser.Id)
}
