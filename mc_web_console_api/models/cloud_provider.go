package models

import (
	"encoding/json"
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
	"github.com/gobuffalo/validate/v3/validators"
)

// CloudProvider is used by pop to map your cloud_providers database table to your go code.
type CloudProvider struct {
	ProviderID   string `json:"provider_id" db:"id"`
	ProviderName string `json:"provider_name" db:"provider_name"`

	// CloudConnections []CloudConnection `has_many:"cloud_connection"`
	// Credentials      []Credential      `has_many:"credential"`
	// // CloudConnections []CloudConnection `json:"cloud_connections" has_many:"cloud_connections"`
	// // Credentials      []Credential      `json:"credentials" has_many:"credentials"`
	// Drivers []Driver `has_many:"driver"`
	// Regions []Region `has_many:"region"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// String is not required by pop and may be deleted
func (c CloudProvider) String() string {
	jc, _ := json.Marshal(c)
	return string(jc)
}

// CloudProviders is not required by pop and may be deleted
type CloudProviders []CloudProvider

// String is not required by pop and may be deleted
func (c CloudProviders) String() string {
	jc, _ := json.Marshal(c)
	return string(jc)
}

// Validate gets run every time you call a "pop.Validate*" (pop.ValidateAndSave, pop.ValidateAndCreate, pop.ValidateAndUpdate) method.
// This method is not required and may be deleted.
func (c *CloudProvider) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.Validate(
		&validators.StringIsPresent{Field: c.ProviderName, Name: "ProviderName"},
	), nil
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate" method.
// This method is not required and may be deleted.
func (c *CloudProvider) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate" method.
// This method is not required and may be deleted.
func (c *CloudProvider) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

func (c *CloudProvider) Create(tx *pop.Connection) (*validate.Errors, error) {
	return tx.ValidateAndCreate(c)
}
func (c *CloudProvider) Update(tx *pop.Connection) (*validate.Errors, error) {
	return tx.ValidateAndUpdate(c)
}
