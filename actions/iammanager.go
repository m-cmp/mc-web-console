package actions

import (
	"log"
	"net/http"

	"github.com/gobuffalo/buffalo"

	"mc_web_console/handler"
)

// User의 workspace 목록 조회
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
