package iammanager

type MCIamUserRoleMapping struct {
	ID     string    `json:"id"`
	Role   MCIamRole `json:"mc_iam_roles"`
	UserID string    `json:"user_id"`
	//CreatedAt time.Time  `json:"created_at"`
	//UpdatedAt time.Time  `json:"updated_at"`
}
