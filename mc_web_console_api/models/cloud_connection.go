package models

import (
	"encoding/json"
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
	"github.com/gofrs/uuid"
)

// CloudConnection is used by pop to map your cloud_connections database table to your go code.
type CloudConnection struct {
	ID             uuid.UUID `json:"connection_id" db:"id"`
	ConnectionName string    `db:"connection_name"`

	// 사용하는 참조 : fk 설정이 해당 테이블에 되어있어야 함.
	ProviderID string         `json:"provider_id" db:"provider_id"`
	Provider   *CloudProvider `belongs_to:"cloud_provider"`

	CredentialID uuid.UUID   `json:"credential_id" db:"credential_id"`
	Credential   *Credential `belongs_to:"cloud_credential"`

	DriverID uuid.UUID `json:"driver_id" db:"driver_id"`
	Driver   *Driver   `belongs_to:"driver"`

	RegionID uuid.UUID `json:"region_id" db:"region_id"`
	Region   *Region   `belongs_to:"region"`

	// 사용 될 참조
	//CloudConnections    CloudConnections    `has_many:"cloud_connection"`
	//CredentialKeyValues CredentialKeyvalues `has_many:"credential_keyvalue"` // 여러개는 객체

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// String is not required by pop and may be deleted
func (c CloudConnection) String() string {
	jc, _ := json.Marshal(c)
	return string(jc)
}

// CloudConnections is not required by pop and may be deleted
type CloudConnections []CloudConnection

// String is not required by pop and may be deleted
func (c CloudConnections) String() string {
	jc, _ := json.Marshal(c)
	return string(jc)
}

// Validate gets run every time you call a "pop.Validate*" (pop.ValidateAndSave, pop.ValidateAndCreate, pop.ValidateAndUpdate) method.
// This method is not required and may be deleted.
func (c *CloudConnection) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate" method.
// This method is not required and may be deleted.
func (c *CloudConnection) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate" method.
// This method is not required and may be deleted.
func (c *CloudConnection) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

func (c *CloudConnection) Create(tx *pop.Connection) (*validate.Errors, error) {
	return tx.ValidateAndCreate(c)
}
func (c *CloudConnection) Update(tx *pop.Connection) (*validate.Errors, error) {
	return tx.ValidateAndUpdate(c)
}
