package models

import (
	"encoding/json"
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
	"github.com/gobuffalo/validate/v3/validators"
	"github.com/gofrs/uuid"
)

// Usersess is used by pop to map your usersesses database table to your go code.
type Usersess struct {
	ID               uuid.UUID `json:"id" db:"id"`
	UserID           string    `json:"user_id" db:"user_id"`
	AccessToken      string    `json:"access_token" db:"access_token"`
	ExpiresIn        float64   `json:"expires_in" db:"expires_in"`
	RefreshToken     string    `json:"refresh_token" db:"refresh_token"`
	RefreshExpiresIn float64   `json:"refresh_expires_in" db:"refresh_expires_in"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
}

// String is not required by pop and may be deleted
func (u Usersess) String() string {
	ju, _ := json.Marshal(u)
	return string(ju)
}

// Usersesses is not required by pop and may be deleted
type Usersesses []Usersess

// String is not required by pop and may be deleted
func (u Usersesses) String() string {
	ju, _ := json.Marshal(u)
	return string(ju)
}

// Validate gets run every time you call a "pop.Validate*" (pop.ValidateAndSave, pop.ValidateAndCreate, pop.ValidateAndUpdate) method.
// This method is not required and may be deleted.
func (u *Usersess) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.Validate(
		&validators.StringIsPresent{Field: u.UserID, Name: "UserID"},
		&validators.StringIsPresent{Field: u.AccessToken, Name: "AccessToken"},
		&validators.StringIsPresent{Field: u.RefreshToken, Name: "RefreshToken"},
	), nil
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate" method.
// This method is not required and may be deleted.
func (u *Usersess) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate" method.
// This method is not required and may be deleted.
func (u *Usersess) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}
