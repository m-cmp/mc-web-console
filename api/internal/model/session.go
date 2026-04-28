package model

import (
	"time"

	"github.com/google/uuid"
)

// UserSession 사용자 세션 모델
// Buffalo Pop의 Usersess 모델과 동일한 구조
type UserSession struct {
	ID               string    `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"`
	UserID           string    `gorm:"index;not null" json:"user_id"`
	AccessToken      string    `gorm:"type:text;not null" json:"access_token"`
	ExpiresIn        float64   `gorm:"not null" json:"expires_in"`
	RefreshToken     string    `gorm:"type:text;not null" json:"refresh_token"`
	RefreshExpiresIn float64   `gorm:"not null" json:"refresh_expires_in"`
	CreatedAt        time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt        time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName GORM 테이블명 지정 (Buffalo Pop과 동일)
func (UserSession) TableName() string {
	return "usersesses"
}

// BeforeCreate GORM Hook - UUID 생성
func (s *UserSession) BeforeCreate() error {
	if s.ID == "" {
		s.ID = uuid.New().String()
	}
	return nil
}

// IsExpired 액세스 토큰 만료 여부 확인
func (s *UserSession) IsExpired() bool {
	expiryTime := s.CreatedAt.Add(time.Duration(s.ExpiresIn) * time.Second)
	return time.Now().After(expiryTime)
}

// IsRefreshExpired 리프레시 토큰 만료 여부 확인
func (s *UserSession) IsRefreshExpired() bool {
	expiryTime := s.CreatedAt.Add(time.Duration(s.RefreshExpiresIn) * time.Second)
	return time.Now().After(expiryTime)
}
