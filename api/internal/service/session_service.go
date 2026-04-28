package service

import (
	"fmt"
	"mc_web_console_api/internal/model"
	"mc_web_console_api/internal/repository"
	"mc_web_console_api/pkg/jwt"
	"time"
)

// SessionService 세션 서비스
type SessionService struct {
	repo *repository.SessionRepository
}

// NewSessionService 새로운 세션 서비스 생성
func NewSessionService(repo *repository.SessionRepository) *SessionService {
	return &SessionService{repo: repo}
}

// CreateSession 세션 생성
func (s *SessionService) CreateSession(userID, userName, email, role string, accessExpiresIn, refreshExpiresIn float64) (*model.UserSession, error) {
	// 기존 세션 확인
	existingSession, _ := s.repo.FindByUserID(userID)

	// 토큰 생성
	accessToken, err := jwt.GenerateToken(
		userID,
		userName,
		email,
		role,
		time.Duration(accessExpiresIn)*time.Second,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := jwt.GenerateToken(
		userID,
		userName,
		email,
		role,
		time.Duration(refreshExpiresIn)*time.Second,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// 세션 생성 또는 업데이트
	if existingSession != nil {
		// 기존 세션 업데이트
		existingSession.AccessToken = accessToken
		existingSession.RefreshToken = refreshToken
		existingSession.ExpiresIn = accessExpiresIn
		existingSession.RefreshExpiresIn = refreshExpiresIn

		if err := s.repo.Update(existingSession); err != nil {
			return nil, fmt.Errorf("failed to update session: %w", err)
		}

		return existingSession, nil
	}

	// 새 세션 생성
	session := &model.UserSession{
		UserID:           userID,
		AccessToken:      accessToken,
		ExpiresIn:        accessExpiresIn,
		RefreshToken:     refreshToken,
		RefreshExpiresIn: refreshExpiresIn,
	}

	if err := s.repo.Create(session); err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	return session, nil
}

// ValidateSession 세션 유효성 검증
func (s *SessionService) ValidateSession(userID string) (bool, error) {
	session, err := s.repo.FindByUserID(userID)
	if err != nil {
		return false, err
	}

	// 액세스 토큰 만료 확인
	if session.IsExpired() {
		return false, fmt.Errorf("session expired")
	}

	// 토큰 유효성 검증
	if err := jwt.ValidateToken(session.AccessToken); err != nil {
		return false, fmt.Errorf("invalid access token: %w", err)
	}

	return true, nil
}

// RefreshSession 세션 갱신
func (s *SessionService) RefreshSession(userID, refreshToken string) (*model.UserSession, error) {
	// 기존 세션 조회
	session, err := s.repo.FindByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("session not found: %w", err)
	}

	// 리프레시 토큰 확인
	if session.RefreshToken != refreshToken {
		return nil, fmt.Errorf("invalid refresh token")
	}

	// 리프레시 토큰 만료 확인
	if session.IsRefreshExpired() {
		return nil, fmt.Errorf("refresh token expired")
	}

	// 새 액세스 토큰 생성
	newAccessToken, err := jwt.RefreshToken(refreshToken, time.Duration(session.ExpiresIn)*time.Second)
	if err != nil {
		return nil, fmt.Errorf("failed to refresh token: %w", err)
	}

	// 세션 업데이트
	session.AccessToken = newAccessToken

	if err := s.repo.Update(session); err != nil {
		return nil, fmt.Errorf("failed to update session: %w", err)
	}

	return session, nil
}

// DeleteSession 세션 삭제
func (s *SessionService) DeleteSession(userID string) error {
	if err := s.repo.Delete(userID); err != nil {
		return fmt.Errorf("failed to delete session: %w", err)
	}
	return nil
}

// GetSession 세션 조회
func (s *SessionService) GetSession(userID string) (*model.UserSession, error) {
	session, err := s.repo.FindByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("session not found: %w", err)
	}
	return session, nil
}

// IsSessionExists 세션 존재 여부 확인
func (s *SessionService) IsSessionExists(userID string) (bool, error) {
	return s.repo.Exists(userID)
}
