package models

import (
	"encoding/json"
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
	"github.com/gofrs/uuid"
)

// RegionKeyvalue is used by pop to map your region_keyvalues database table to your go code.
type RegionKeyvalue struct {
	ID uuid.UUID `json:"id" db:"id"`

	RegionID uuid.UUID `json:"region_id" db:"region_id"`
	Region   *Region   `belongs_to:"region" fk_id:"region_id"`

	Key   string `json:"key" db:"key"`
	Value string `json:"value" db:"value"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

func (rv *RegionKeyvalue) Create(tx *pop.Connection) (*validate.Errors, error) {

	return tx.ValidateAndCreate(rv)
}

func (rv *RegionKeyvalue) Update(tx *pop.Connection) (*validate.Errors, error) {

	return tx.ValidateAndUpdate(rv)
}

// String is not required by pop and may be deleted
func (rv RegionKeyvalue) String() string {
	jr, _ := json.Marshal(rv)
	return string(jr)
}

// RegionKeyvalues is not required by pop and may be deleted
type RegionKeyvalues []RegionKeyvalue

// String is not required by pop and may be deleted
func (rv RegionKeyvalues) String() string {
	jr, _ := json.Marshal(rv)
	return string(jr)
}

// Validate gets run every time you call a "pop.Validate*" (pop.ValidateAndSave, pop.ValidateAndCreate, pop.ValidateAndUpdate) method.
// This method is not required and may be deleted.
func (rv *RegionKeyvalue) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate" method.
// This method is not required and may be deleted.
func (rv *RegionKeyvalue) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	var err error
	// return validate.Validate(
	// 	&validators.StringIsPresent{Field: rv.Key, Name: "Key"},
	// ), err
	return nil, err
	//return validate.NewErrors(), nil
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate" method.
// This method is not required and may be deleted.
func (rv *RegionKeyvalue) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	var err error
	// return validate.Validate(
	// 	&validators.StringIsPresent{Field: rv.Key, Name: "Key"},
	// ), err
	return nil, err
	//return validate.NewErrors(), nil
}
