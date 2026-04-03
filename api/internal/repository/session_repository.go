package repository

import (
	"mc_web_console_api/internal/model"

	"gorm.io/gorm"
)

// SessionRepository 세션 저장소
type SessionRepository struct {
	db *gorm.DB
}

// NewSessionRepository 새로운 세션 저장소 생성
func NewSessionRepository(db *gorm.DB) *SessionRepository {
	return &SessionRepository{db: db}
}

// Create 세션 생성
func (r *SessionRepository) Create(session *model.UserSession) error {
	return r.db.Create(session).Error
}

// FindByUserID 사용자 ID로 세션 조회
func (r *SessionRepository) FindByUserID(userID string) (*model.UserSession, error) {
	var session model.UserSession
	err := r.db.Where("user_id = ?", userID).First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

// FindByID ID로 세션 조회
func (r *SessionRepository) FindByID(id string) (*model.UserSession, error) {
	var session model.UserSession
	err := r.db.Where("id = ?", id).First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

// Update 세션 업데이트
func (r *SessionRepository) Update(session *model.UserSession) error {
	return r.db.Save(session).Error
}

// UpdateTokens 토큰만 업데이트
func (r *SessionRepository) UpdateTokens(userID, accessToken, refreshToken string, expiresIn, refreshExpiresIn float64) error {
	return r.db.Model(&model.UserSession{}).
		Where("user_id = ?", userID).
		Updates(map[string]interface{}{
			"access_token":        accessToken,
			"refresh_token":       refreshToken,
			"expires_in":          expiresIn,
			"refresh_expires_in":  refreshExpiresIn,
		}).Error
}

// Delete 세션 삭제
func (r *SessionRepository) Delete(userID string) error {
	return r.db.Where("user_id = ?", userID).Delete(&model.UserSession{}).Error
}

// DeleteByID ID로 세션 삭제
func (r *SessionRepository) DeleteByID(id string) error {
	return r.db.Delete(&model.UserSession{}, "id = ?", id).Error
}

// Exists 세션 존재 여부 확인
func (r *SessionRepository) Exists(userID string) (bool, error) {
	var count int64
	err := r.db.Model(&model.UserSession{}).Where("user_id = ?", userID).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// DeleteExpired 만료된 세션 삭제 (정리 작업)
// refresh_expires_in(초) 기준으로 created_at 이후 만료된 세션을 삭제한다.
func (r *SessionRepository) DeleteExpired() error {
	return r.db.Exec(
		"DELETE FROM usersesses WHERE created_at + (refresh_expires_in * interval '1 second') < NOW()",
	).Error
}
