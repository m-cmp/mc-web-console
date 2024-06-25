package mciammanager

import (
	"log"
	"mc_web_console_api/handler"
	"net/http"
	"os"

	"github.com/gobuffalo/buffalo"
)

var MCIAMMANAGER = os.Getenv("MCIAMMANAGER")

// alive
func McIamAlive(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCallerWithoutToken(http.MethodGet, MCIAMMANAGER, Alive, commonRequest)
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

// auth
func McIamLogin(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCallerWithoutToken(http.MethodPost, MCIAMMANAGER, Login, commonRequest)
	if err != nil {
		log.Println("CommonCallerWithoutToken", err)
		return commonResponse
	}
	return commonResponse
}

func McIamLoginRefresh(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPost, MCIAMMANAGER, Loginrefresh, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamLogout(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPost, MCIAMMANAGER, Logout, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamGetUserInfo(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCIAMMANAGER, Getuserinfo, commonRequest, c.Request().Header.Get("Authorization"))
	return commonResponse
}

func McIamGetUserValidate(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, MCIAMMANAGER, Getusevalidate, commonRequest, c.Request().Header.Get("Authorization"))
	return commonResponse
}

// project
func McIamGetprojectlist(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, MCIAMMANAGER, Getprojectlist, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamCreateproject(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPost, MCIAMMANAGER, Createproject, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamDeleteproject(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodDelete, MCIAMMANAGER, Deleteprojectbyid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamGetproject(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, MCIAMMANAGER, Getprojectbyid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamUpdateproject(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPut, MCIAMMANAGER, Updateprojectbyid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

// workspace
func McIamGetworkspacelist(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, MCIAMMANAGER, Getworkspacelist, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamGetworkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, MCIAMMANAGER, Getworkspacebyid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamCreateworkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPost, MCIAMMANAGER, Createworkspace, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamDeleteworkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodDelete, MCIAMMANAGER, Deleteworkspacebyid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamUpdateworkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPut, MCIAMMANAGER, Updateworkspacebyid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

// role
func McIamGetrolelist(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, MCIAMMANAGER, Getrolelist, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamGetrole(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, MCIAMMANAGER, Getrolebyid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamCreaterole(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPost, MCIAMMANAGER, Createrole, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamDeleterole(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodDelete, MCIAMMANAGER, Deleterolebyid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

// workspace - project Mapping
func McIamGetworkspaceprojectmapping(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, MCIAMMANAGER, Getwpmappinglistorderbyworkspace, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamGetworkspaceprojectmappingbyworkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, MCIAMMANAGER, Getwpmappinglistbyworkspaceid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamCreateworkspaceprojectmapping(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPost, MCIAMMANAGER, Createwpmapping, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamUpdateworkspaceprojectmapping(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPut, MCIAMMANAGER, Updatewpmappings, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamDeleteworkspaceprojectmapping(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodDelete, MCIAMMANAGER, Deleteworkspaceprojectmappingbyid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

// workspace - user - role Mapping
func McIamGetworkspaceuserrolemapping(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, MCIAMMANAGER, Getworkspaceuserrolemappinglistorderbyworkspace, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamGetworkspaceuserrolemappingbyworkspaceuser(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, MCIAMMANAGER, Getworkspaceuserrolemappinglistbyuserid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		log.Print(" err ", err)
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	log.Print(" commonResponse ", commonResponse)
	return commonResponse
}

func McIamGetworkspaceuserrolemappingbyworkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, MCIAMMANAGER, Getworkspaceuserrolemappinglistbyworkspaceid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamCreateworkspaceuserrolemapping(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPost, MCIAMMANAGER, Createworkspaceuserrolemappingbyname, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamDeleteworkspaceuserrolemapping(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodDelete, MCIAMMANAGER, Deleteworkspaceuserrolemapping, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamGetworkspaceuserrolemappingbyuser(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, MCIAMMANAGER, Getworkspaceuserrolemappingbyid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}
