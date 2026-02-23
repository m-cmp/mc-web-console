package jwt

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims JWT 클레임 구조
type Claims struct {
	UserID   string `json:"upn"`      // User Principal Name (Buffalo 호환)
	UserName string `json:"name"`     // 사용자 이름
	Email    string `json:"email"`    // 이메일
	Role     string `json:"role"`     // 역할
	jwt.RegisteredClaims
}

var (
	// JWT 시크릿 키 (환경 변수에서 로드해야 함)
	secretKey = []byte("your-secret-key-change-in-production")
)

// SetSecretKey JWT 시크릿 키 설정
func SetSecretKey(key string) {
	secretKey = []byte(key)
}

// GenerateToken JWT 토큰 생성
func GenerateToken(userID, userName, email, role string, expiresIn time.Duration) (string, error) {
	now := time.Now()
	claims := &Claims{
		UserID:   userID,
		UserName: userName,
		Email:    email,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(expiresIn)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(secretKey)
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, nil
}

// ParseToken JWT 토큰 파싱 및 검증
func ParseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// 서명 알고리즘 검증
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return secretKey, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return nil, fmt.Errorf("invalid token claims")
	}

	return claims, nil
}

// ValidateToken 토큰 유효성 검증만 수행
func ValidateToken(tokenString string) error {
	_, err := ParseToken(tokenString)
	return err
}

// RefreshToken 리프레시 토큰으로 새 액세스 토큰 생성
func RefreshToken(refreshTokenString string, accessTokenDuration time.Duration) (string, error) {
	// 리프레시 토큰 파싱
	claims, err := ParseToken(refreshTokenString)
	if err != nil {
		return "", fmt.Errorf("invalid refresh token: %w", err)
	}

	// 새 액세스 토큰 생성
	newToken, err := GenerateToken(
		claims.UserID,
		claims.UserName,
		claims.Email,
		claims.Role,
		accessTokenDuration,
	)
	if err != nil {
		return "", fmt.Errorf("failed to generate new token: %w", err)
	}

	return newToken, nil
}

// ExtractUserID 토큰에서 사용자 ID 추출
func ExtractUserID(tokenString string) (string, error) {
	claims, err := ParseToken(tokenString)
	if err != nil {
		return "", err
	}
	return claims.UserID, nil
}

// GetTokenClaims Buffalo의 GetCmigTokenClaims 호환
func GetTokenClaims(tokenString string) (*Claims, error) {
	return ParseToken(tokenString)
}
