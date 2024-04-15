package models

import (
	"encoding/json"
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
	"github.com/gobuffalo/validate/v3/validators"
	"github.com/gofrs/uuid"
)

// Usersession is used by pop to map your usersessions database table to your go code.
type Usersession struct {
	ID uuid.UUID `json:"id" db:"id"` // DB idx - PK
	// Subject          string    `json:"subject" db:"subject"` // jwt 에서 유저에 대한 UUID
	AccessToken      string    `json:"access_token" db:"access_token"`
	ExpiresIn        int       `json:"expires_in" db:"expires_in"`
	RefreshToken     string    `json:"refresh_token" db:"refresh_token"`
	RefreshExpiresIn int       `json:"refresh_expires_in" db:"refresh_expires_in"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
}

// String is not required by pop and may be deleted
func (u Usersession) String() string {
	ju, _ := json.Marshal(u)
	return string(ju)
}

// Usersessions is not required by pop and may be deleted
type Usersessions []Usersession

// String is not required by pop and may be deleted
func (u Usersessions) String() string {
	ju, _ := json.Marshal(u)
	return string(ju)
}

// Validate gets run every time you call a "pop.Validate*" (pop.ValidateAndSave, pop.ValidateAndCreate, pop.ValidateAndUpdate) method.
// This method is not required and may be deleted.
func (u *Usersession) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.Validate(
		&validators.StringIsPresent{Field: u.ID.String(), Name: "Subject"},
		&validators.StringIsPresent{Field: u.AccessToken, Name: "AccessToken"},
		&validators.IntIsPresent{Field: u.ExpiresIn, Name: "ExpiresIn"},
		&validators.IntIsPresent{Field: u.RefreshExpiresIn, Name: "RefreshExpiresIn"},
		&validators.StringIsPresent{Field: u.RefreshToken, Name: "RefreshToken"},
	), nil
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate" method.
// This method is not required and may be deleted.
func (u *Usersession) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate" method.
// This method is not required and may be deleted.
func (u *Usersession) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}
