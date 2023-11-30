package iammanager

type IamLoginInfo struct {
	UserID string `json:"userId"`
	//UserName    string `json:"userName"`
	UserName    string `json:"username"`
	Password    string `json:"password"` // param에서는 빼자.
	AccessToken string `json:"iamAccessToken"`
}
