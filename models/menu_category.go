package models

import (
	"encoding/json"
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
)

// MenuCategory is used by pop to map your menu_categories database table to your go code.
type MenuCategory struct {
	ID        string    `json:"id" db:"id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`

	CategoryName     string `json:"category_name" db:"category_name"`
	ParentCategoryID string `json:"parent_category_id" db:"parent_category_id"`
	Description      string `json:"description" db:"description"`
	Sort             int    `json:"sort" db:"sort"`
	UseYn            bool   `json:"use_yn" db:"use_yn"`
}

// String is not required by pop and may be deleted
func (m MenuCategory) String() string {
	jm, _ := json.Marshal(m)
	return string(jm)
}

// MenuCategories is not required by pop and may be deleted
type MenuCategories []MenuCategory

// String is not required by pop and may be deleted
func (m MenuCategories) String() string {
	jm, _ := json.Marshal(m)
	return string(jm)
}

// Validate gets run every time you call a "pop.Validate*" (pop.ValidateAndSave, pop.ValidateAndCreate, pop.ValidateAndUpdate) method.
// This method is not required and may be deleted.
func (m *MenuCategory) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate" method.
// This method is not required and may be deleted.
func (m *MenuCategory) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate" method.
// This method is not required and may be deleted.
func (m *MenuCategory) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}
