package models

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"

	//"github.com/gobuffalo/validate/validators"
	"github.com/gobuffalo/validate/v3/validators"
	"github.com/gofrs/uuid"
	"github.com/pkg/errors"
	"golang.org/x/crypto/bcrypt"
)

// MCUser is used by pop to map your mc_users database table to your go code.
type MCUser struct {
	ID                   uuid.UUID `json:"id" db:"id"`
	CreatedAt            time.Time `json:"created_at" db:"created_at"`
	UpdatedAt            time.Time `json:"updated_at" db:"updated_at"`
	Email                string    `json:"email" db:"email"`
	PasswordHash         string    `json:"password_hash" db:"password_hash"`
	UserLevel            string    `json:"user_level" db:"user_level"`
	Password             string    `json:"-" db:"-"`
	PasswordConfirmation string    `json:"-" db:"-"`

	UserNamespaces UserNamespaces `has_many:"user_namespaces"`
}

// String is not required by pop and may be deleted
func (m MCUser) String() string {
	jm, _ := json.Marshal(m)
	return string(jm)
}

// MCUsers is not required by pop and may be deleted
type MCUsers []MCUser

// String is not required by pop and may be deleted
func (m MCUsers) String() string {
	jm, _ := json.Marshal(m)
	return string(jm)
}

// Validate gets run every time you call a "pop.Validate*" (pop.ValidateAndSave, pop.ValidateAndCreate, pop.ValidateAndUpdate) method.
// This method is not required and may be deleted.
func (m *MCUser) Validate(tx *pop.Connection) (*validate.Errors, error) {
	var err error
	return validate.Validate(
		&validators.StringIsPresent{Field: m.Email, Name: "Email"},
		&validators.StringIsPresent{Field: m.PasswordHash, Name: "PasswordHash"},
		// check to see if the email address is already taken:
		&validators.FuncValidator{
			Field:   m.Email,
			Name:    "Email",
			Message: "%s is already taken",
			Fn: func() bool {
				var b bool

				q := tx.Where("email = ?", m.Email)
				if m.ID != uuid.Nil {
					q = q.Where("id != ?", m.ID)
				}
				b, err = q.Exists(m)
				if err != nil {
					return false
				}
				return !b
			},
		},
	), err
}

func (u *MCUser) Create(tx *pop.Connection) (*validate.Errors, error) {
	u.Email = strings.ToLower(u.Email)
	ph, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return validate.NewErrors(), errors.WithStack(err)
	}
	u.PasswordHash = string(ph)
	return tx.ValidateAndCreate(u)
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate" method.
// This method is not required and may be deleted.
func (m *MCUser) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	var err error
	return validate.Validate(
		&validators.StringIsPresent{Field: m.Password, Name: "Password"},
		&validators.StringsMatch{Name: "Password", Field: m.Password, Field2: m.PasswordConfirmation, Message: "Password does not match confirmation"},
	), err
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate" method.
// This method is not required and may be deleted.
func (m *MCUser) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}
