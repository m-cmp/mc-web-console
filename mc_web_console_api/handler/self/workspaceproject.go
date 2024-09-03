package self

import (
	"fmt"
	"mc_web_console_api/handler"
	"strings"

	"github.com/gobuffalo/buffalo"
)

type GetWorkspaceUserRoleMappingListResponse struct {
	Role                    Role                    `json:"role"`
	WorkspaceProjectMapping WorkspaceProjectMapping `json:"workspaceProject"`
}

type Role struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

type WorkspaceProjectMapping struct {
	Workspace Workspace `json:"workspace"`
	Projects  Projects  `json:"projects"`
}

type Workspace struct {
	ID          string `json:"id" ` //id 와 name 은 같다 - ws01
	Name        string `json:"name" db:"name"`
	Description string `json:"description" db:"description"`
}

type Project struct {
	ID          string `json:"id" db:"id"` //  id와 NSid 는 같다.
	NsID        string `json:"ns_id" db:"ns_id"`
	Name        string `json:"name" db:"name"`
	Description string `json:"description" db:"description"`
}

type Projects []Project

var DefaultWorkspace = Workspace{
	ID:          "ws01",
	Name:        "ws01",
	Description: "this is only workspace for default workspace",
}

// /ns
func PostNs(c buffalo.Context, commonRequest *handler.CommonRequest) (*Project, error) {
	operationId := strings.ToLower("PostNs")
	commonResponse, err := handler.AnyCaller(c, operationId, commonRequest, true)
	if err != nil {
		return nil, err
	}
	nsAseert := commonResponse.ResponseData.(map[string]interface{})
	project := Project{
		ID:          nsAseert["id"].(string),
		NsID:        nsAseert["id"].(string),
		Name:        nsAseert["name"].(string),
		Description: nsAseert["description"].(string),
	}
	return &project, nil
}

// /ns
func GetAllNs(c buffalo.Context) (*Projects, error) {

	operationId := strings.ToLower("GetAllNs")
	commonResponse, err := handler.AnyCaller(c, operationId, &handler.CommonRequest{}, true)
	if err != nil {
		return nil, err
	}

	var projects Projects
	for _, ns := range commonResponse.ResponseData.(map[string]interface{})["ns"].([]interface{}) {
		nsAseert := ns.(map[string]interface{})
		project := Project{
			ID:          nsAseert["id"].(string),
			NsID:        nsAseert["id"].(string),
			Name:        nsAseert["name"].(string),
			Description: nsAseert["description"].(string),
		}
		projects = append(projects, project)
	}

	return &projects, nil
}

// /ns/{nsId}
func GetNs(c buffalo.Context, commonRequest *handler.CommonRequest) (*Project, error) {

	operationId := strings.ToLower("GetNs")
	commonResponse, err := handler.AnyCaller(c, operationId, commonRequest, true)
	if err != nil {
		return nil, err
	}

	nsAseert := commonResponse.ResponseData.(map[string]interface{})
	project := Project{
		ID:          nsAseert["id"].(string),
		NsID:        nsAseert["id"].(string),
		Name:        nsAseert["name"].(string),
		Description: nsAseert["description"].(string),
	}

	return &project, nil
}

// /ns/{nsId}
func DelNs(c buffalo.Context, commonRequest *handler.CommonRequest) error {
	operationId := strings.ToLower("DelNs")
	commonResponse, err := handler.AnyCaller(c, operationId, commonRequest, true)
	if err != nil {
		return err
	}
	if commonResponse.Status.StatusCode != 200 {
		return fmt.Errorf("job finsh with code %d", commonResponse.Status.StatusCode)
	}
	return nil
}

// /ns/{nsId}
func PutNs(c buffalo.Context, commonRequest *handler.CommonRequest) (*Project, error) {
	operationId := strings.ToLower("PutNs")
	commonResponse, err := handler.AnyCaller(c, operationId, commonRequest, true)
	if err != nil {
		return nil, err
	}
	nsAseert := commonResponse.ResponseData.(map[string]interface{})
	project := Project{
		ID:          nsAseert["id"].(string),
		NsID:        nsAseert["id"].(string),
		Name:        nsAseert["name"].(string),
		Description: nsAseert["description"].(string),
	}
	return &project, nil
}

func GetWorkspaceUserRoleMappingList(c buffalo.Context) (*GetWorkspaceUserRoleMappingListResponse, error) {
	projects, err := GetAllNs(c)
	if err != nil {
		return nil, err
	}
	result := &GetWorkspaceUserRoleMappingListResponse{
		Role: Role{
			Name:        c.Value("Role").(string),
			Description: "this is default role.",
		},
		WorkspaceProjectMapping: WorkspaceProjectMapping{
			Workspace: DefaultWorkspace,
			Projects:  *projects,
		},
	}
	return result, nil
}

func GetWPmappingList(c buffalo.Context) (*WorkspaceProjectMapping, error) {
	projects, err := GetAllNs(c)
	if err != nil {
		return nil, err
	}
	result := &WorkspaceProjectMapping{
		Workspace: DefaultWorkspace,
		Projects:  *projects,
	}
	return result, nil
}
