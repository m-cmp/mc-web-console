package iammanager

// MappingGetWsUserRole
// type MCIamWsUserRoleMapping struct {
// 	ID        string         `json:"id"`
// 	Workspace MCIamWorkspace `json:"mc_iam_workspace"`
// 	UserID    string         `json:"user_id"`
// 	MCIamRole MCIamRole      `json:"mc_iam_role`
// 	//CreatedAt time.Time       `json:"created_at"`
// 	//UpdatedAt time.Time       `json:"updated_at"`
// }

// type MCIamWsUserRoleMappings []MCIamWsUserRoleMapping

type MCIamWsUserRoleMapping struct {
	ID        string         `json:"id"`
	WsID      string         `json:"ws_id"`
	Workspace MCIamWorkspace `json:"Ws"`
	UserID    string         `json:"user_id"`
	RoleID    string         `json:"role_id"`
	MCIamRole MCIamRole      `json:"role"`
	//CreatedAt time.Time       `json:"created_at"`
	//UpdatedAt time.Time       `json:"updated_at"`
}

type MCIamWsUserRoleMappings []MCIamWsUserRoleMapping
