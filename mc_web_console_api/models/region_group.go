package models

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
	"github.com/gofrs/uuid"
)

// RegionGroup is used by pop to map your region_groups database table to your go code.
type RegionGroup struct {
	ID uuid.UUID `json:"region_group_id" db:"id"`

	RegionGroupName string `json:"region_group_name" db:"region_group_name"`

	// 사용하는 참조 : fk 설정이 해당 테이블에 되어있어야 함. transaction으로 호출해야 relation이 적용 됨. 그냥 query로 호출하면 null.
	ProviderID   string `json:"provider_id" db:"provider_id"`
	ProviderName string `json:"provider_name" db:"provider_name"` // raw query로 호출하여 return하기위해 추가
	//Provider   *CloudProvider `json:"cloud_providers,omitempty" belongs_to:"cloud_providers"`

	RegionID      uuid.UUID `json:"region_id" db:"region_id"`
	RegionName    string    `json:"region_name" db:"region_name"`         // raw query로 호출하여 return하기위해 추가
	CspRegionName string    `json:"csp_region_name" db:"csp_region_name"` // raw query로 호출하여 return하기위해 추가
	//Region   Region    `has_one:"regions" fk_id:"id"`
	//Region   Region    `has_one:"regions" fk_id:"region_id"`
	//Region Region `has_one:"regions" fk_id:"region_groups_region_id_fkey"`
	//Regions  []Region  `json:"regions,omitempty" belongs_to:"regions"`

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// String is not required by pop and may be deleted
func (r RegionGroup) String() string {
	jr, _ := json.Marshal(r)
	return string(jr)
}

// RegionGroups is not required by pop and may be deleted
type RegionGroups []RegionGroup

// String is not required by pop and may be deleted
func (r RegionGroups) String() string {
	jr, _ := json.Marshal(r)
	return string(jr)
}

// Validate gets run every time you call a "pop.Validate*" (pop.ValidateAndSave, pop.ValidateAndCreate, pop.ValidateAndUpdate) method.
// This method is not required and may be deleted.
func (r *RegionGroup) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate" method.
// This method is not required and may be deleted.
func (r *RegionGroup) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	var err error
	//return validate.NewErrors(), nil
	return nil, err
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate" method.
// This method is not required and may be deleted.
func (r *RegionGroup) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	var err error
	//return validate.NewErrors(), nil
	return nil, err
}

func (r *RegionGroup) Create(tx *pop.Connection) (*validate.Errors, error) {
	return tx.ValidateAndCreate(r)
}

func (r *RegionGroup) Destroy(tx *pop.Connection) error {
	err := tx.Destroy(r)
	return err
}

// Join문으로 Query하여 Return
func RegionGroupList(paramRegionGroup RegionGroup) ([]RegionGroup, error) {

	returnRegionGroups := []RegionGroup{}
	queryString := ""
	queryString += "SELECT region_groups.id, region_groups.region_group_name "
	queryString += ", regions.id as region_id, regions.region_name "
	queryString += ", cloud_providers.id as provider_id, cloud_providers.provider_name as provider_name "
	queryString += ", region_keyvalues.value as csp_region_name "
	queryString += "FROM region_groups "
	queryString += "JOIN cloud_providers ON cloud_providers.id = region_groups.provider_id "
	queryString += "JOIN regions ON regions.id = region_groups.region_id "
	queryString += "JOIN region_keyvalues ON region_groups.region_id = region_keyvalues.region_id "
	queryString += "WHERE 1 = 1 "
	queryString += "AND region_keyvalues.key = 'Region' "

	log.Println("rawquery ")
	log.Println("paramRegionGroup.ID ", paramRegionGroup.ID)

	whereParams := []interface{}{}
	if paramRegionGroup.ID != uuid.Nil {
		queryString += " AND region_groups.id = ? "
		whereParams = append(whereParams, paramRegionGroup.ID.String())
	}
	if paramRegionGroup.ProviderID != "" {
		queryString += " AND region_groups.provider_id = ? "
		whereParams = append(whereParams, paramRegionGroup.ProviderID)
	}
	if paramRegionGroup.RegionGroupName != "" {
		queryString += " AND region_groups.region_group_name = ? "
		whereParams = append(whereParams, paramRegionGroup.RegionGroupName)
	}
	if paramRegionGroup.RegionID != uuid.Nil {
		log.Println("where ")
		log.Println("paramRegionGroup.RegionID ", paramRegionGroup.RegionID)
		queryString += " AND regions.id = ? "
		whereParams = append(whereParams, paramRegionGroup.RegionID.String())
	}

	query := DB.RawQuery(queryString, whereParams...)
	//query := DB.RawQuery(queryString)

	err := query.All(&returnRegionGroups)
	//err := DB.RawQuery(queryString).All(&regionGroups)
	if err != nil {
		log.Println(err)
		return nil, err
	}
	return returnRegionGroups, nil
}
