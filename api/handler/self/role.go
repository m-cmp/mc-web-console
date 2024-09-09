package self

type PlatformRole struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}

type WorkspaceRole struct {
	Id   string `json:"id"`
	Name string `json:"name"`
}

func GetPlatformRoleList() ([]PlatformRole, error) {

	platformRoles := []PlatformRole{
		{
			Id:   "admin",
			Name: "Admin",
		},
		{
			Id:   "operator",
			Name: "Operator",
		},
		{
			Id:   "viewer",
			Name: "Viewer",
		},
		{
			Id:   "billadmin",
			Name: "Bill Admin",
		},
		{
			Id:   "billviewer",
			Name: "Bill Viewer",
		},
		{
			Id:   "platformadmin",
			Name: "Platform Admin",
		},
	}

	return platformRoles, nil
}

func GetWorkspaceRoleList() ([]WorkspaceRole, error) {

	WorkspaceRoles := []WorkspaceRole{
		{
			Id:   "admin",
			Name: "Admin",
		},
		{
			Id:   "operator",
			Name: "Operator",
		},
		{
			Id:   "viewer",
			Name: "Viewer",
		},
		{
			Id:   "billadmin",
			Name: "Bill Admin",
		},
		{
			Id:   "billviewer",
			Name: "Bill Viewer",
		},
		{
			Id:   "platformadmin",
			Name: "Platform Admin",
		},
	}

	return WorkspaceRoles, nil
}
