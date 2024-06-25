package actions

import (
	"fmt"
	"mc_web_console_api/handler"
	"mc_web_console_api/handler/mcinframanager"

	"github.com/gobuffalo/buffalo"
)

// VPC 목록 조회
func GetVPCList(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if MCIAM_USE {
		commonResponse := mcinframanager.InfraGetVPCList(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

// VPC 단건 조회
func GetVPC(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if MCIAM_USE {
		commonResponse := mcinframanager.InfraGetVPC(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

// VPC 생성
func CreateVPC(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if MCIAM_USE {
		commonResponse := mcinframanager.InfraCreateVPC(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

// VPC 삭제
func DeleteVPC(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if MCIAM_USE {
		commonResponse := mcinframanager.InfraDeleteVPC(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

func DeleteAllVPC(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if MCIAM_USE {
		commonResponse := mcinframanager.InfraDeleteAllVPC(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

// VPC 목록 조회
func GetSecurityGroupList(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if MCIAM_USE {
		commonResponse := mcinframanager.InfraGetSecurityGroupList(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

// SG 단건 조회
func GetSecurityGroup(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if MCIAM_USE {
		commonResponse := mcinframanager.InfraGetSecurityGroup(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

// SG 생성
func CreateSecurityGroup(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if MCIAM_USE {
		commonResponse := mcinframanager.InfraCreateSecurityGroup(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

func DeleteSecurityGroup(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if MCIAM_USE {
		commonResponse := mcinframanager.InfraDeleteSecurityGroup(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

func DeleteAllSecurityGroup(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if MCIAM_USE {
		commonResponse := mcinframanager.InfraDeleteAllSecurityGroup(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

func GetVmSpecList(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if MCIAM_USE {
		commonResponse := mcinframanager.InfraGetVmSpecList(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

// Virtual machine Spec
func GetVmSpec(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if MCIAM_USE {
		commonResponse := mcinframanager.InfraGetVmSpec(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

func CreateVmSpec(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if MCIAM_USE {
		commonResponse := mcinframanager.InfraCreateVmSpec(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

func DeleteVmSpec(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if MCIAM_USE {
		commonResponse := mcinframanager.InfraDeleteVmSpec(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

func DeleteAllVmSpec(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if MCIAM_USE {
		commonResponse := mcinframanager.InfraDeleteAllVmSpec(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

func GetCommonVmSpecList(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if MCIAM_USE {
		commonResponse := mcinframanager.InfraGetCommonVmSpecList(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

func GetCommonVmSpec(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if MCIAM_USE {
		commonResponse := mcinframanager.InfraGetCommonVmSpec(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

func GetResourceCommonSpec(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if MCIAM_USE {
		commonResponse := mcinframanager.InfraGetResourceCommonSpec(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

func GetConnConfigListByType(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if MCIAM_USE {
		commonResponse := mcinframanager.InfraGetConnConfigListByType(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

func GetResourceList(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if MCIAM_USE {
		commonResponse := mcinframanager.InfraGetResourceList(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}

func GetResource(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	if MCIAM_USE {
		commonResponse := mcinframanager.InfraGetResource(c, commonRequest)
		fmt.Println(commonResponse)
		return commonResponse
	}
	return handler.CommonResponseStatusInternalServerError(nil)
}
