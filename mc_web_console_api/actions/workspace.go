package actions

import (
	"fmt"
	"log"
	"mc_web_console_api/handler"
	"mc_web_console_api/handler/mciammanager"

	"github.com/gobuffalo/buffalo"
)

func GetWorkspaceByuserId(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if handler.MCIAM_USE {
		// token에서 userId 추출
		userId := c.Value("PreferredUsername").(string)
		//userId, _ := jwtDecoded["preferred_username"].(string)
		log.Println("UserId ", userId)
		pathParams := make(map[string]string)
		// pathParams := map[string]string{
		// 	"userId": userId,
		// }
		pathParams["userId"] = userId

		req := &handler.CommonRequest{
			PathParams: pathParams,
		}

		commonResponse := mciammanager.McIamGetworkspaceuserrolemappingbyworkspaceuser(c, req)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

// Workspace 목록 조회
func GetWorkspacelist(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if handler.MCIAM_USE {
		commonResponse := mciammanager.McIamGetworkspacelist(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

// Workspace 단건 조회
func GetWorkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if handler.MCIAM_USE {
		commonResponse := mciammanager.McIamGetworkspace(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

// workspace 생성
func CreateWorkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if handler.MCIAM_USE {
		commonResponse := mciammanager.McIamCreateworkspace(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

// workspace 삭제
func DeleteWorkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if handler.MCIAM_USE {
		commonResponse := mciammanager.McIamDeleteworkspace(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}
