package iammanager

type MCIamWorkspace struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	//CreatedAt   time.Time `json:"created_at"`
	//UpdatedAt   time.Time `json:"updated_at"`

	MCIamProject []MCIamProject `json:"mc_iam_project"`
}

// map[
// created_at:2023-11-02T18:22:23.719184Z
// create
//
//description:test_workspace
//id:83f1636c-a4c2-479b-a31f-83b73e1e5674
//name:test_workspace updated_at:2023-11-02T18:22:23.719184Z]]

type MCIamWorkspaceList struct {
	Workspace []MCIamWorkspace `json:"mc_iam_workspace"`
}
