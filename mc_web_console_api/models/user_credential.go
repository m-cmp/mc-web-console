package models

import (
	"encoding/json"
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
	"github.com/gofrs/uuid"
)

// UserCredential is used by pop to map your user_credentials database table to your go code.
type UserCredential struct {
	ID uuid.UUID `json:"id" db:"id"`

	UserID uuid.UUID `json:"user_id" db:"user_id"`
	User   *User     `belongs_to:"user"`

	ProviderID string `json:"provider_id" db:"provider_id"`
	IsDefault  bool   `json:"is_default" db:"is_default"`

	CredentialID uuid.UUID   `json:"credential_id" db:"credential_id"`
	Credential   Credentials `has_many:"credentials"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

func (uc *UserCredential) Create(tx *pop.Connection) (*validate.Errors, error) {
	return tx.ValidateAndCreate(uc)
}

func (uc *UserCredential) Update(tx *pop.Connection) (*validate.Errors, error) {

	return tx.ValidateAndUpdate(uc)
}

// String is not required by pop and may be deleted
func (u UserCredential) String() string {
	ju, _ := json.Marshal(u)
	return string(ju)
}

// UserCredentials is not required by pop and may be deleted
type UserCredentials []UserCredential

// String is not required by pop and may be deleted
func (u UserCredentials) String() string {
	ju, _ := json.Marshal(u)
	return string(ju)
}

// Validate gets run every time you call a "pop.Validate*" (pop.ValidateAndSave, pop.ValidateAndCreate, pop.ValidateAndUpdate) method.
// This method is not required and may be deleted.
func (u *UserCredential) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate" method.
// This method is not required and may be deleted.
func (u *UserCredential) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate" method.
// This method is not required and may be deleted.
func (u *UserCredential) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}
