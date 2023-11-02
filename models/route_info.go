package models

import (
	"encoding/json"
	"time"

	"github.com/gobuffalo/nulls"
	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
	"github.com/gobuffalo/validate/v3/validators"
	"github.com/gofrs/uuid"
)

// RouteInfo is used by pop to map your route_infoes database table to your go code.
type RouteInfo struct {
	ID        uuid.UUID `json:"id" db:"id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`

	Method       string       `json:"method" db:"method"`
	Path         string       `json:"path" db:"path"`
	HandlerName  string       `json:"handler_name" db:"handler_name"`
	ResourceName nulls.String `json:"resource_name" db:"resource_name"`
	PathName     string       `json:"path_name" db:"path_name"`
	Aliases      nulls.String `json:"aliases" db:"aliases"`
}

// String is not required by pop and may be deleted
func (r RouteInfo) String() string {
	jr, _ := json.Marshal(r)
	return string(jr)
}

// RouteInfoes is not required by pop and may be deleted
type RouteInfoes []RouteInfo

// String is not required by pop and may be deleted
func (r RouteInfoes) String() string {
	jr, _ := json.Marshal(r)
	return string(jr)
}

// Validate gets run every time you call a "pop.Validate*" (pop.ValidateAndSave, pop.ValidateAndCreate, pop.ValidateAndUpdate) method.
// This method is not required and may be deleted.
func (r *RouteInfo) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.Validate(
		&validators.StringIsPresent{Field: r.Method, Name: "Method"},
		&validators.StringIsPresent{Field: r.Path, Name: "Path"},
		&validators.StringIsPresent{Field: r.HandlerName, Name: "HandlerName"},
		//&validators.StringIsPresent{Field: r.ResourceName, Name: "ResourceName"},
		&validators.StringIsPresent{Field: r.PathName, Name: "PathName"},
		//&validators.StringIsPresent{Field: r.Aliases, Name: "Aliases"},
	), nil
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate" method.
// This method is not required and may be deleted.
func (r *RouteInfo) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate" method.
// This method is not required and may be deleted.
func (r *RouteInfo) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}
