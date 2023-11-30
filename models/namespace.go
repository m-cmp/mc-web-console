package models

import (
	"encoding/json"
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
	"github.com/gobuffalo/validate/v3/validators"
	"github.com/gofrs/uuid"
)

// Namespace is used by pop to map your namespaces database table to your go code.
type Namespace struct {
	ID        string    `json:"id" db:"id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`

	NsName string `json:"name" db:"ns_name"`

	UserID      uuid.UUID `db:"user_id"`
	User        *MCUser   `belongs_to:"mc_users"`
	Description string    `json:"description" db:"description"`
}

// String is not required by pop and may be deleted
func (n Namespace) String() string {
	jn, _ := json.Marshal(n)
	return string(jn)
}

// Namespaces is not required by pop and may be deleted
type Namespaces []Namespace

// String is not required by pop and may be deleted
func (n Namespaces) String() string {
	jn, _ := json.Marshal(n)
	return string(jn)
}

// Validate gets run every time you call a "pop.Validate*" (pop.ValidateAndSave, pop.ValidateAndCreate, pop.ValidateAndUpdate) method.
// This method is not required and may be deleted.
func (n *Namespace) Validate(tx *pop.Connection) (*validate.Errors, error) {
	var err error
	return validate.Validate(
		&validators.StringIsPresent{Field: n.NsName, Name: "NsName"},
	), err
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate" method.
// This method is not required and may be deleted.
func (n *Namespace) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	var err error
	return validate.Validate(
		&validators.StringIsPresent{Field: n.NsName, Name: "NsName"},
	), err
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate" method.
// This method is not required and may be deleted.
func (n *Namespace) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	var err error
	return validate.Validate(
		&validators.StringIsPresent{Field: n.NsName, Name: "NsName"},
	), err
}
