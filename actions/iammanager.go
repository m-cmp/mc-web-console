package actions

import (
	"log"
	"net/http"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"

	middleware "mc_web_console/actions/middleware"
	frameworkmodel "mc_web_console/frameworkmodel"
	iammanager "mc_web_console/frameworkmodel/iammanager"
	"mc_web_console/handler"
	"mc_web_console/models"

	util "mc_web_console/util"
)

// 모든 workspace 목록 조회(admin 용)
func (a actions) WorkspaceList(c buffalo.Context) error {
	if iamAccessToken := c.Session().Get("iamAccessToken"); iamAccessToken != nil {
		workspaceList, respStatus := handler.IamManagerWorkspaceList(iamAccessToken.(string))
		log.Println("respStatus", respStatus)
		//return c.Render(http.Status)
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
			"message":       "success",
			"status":        respStatus.StatusCode,
			"workspaceList": workspaceList,
		}))
	} else {
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"message": "fail",
			"status":  "fail",
		}))
	}

}

func (a actions) WorkspaceListByUser(c buffalo.Context) error {
	// session에서 사용자 정보 꺼냄.
	userInfo, err := middleware.GetUserInfoFromSession(c)

	if err != nil {
		return c.Render(http.StatusUnauthorized, r.JSON(map[string]interface{}{
			"error":  err,
			"status": http.StatusUnauthorized,
		}))
	}

	workspaceUserRoleMappingList := []iammanager.MCIamWsUserRoleMapping{}
	respStatus := frameworkmodel.WebStatus{}

	// Iam Manager로 로그인
	if util.USE_MCIAM == "Y" {
		//log.Println("Get Token from db")

		// DB에서 Token 조회
		authSession := &models.AuthSession{}
		tx := c.Value("tx").(*pop.Connection)
		err := tx.Where("mcuser_id = ?", userInfo.UserID).First(authSession)
		if err != nil {
			return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
				"error": err,
			}))
		}
		log.Println(authSession)
		log.Println("Get user workspaces at iammanager")
		// iam manager에서 workspace 목록 조회
		workspaceUserRoleMappingList, respStatus = handler.IamManagerWorkspaceUserRoleMappingListByUserId(authSession.IamManagerAccessToken, authSession.MCUserID)
		log.Println("respStatus", respStatus)
		if respStatus.StatusCode != 200 {
			return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}
		log.Println(workspaceUserRoleMappingList)

		log.Println("Get user namespaces")
		// iam manager에서 workspace의 namespace 목록 조회 또는 추출
		//namespaceList = append(namespaceList, models.Namespace{ID: "ns01", NsName: "ns01"})

	} else {
		// userNamespace 목록 조회
		//namespaceList = append(namespaceList, models.Namespace{ID: "ns01", NsName: "ns01"})
	}

	return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
		"message":                      "success",
		"status":                       respStatus.StatusCode,
		"workspaceUserRoleMappingList": workspaceUserRoleMappingList,
	}))
}

func (a actions) GetWorkspace(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

func (a actions) ProjectList(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

func (a actions) GetProject(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

func (a actions) UpdateProject(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

func (a actions) RegProject(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

func (a actions) DeleteProject(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

func (a actions) MCIamRoleList(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

func (a actions) GetMCIamRole(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

func (a actions) UpdateMCIamRole(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

func (a actions) RegMCIamRole(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

func (a actions) DeleteMCIamRole(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

func (a actions) RegUserMCIamRoleMapping(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

func (a actions) RegWorkspaceUserMCIamRoleMapping(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

func (a actions) RegWorkspaceProjectMapping(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

func (a actions) WorkspaceProjectList(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

func (a actions) DeleteWorkspaceProjectMapping(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}
