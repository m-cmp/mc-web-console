package models

import (
	"encoding/json"
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
	"github.com/gobuffalo/validate/v3/validators"
	"github.com/gofrs/uuid"
)

// AuthSession is used by pop to map your auth_sessions database table to your go code.
type AuthSession struct {
	ID        uuid.UUID `json:"id" db:"id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`

	//MCUserID              uuid.UUID `json:"mcuser_id" db:"mcuser_id"`
	MCUserID              string    `json:"mcuser_id" db:"mcuser_id"` // iammanager에 전달할 ID 이므로 string으로
	MCAccessToken         string    `json:"mcaccess_token" db:"mcaccess_token"`
	IamManagerAccessToken string    `json:"iam_manager_access_token" db:"iam_manager_access_token"`
	ExpiredAt             time.Time `json:"expired_at" db:"expired_at"`
}

// String is not required by pop and may be deleted
func (a AuthSession) String() string {
	ja, _ := json.Marshal(a)
	return string(ja)
}

// AuthSessions is not required by pop and may be deleted
type AuthSessions []AuthSession

// String is not required by pop and may be deleted
func (a AuthSessions) String() string {
	ja, _ := json.Marshal(a)
	return string(ja)
}

// Validate gets run every time you call a "pop.Validate*" (pop.ValidateAndSave, pop.ValidateAndCreate, pop.ValidateAndUpdate) method.
// This method is not required and may be deleted.
func (a *AuthSession) Validate(tx *pop.Connection) (*validate.Errors, error) {
	var err error
	return validate.Validate(
		&validators.StringIsPresent{Name: "MCUserID", Field: a.MCUserID},
	), err
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate" method.
// This method is not required and may be deleted.
func (a *AuthSession) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	var err error
	return validate.Validate(
		&validators.StringIsPresent{Name: "MCUserID", Field: a.MCUserID},
	), err
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate" method.
// This method is not required and may be deleted.
func (a *AuthSession) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}
