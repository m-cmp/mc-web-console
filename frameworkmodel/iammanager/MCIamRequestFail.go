package iammanager

// MCIam 요청 실패시 메세지를 담을 객체
type MCIamRequestFail struct {
	Error string `json:"error"`
	Trace string `json:"trace"`
	Code  string `json:"code"`
}

// {
// 	"error": "could not find api/v1/mapping/ws/user/mciamadmin",
// 	"trace": "could not find api/v1/mapping/ws/user/mciamadmin",
// 	"code": 404
//   }
