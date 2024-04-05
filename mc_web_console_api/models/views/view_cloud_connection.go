/*
view 를 지원하지 않아 모델에 view관련 파일만 따로 생성
buffalo pop g model view_cloud_connection : 테이블생성이므로 사용하지 못함.
*/

package views

import (
	"encoding/json"

	"github.com/gofrs/uuid"
)

type ViewCloudConnections []ViewCloudConnection

// CloudConnection is used by pop to map your cloud_connections database table to your go code.
type ViewCloudConnection struct {
	ID             uuid.UUID `json:"id" db:"id"`
	ConnectionName string    `json:"connectionName" db:"connection_name"`

	ProviderID string `json:"providerId" db:"provider_id"`

	CredentialName string    `json:"credentialName" db:"credential_name"`
	CredentialID   uuid.UUID `json:"credentialId" db:"credential_id"`

	DriverName string    `json:"driverName" db:"driver_name"`
	DriverID   uuid.UUID `json:"driverId" db:"driver_id"`

	RegionAlias string    `json:"regionAlias" db:"region_id"`
	RegionName  string    `json:"regionName" db:"region_name"`
	ZoneName    string    `json:"zoneName" db:"zone_name"`
	RegionID    uuid.UUID `json:"regionId" db:"region_id"`
}

func (c ViewCloudConnection) String() string {
	jc, _ := json.Marshal(c)
	return string(jc)
}

func (vc *ViewCloudConnection) SetRegionProvider(regionName string, providerId string) *ViewCloudConnection {

	vc.ProviderID = providerId
	vc.RegionName = regionName

	return vc
}
