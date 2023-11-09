package iammanager

type MCIamWsUserRoleMapping struct {
	ID        string         `json:"id"`
	Workspace MCIamWorkspace `json:"mc_iam_workspace"`
	UserID    string         `json:"user_id"`
	MCIamRole MCIamRole      `json:"mc_iam_role`
	//CreatedAt time.Time       `json:"created_at"`
	//UpdatedAt time.Time       `json:"updated_at"`
}

type MCIamWsUserRoleMappings []MCIamWsUserRoleMapping
