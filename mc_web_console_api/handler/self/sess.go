package self

import (
	"mc_web_console_api/handler"
	"mc_web_console_api/models"

	"github.com/gobuffalo/pop/v6"
	"github.com/opentracing/opentracing-go/log"
)

func CreateUserSessFromResponseData(tx *pop.Connection, r *handler.CommonResponse, userId string) (*models.Usersess, error) {
	t := r.ResponseData.(map[string]interface{})
	var s models.Usersess
	s.UserID = userId
	if accessToken, ok := t["access_token"]; ok {
		s.AccessToken = accessToken.(string)
	}
	if expiresIn, ok := t["expires_in"]; ok {
		s.ExpiresIn = expiresIn.(float64)
	}
	if refreshToken, ok := t["refresh_token"]; ok {
		s.RefreshToken = refreshToken.(string)
	}
	if refreshExpiresIn, ok := t["refresh_expires_in"]; ok {
		s.RefreshExpiresIn = refreshExpiresIn.(float64)
	}
	sess, err := CreateUserSess(tx, &s)
	if err != nil {
		return nil, err
	}
	return sess, nil
}

func CreateUserSess(tx *pop.Connection, s *models.Usersess) (*models.Usersess, error) {
	userExist, err := IsUserSessExistByUserId(tx, s.UserID)
	if err != nil {
		log.Error(err)
		return nil, err
	}
	if userExist {
		orgs, err := GetUserByUserId(tx, s.UserID)
		if err != nil {
			log.Error(err)
			return nil, err
		}
		s.ID = orgs.ID
		update, err := UpdateUserSess(tx, s)
		if err != nil {
			log.Error(err)
			return nil, err
		}
		return update, nil
	} else {
		err := tx.Create(s)
		if err != nil {
			log.Error(err)
			return nil, err
		}
		return s, nil
	}
}

func IsUserSessExistByUserId(tx *pop.Connection, userId string) (bool, error) {
	var cnt int
	err := tx.RawQuery("SELECT COUNT(*) FROM usersesses WHERE user_id = ?;", userId).First(&cnt)
	if err != nil {
		log.Error(err)
		return false, err
	}
	if cnt != 0 {
		return true, nil
	}
	return false, nil
}

func GetUserByUserId(tx *pop.Connection, userId string) (*models.Usersess, error) {
	var s models.Usersess
	err := tx.Where("user_id = ?", userId).First(&s)
	if err != nil {
		log.Error(err)
		return nil, err
	}
	return &s, nil
}

func UpdateUserSesssFromResponseData(tx *pop.Connection, r *handler.CommonResponse, userId string) (*models.Usersess, error) {

	t := r.ResponseData.(map[string]interface{})

	s, err := GetUserByUserId(tx, userId)
	if err != nil {
		log.Error(err)
		return nil, err
	}

	if accessToken, ok := t["access_token"]; ok {
		s.AccessToken = accessToken.(string)

	}
	if expiresIn, ok := t["expires_in"]; ok {
		s.ExpiresIn = expiresIn.(float64)

	}
	if refreshToken, ok := t["refresh_token"]; ok {
		s.RefreshToken = refreshToken.(string)

	}
	if refreshExpiresIn, ok := t["refresh_expires_in"]; ok {
		s.RefreshExpiresIn = refreshExpiresIn.(float64)
	}

	err = tx.Update(s)
	if err != nil {
		log.Error(err)
		return nil, err
	}

	return s, nil
}

func UpdateUserSess(tx *pop.Connection, s *models.Usersess) (*models.Usersess, error) {
	err := tx.Update(s)
	if err != nil {
		log.Error(err)
		return nil, err
	}
	return s, nil
}

func DestroyUserSessByAccesstokenforLogout(tx *pop.Connection, t string) (string, error) {
	s, err := GetUserByUserId(tx, t)
	if err != nil {
		log.Error(err)
		return "", err
	}
	rt := s.RefreshToken
	err = DestroyUserSess(tx, s)
	if err != nil {
		log.Error(err)
		return "", err
	}
	return rt, nil
}

func DestroyUserSess(tx *pop.Connection, s *models.Usersess) error {
	err := tx.Destroy(s)
	if err != nil {
		log.Error(err)
		return err
	}
	return nil
}
