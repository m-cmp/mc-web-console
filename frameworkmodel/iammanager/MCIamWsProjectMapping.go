package iammanager

type MCIamWsProjectMapping struct {
	//ID        string         `json:"id"`
	//Workspace MCIamWorkspace `json:"mc_iam_workspace"`
	//Project   MCIamProject   `json:"mc_iam_project"`
	//CreatedAt time.Time       `json:"created_at"`
	//UpdatedAt time.Time       `json:"updated_at"`

	WsID     string         `json:"ws_id"`
	Ws       MCIamWorkspace `json:"Ws"`
	Projects []MCIamProject `json:"Projects"`
}
