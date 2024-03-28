package models

import (
	"encoding/json"
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
	"github.com/gofrs/uuid"
)

// CredentialKeyvalue is used by pop to map your credential_keyvalues database table to your go code.
type CredentialKeyvalue struct {
	ID uuid.UUID `json:"id" db:"id"`

	CredentialID uuid.UUID   `json:"credential_id" db:"credential_id"`
	Credential   *Credential `belongs_to:"credential"`

	Key   string `json:"key" db:"key"`
	Value string `json:"value" db:"value"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

func (cv *CredentialKeyvalue) Create(tx *pop.Connection) (*validate.Errors, error) {

	return tx.ValidateAndCreate(cv)
}

func (cv *CredentialKeyvalue) Update(tx *pop.Connection) (*validate.Errors, error) {

	return tx.ValidateAndUpdate(cv)
}

// String is not required by pop and may be deleted
func (c CredentialKeyvalue) String() string {
	jc, _ := json.Marshal(c)
	return string(jc)
}

// CredentialKeyvalues is not required by pop and may be deleted
type CredentialKeyvalues []CredentialKeyvalue

// String is not required by pop and may be deleted
func (c CredentialKeyvalues) String() string {
	jc, _ := json.Marshal(c)
	return string(jc)
}

// Validate gets run every time you call a "pop.Validate*" (pop.ValidateAndSave, pop.ValidateAndCreate, pop.ValidateAndUpdate) method.
// This method is not required and may be deleted.
func (c *CredentialKeyvalue) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate" method.
// This method is not required and may be deleted.
func (c *CredentialKeyvalue) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	//return validate.NewErrors(), nil
	return nil, nil
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate" method.
// This method is not required and may be deleted.
func (c *CredentialKeyvalue) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	//return validate.NewErrors(), nil
	return nil, nil
}
