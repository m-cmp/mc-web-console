package models

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
	"github.com/gofrs/uuid"
)

// Region is used by pop to map your regions database table to your go code.
type Region struct {
	ID         uuid.UUID      `json:"id" db:"id"`
	RegionName string         `db:"region_name"`
	ProviderID string         `json:"provider_id" db:"provider_id"`
	Provider   *CloudProvider `belongs_to:"cloud_provider" fk_id:"provider_id"`

	RegionKeyValue RegionKeyvalues `has_many:"region_keyvalue"`
	//CloudConnections []CloudConnection `has_many:"cloud_connection"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// String is not required by pop and may be deleted
func (r Region) String() string {
	jr, _ := json.Marshal(r)
	return string(jr)
}

// Regions is not required by pop and may be deleted
type Regions []Region

// String is not required by pop and may be deleted
func (r Regions) String() string {
	jr, _ := json.Marshal(r)
	return string(jr)
}

func (r *Region) Create(tx *pop.Connection) (*validate.Errors, error) {
	log.Println("region ", r)
	return tx.ValidateAndCreate(r)
}

func (r *Region) Update(tx *pop.Connection) (*validate.Errors, error) {

	return tx.ValidateAndUpdate(r)
}

// Validate gets run every time you call a "pop.Validate*" (pop.ValidateAndSave, pop.ValidateAndCreate, pop.ValidateAndUpdate) method.
// This method is not required and may be deleted.
func (r *Region) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate" method.
// This method is not required and may be deleted.
func (r *Region) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	var err error
	// return validate.Validate(
	// 	&validators.StringIsPresent{Field: r.RegionName, Name: "RegionName"},
	// ), err
	return nil, err
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate" method.
// This method is not required and may be deleted.
func (r *Region) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	var err error
	// return validate.Validate(
	// 	&validators.StringIsPresent{Field: r.RegionName, Name: "RegionName"},
	// ), err
	return nil, err
	//return validate.NewErrors(), nil
}
