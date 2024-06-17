package actions

import (
	"fmt"
	"mc_web_console_api/handler"
	"mc_web_console_api/handler/mcinframanager"

	"github.com/gobuffalo/buffalo"
)

// MCIS 목록 조회
func GetMcisList(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if handler.MCIAM_USE {
		commonResponse := mcinframanager.InfraGetMcisList(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

// MCIS 단건 조회
func GetMcis(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if handler.MCIAM_USE {
		commonResponse := mcinframanager.InfraGetMcis(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

// MCIS 생성
func CreateMcis(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if handler.MCIAM_USE {
		commonResponse := mcinframanager.InfraCreateMcis(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

// MCIS 삭제
func DeleteMcis(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if handler.MCIAM_USE {
		commonResponse := mcinframanager.InfraDeleteMcis(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

// Dynamic MCIS 생성
func CreateDynamicMcis(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if handler.MCIAM_USE {
		commonResponse := mcinframanager.InfraCreateDynamicMcis(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

// 특정 ns에 vpc, securitygroup, sshkey 등 default resource를 생성
func GetLoadDefaultResource(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if handler.MCIAM_USE {
		commonResponse := mcinframanager.InfraGetLoadDefaultResouce(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

func DelDefaultResource(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if handler.MCIAM_USE {
		commonResponse := mcinframanager.InfraDeleteDefaultResouce(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

func McisRecommendVm(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if handler.MCIAM_USE {
		commonResponse := mcinframanager.InfraMcisRecommendVm(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

func McisDynamicCheckRequest(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if handler.MCIAM_USE {
		commonResponse := mcinframanager.InfraMcisDynamicCheckRequest(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

// MCIS 내 모든 VM에 command 실행
func CmdMCIS(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if handler.MCIAM_USE {
		commonResponse := mcinframanager.InfraCmdMCIS(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

func ControlMcis(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if handler.MCIAM_USE {
		commonResponse := mcinframanager.InfraControlMcis(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

func CreateMcisVmDynamic(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if handler.MCIAM_USE {
		commonResponse := mcinframanager.InfraMcisVmDynamic(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}
