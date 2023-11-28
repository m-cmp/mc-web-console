package iammanager

type MCIamProjectResp struct {
	Message string       `json:"message"`
	Project MCIamProject `json:"project"`
}

// {
// 	"message": "valid",
// 	"project": {
// 	  "id": "c704594b-a15b-4573-bbe1-b89726599108",
// 	  "name": "test_project",
// 	  "description": "test_project create",
// 	  "created_at": "2023-11-02T18:26:36.344073Z",
// 	  "updated_at": "2023-11-02T18:26:36.344073Z"
// 	}
//   }
