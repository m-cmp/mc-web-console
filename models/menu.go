package models

import (
	"encoding/json"
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
)

// Menu is used by pop to map your menus database table to your go code.
type Menu struct {
	ID        string    `json:"id" db:"id"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`

	Name        string `json:"name" db:"name"`
	Alias       string `json:"alias" db:"-"` //DB 값이 NULL로 나와서 STRING 에 할당하지 못하여 우선 주석처리, TODO : Alias 기본값을 주거나, 모델에서 NULL을 허용하는 방법을 찾으면 될듯!
	Visible     bool   `json:"visible" db:"visible"`
	Description string `json:"description" db:"description"`
	Sort        int    `json:"sort" db:"sort"`

	// 사용하는 참조 : fk 설정이 해당 테이블에 되어있어야 함.
	MenuCategoryID string        `json:"menu_category_id" db:"menu_category_id"`
	MenuCategory   *MenuCategory `belongs_to:"menu_categories"`
}

// menu 구조 표시
type MenuItem struct {
	ID       string `json:"id" db:"id"`
	Name     string `json:"name" db:"name"`
	Alias    string `json:"alias" db:"alias"`
	Visible  bool   `json:"visible" db:"visible"`
	MenuSort int    `json:"menu_sort" db:"menu_sort"`

	ParentCategoryID string `json:"parent_category_id" db:"parent_category_id"`
	CategoryID       string `json:"category_id" db:"category_id"`
	CategoryName     string `json:"category_name" db:"category_name"`

	Level        int    `json:"level" db:"level"`
	Lp           string `json:"lp" db:"lp"`
	CategorySort int    `json:"category_sort" db:"category_sort"`
	UseYn        bool   `json:"use_yn" db:"use_yn"`
}

// 쿼리를 통해 menu 구조를 regurn할 때 사용
type MenuTree []MenuItem

// String is not required by pop and may be deleted
func (m Menu) String() string {
	jm, _ := json.Marshal(m)
	return string(jm)
}

// Menus is not required by pop and may be deleted
type Menus []Menu

// String is not required by pop and may be deleted
func (m Menus) String() string {
	jm, _ := json.Marshal(m)
	return string(jm)
}

// Validate gets run every time you call a "pop.Validate*" (pop.ValidateAndSave, pop.ValidateAndCreate, pop.ValidateAndUpdate) method.
// This method is not required and may be deleted.
func (m *Menu) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate" method.
// This method is not required and may be deleted.
func (m *Menu) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate" method.
// This method is not required and may be deleted.
func (m *Menu) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}
