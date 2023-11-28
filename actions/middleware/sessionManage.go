package middleware

import (
	"fmt"
	"github.com/gobuffalo/buffalo"
	//"log"
	//tbcommon "mc_web_console/frameworkmodel/tumblebug/common"
)

// session의 key는 user_id
const sessionUserIDKey = "user_id"
const sessionUserInfoKey = "user_info"

type UserSession struct {
	UserID               string
	CurrentWorkspaceName string
	CurrentWorkspaceID   string
	CurrentWorkspaceRole string
	CurrentNamespaceName string
	CurrentNamespaceID   string
	CurrentUserToken     string // iam manager를 위해 set 해야 함

	//UserWorkspaces []map[string]string// workspace id, name
	//UserNamespacesByWs []tbcommon.TbNsInfo
}

func SetUserSession(c buffalo.Context, userSession UserSession) {
	session := c.Session()
	session.Set(sessionUserIDKey, userSession.UserID)
	session.Set(sessionUserInfoKey, userSession)
	session.Save()
}

func GetUserIDFromSession(c buffalo.Context) (string, error) {
	session := c.Session()
	userID := session.Get(sessionUserIDKey)
	if userID == nil {
		return "", fmt.Errorf("User not logged in")
	}
	return userID.(string), nil
}
func GetUserInfoFromSession(c buffalo.Context) (UserSession, error) {
	session := c.Session()
	userSession := session.Get(sessionUserInfoKey)
	if userSession == nil {
		return UserSession{}, fmt.Errorf("User not logged in")
	}
	return userSession.(UserSession), nil
}
func ClearUserIDSession(c buffalo.Context) {
	session := c.Session()
	session.Delete(sessionUserIDKey)
	session.Delete(sessionUserInfoKey)
	session.Save()
}
