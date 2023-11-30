package iammanager

type MCIamRole struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	//CreatedAt   time.Time `json:"created_at"`
	//UpdatedAt   time.Time `json:"updated_at"`
}

type MCIamRoleList struct {
	MCIamRole []MCIamRole `json:"mc_iam_role"`
}
