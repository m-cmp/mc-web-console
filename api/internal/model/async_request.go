package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// Async request status values (API/DB enum; UI maps Success -> Completed).
const (
	AsyncStatusHandling = "Handling"
	AsyncStatusSuccess  = "Success"
	AsyncStatusError    = "Error"
	AsyncStatusTimeout  = "Timeout"
)

// AsyncRequest tracks an allowlisted mc-infra-manager request by x-request-id.
type AsyncRequest struct {
	ID          string     `gorm:"primaryKey;type:uuid" json:"id"`
	RequestID   string     `gorm:"column:request_id;uniqueIndex;not null;size:128" json:"request_id"`
	UserID      string     `gorm:"column:user_id;index;not null;size:255" json:"user_id"`
	OperationID string     `gorm:"column:operation_id;not null;size:128" json:"operation_id"`
	Label       string     `gorm:"column:label;size:255" json:"label"`
	Status      string     `gorm:"column:status;index;not null;size:32" json:"status"`
	Message     string     `gorm:"column:message;type:text" json:"message"`
	Href        string     `gorm:"column:href;type:text" json:"href"`
	NsID        string     `gorm:"column:ns_id;size:128" json:"ns_id"`
	StartedAt   time.Time  `gorm:"column:started_at;index;not null" json:"started_at"`
	FinishedAt  *time.Time `gorm:"column:finished_at" json:"finished_at"`
	CreatedAt   time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time  `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName GORM table name.
func (AsyncRequest) TableName() string {
	return "async_requests"
}

// BeforeCreate assigns a UUID primary key.
func (a *AsyncRequest) BeforeCreate(tx *gorm.DB) error {
	if a.ID == "" {
		a.ID = uuid.New().String()
	}
	return nil
}

// AsyncRequestListDTO is the paged list envelope for the Front dropdown.
type AsyncRequestListDTO struct {
	Items   []AsyncRequestDTO `json:"items"`
	Total   int64             `json:"total"`
	HasMore bool              `json:"hasMore"`
}

// AsyncRequestDTO is the Front/API list item shape.
type AsyncRequestDTO struct {
	RequestID   string  `json:"requestId"`
	OperationID string  `json:"operationId"`
	Label       string  `json:"label"`
	Status      string  `json:"status"`
	StartedAt   string  `json:"startedAt"`
	FinishedAt  *string `json:"finishedAt"`
	Message     string  `json:"message,omitempty"`
	Href        string  `json:"href,omitempty"`
}

// ToDTO maps the model to the Front job DTO (ISO-8601 times).
func (a *AsyncRequest) ToDTO() AsyncRequestDTO {
	dto := AsyncRequestDTO{
		RequestID:   a.RequestID,
		OperationID: a.OperationID,
		Label:       a.Label,
		Status:      a.Status,
		StartedAt:   a.StartedAt.UTC().Format(time.RFC3339Nano),
		Message:     a.Message,
		Href:        a.Href,
	}
	if a.FinishedAt != nil {
		s := a.FinishedAt.UTC().Format(time.RFC3339Nano)
		dto.FinishedAt = &s
	}
	return dto
}
