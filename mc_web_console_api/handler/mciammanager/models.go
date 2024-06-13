package mciammanager

import (
	"time"

	"github.com/gofrs/uuid"
)

type usersession struct {
	ID               uuid.UUID `json:"id" db:"id"` // DB idx - PK
	AccessToken      string    `json:"access_token" db:"access_token"`
	ExpiresIn        int       `json:"expires_in" db:"expires_in"`
	RefreshToken     string    `json:"refresh_token" db:"refresh_token"`
	RefreshExpiresIn int       `json:"refresh_expires_in" db:"refresh_expires_in"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
}

type mciammanagerAccessTokenResponse struct {
	AccessToken      string `json:"access_token" mapstructure:"access_token"`
	ExpiresIn        int    `json:"expires_in" mapstructure:"expires_in"`
	RefreshExpiresIn int    `json:"refresh_expires_in" mapstructure:"refresh_expires_in"`
	RefreshToken     string `json:"refresh_token" mapstructure:"refresh_token"`
	TokenType        string `json:"token_type" mapstructure:"token_type"`
	NotBeforePolicy  int    `json:"not-before-policy" mapstructure:"not-before-policy"`
	SessionState     string `json:"session_state" mapstructure:"session_state"`
	Scope            string `json:"scope" mapstructure:"scope"`
}
type mciammanagerAccessTokenRefeshRequset struct {
	RefreshToken string `json:"refresh_token" mapstructure:"refresh_token"`
}
