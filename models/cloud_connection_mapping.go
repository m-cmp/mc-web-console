package models

import (
	"encoding/json"
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
	"github.com/gobuffalo/validate/v3/validators"
	"github.com/gofrs/uuid"
)

// CloudConnectionMapping is used by pop to map your cloud_connection_mappings database table to your go code.
type CloudConnectionMapping struct {
	ID        uuid.UUID `json:"id" db:"id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`

	Status       string `json:"status" db:"status"`               // C:Create, D:Delete, U:Update
	ResourceType string `json:"resource_type" db:"resource_type"` // vpc, securitygroup, sshkey, vmimage, vmspec, nlb, vm, mckscontrolplane, mcksworkernode, pmks
	ResourceID   string `json:"resource_id" db:"resource_id"`     // 해당 resource의 ID를 string으로
	ResourceName string `json:"resource_name" db:"resource_name"` // 해당 resource의 ID를 string으로

	NamespaceID   string `json:"namespace_id" db:"namespace_id"`
	NamespaceName string `json:"namespace_name" db:"namespace_name"`

	CredentialID uuid.UUID   `json:"credential_id" db:"credential_id"`
	Credential   *Credential `belongs_to:"credential"`

	CloudConnectionID uuid.UUID        `json:"connection_id" db:"connection_id"`
	CloudConnection   *CloudConnection `belongs_to:"cloud_connection"`
}

// String is not required by pop and may be deleted
func (c CloudConnectionMapping) String() string {
	jc, _ := json.Marshal(c)
	return string(jc)
}

// CloudConnectionMappings is not required by pop and may be deleted
type CloudConnectionMappings []CloudConnectionMapping

// String is not required by pop and may be deleted
func (c CloudConnectionMappings) String() string {
	jc, _ := json.Marshal(c)
	return string(jc)
}

// Validate gets run every time you call a "pop.Validate*" (pop.ValidateAndSave, pop.ValidateAndCreate, pop.ValidateAndUpdate) method.
// This method is not required and may be deleted.
func (c *CloudConnectionMapping) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate" method.
// This method is not required and may be deleted.
func (c *CloudConnectionMapping) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	var err error
	return validate.Validate(
		&validators.StringIsPresent{Field: c.ResourceID, Name: "ResourceID"},
	), err
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate" method.
// This method is not required and may be deleted.
func (c *CloudConnectionMapping) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	var err error
	return validate.Validate(
		&validators.StringIsPresent{Field: c.ResourceID, Name: "ResourceID"},
	), err
}
