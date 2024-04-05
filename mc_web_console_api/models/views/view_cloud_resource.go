/*
view 를 지원하지 않아 모델에 view관련 파일만 따로 생성
buffalo pop g model view_cloud_connection 과 resource mapping 을 조합한 쿼리 대응용
*/

package views

import (
	"encoding/json"

	"github.com/gofrs/uuid"
)

type ViewCloudResources []ViewCloudResource

type ViewCloudResource struct {
	ID             uuid.UUID `json:"id" db:"id"`
	ConnectionName string    `json:"connectionName" db:"connection_name"`

	ProviderID string `json:"provider_id" db:"provider_id"`

	CredentialName string    `json:"credential_name" db:"credential_name"`
	CredentialID   uuid.UUID `json:"credential_id" db:"credential_id"`

	DriverName string    `json:"driver_name" db:"driver_name"`
	DriverID   uuid.UUID `json:"driver_id" db:"driver_id"`

	RegionAlias string    `json:"region_alias" db:"region_id"`
	RegionName  string    `json:"region_name" db:"region_name"`
	ZoneName    string    `json:"zone_name" db:"zone_name"`
	RegionID    uuid.UUID `json:"region_id" db:"region_id"`

	NamespaceID   string `json:"namespace_id" db:"namespace_id"`
	NamespaceName string `json:"namespace_name" db:"namespace_name"`
	ResourceType  string `json:"resource_type" db:"resource_type"`
	ResourceID    string `json:"resource_id" db:"resource_id"`
	ResourceName  string `json:"resource_name" db:"resource_name"`
}

func (c ViewCloudResource) String() string {
	jc, _ := json.Marshal(c)
	return string(jc)
}
