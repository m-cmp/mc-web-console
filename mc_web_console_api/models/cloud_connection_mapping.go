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
	ID uuid.UUID `json:"id" db:"id"`

	CredentialID uuid.UUID   `json:"credential_id" db:"credential_id"`
	Credential   *Credential `belongs_to:"credential"`

	CloudConnectionID uuid.UUID        `json:"connection_id" db:"connection_id"`
	CloudConnection   *CloudConnection `belongs_to:"cloud_connection"`

	Status       string `json:"status" db:"status"`               // C:Create, D:Delete, U:Update
	ResourceType string `json:"resource_type" db:"resource_type"` // vpc, securitygroup, sshkey, vmimage, vmspec, nlb, vm, mckscontrolplane, mcksworkernode, pmks
	ResourceID   string `json:"resource_id" db:"resource_id"`     // 해당 resource의 ID를 string으로
	ResourceName string `json:"resource_name" db:"resource_name"` // 해당 resource의 ID를 string으로

	NamespaceID   string `json:"namespace_id" db:"namespace_id"`
	NamespaceName string `json:"namespace_name" db:"namespace_name"`

	// 1안 connection , csp, region, zone, credential ?

	// 쿼리로 csp, region 을 받아 user의 credential로 connection 조회
	// 생성의 경우 선행 작업에서 사용한 connection 사용
	// 선행작업이 없는 경우 credential random가능
	//

	// 2안 resourceType, resourceId, connection, credential
	// 사용되는 connection은 mapping 테이블에 저장
	// 생성의 경우 csp, region으로 credential과 함께 connection 조회
	//  선행작업이 있는 경우 이전 connection 사용
	// -> 이전 리소스 ID 가 넘어올 것이므로 해당 connection return
	//  선행작업이 없는 경우 credential random 가능

	// mapping table : connection으로 mapping table 넣는다??
	// resource 생성할 때,
	// ex) vnet 생성 시. mapping테이블에 credential, connection, resource_type="vpc", resource_id = "vpcID" 로 insert
	// -> sg 생성시 vnet 선택하면 mapping table에 resource_type = "vpc", resource_id = "vpcID" 로 조회하여 connection 과 credential 가져온다.
	// -> 사용할 credential 과 vpc 생성한 credential이 다르면 validation failed

	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// String is not required by pop and may be deleted
func (cm CloudConnectionMapping) String() string {
	jc, _ := json.Marshal(cm)
	return string(jc)
}

// CloudConnectionMappings is not required by pop and may be deleted
type CloudConnectionMappings []CloudConnectionMapping

// String is not required by pop and may be deleted
func (cm CloudConnectionMappings) String() string {
	jc, _ := json.Marshal(cm)
	return string(jc)
}

// Validate gets run every time you call a "pop.Validate*" (pop.ValidateAndSave, pop.ValidateAndCreate, pop.ValidateAndUpdate) method.
// This method is not required and may be deleted.
func (cm *CloudConnectionMapping) Validate(tx *pop.Connection) (*validate.Errors, error) {
	return validate.NewErrors(), nil
}

// ValidateCreate gets run every time you call "pop.ValidateAndCreate" method.
// This method is not required and may be deleted.
func (cm *CloudConnectionMapping) ValidateCreate(tx *pop.Connection) (*validate.Errors, error) {
	var err error
	return validate.Validate(
		&validators.StringIsPresent{Field: cm.ResourceID, Name: "ResourceID"},
	), err
	//return validate.NewErrors(), nil
}

// ValidateUpdate gets run every time you call "pop.ValidateAndUpdate" method.
// This method is not required and may be deleted.
func (cm *CloudConnectionMapping) ValidateUpdate(tx *pop.Connection) (*validate.Errors, error) {
	var err error
	return validate.Validate(
		&validators.StringIsPresent{Field: cm.ResourceID, Name: "ResourceID"},
	), err
	//return validate.NewErrors(), nil
}

func (cm *CloudConnectionMapping) Create(tx *pop.Connection) (*validate.Errors, error) {
	return tx.ValidateAndCreate(cm)
}

func (cm *CloudConnectionMapping) Update(tx *pop.Connection) (*validate.Errors, error) {
	return tx.ValidateAndUpdate(cm)
}
