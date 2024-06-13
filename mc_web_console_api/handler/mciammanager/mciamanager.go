package mciammanager

import (
	"log"
	"mc_web_console_api/handler"
	"mc_web_console_api/middleware/mcimw"
	"mc_web_console_api/models"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/gofrs/uuid"
	"github.com/mitchellh/mapstructure"
)

// alive
func McIamAlive(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCallerWithoutToken(http.MethodGet, handler.MCIAMMANAGER, alive, commonRequest)
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

// auth
func McIamLogin(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCallerWithoutToken(http.MethodPost, handler.MCIAMMANAGER, login, commonRequest)
	if err != nil {
		log.Println(err)
		return commonResponse
	}

	accessTokenResponse := &mciammanagerAccessTokenResponse{}
	if err := mapstructure.Decode(commonResponse.ResponseData, accessTokenResponse); err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}

	err = mcimw.UserInfoSet(c, accessTokenResponse.AccessToken)
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err)
	}

	targetSubject, _ := uuid.FromString(c.Data()["Sub"].(string))

	usersess := &usersession{
		ID:               targetSubject,
		AccessToken:      accessTokenResponse.AccessToken,
		ExpiresIn:        accessTokenResponse.ExpiresIn,
		RefreshToken:     accessTokenResponse.RefreshToken,
		RefreshExpiresIn: accessTokenResponse.RefreshExpiresIn,
	}

	txerr := models.DB.Create(usersess)
	if txerr != nil {
		if strings.Contains(txerr.Error(), "SQLSTATE 23505") { // unique constraint violation catch
			txerr = models.DB.Update(usersess)
			if txerr != nil {
				return handler.CommonResponseStatusInternalServerError(txerr)
			}
		} else {
			return handler.CommonResponseStatusInternalServerError(txerr)
		}
	}

	return commonResponse
}

func McIamLoginRefresh(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPost, handler.MCIAMMANAGER, loginrefresh, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamLogout(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	headerAccessToken := c.Request().Header.Get("Authorization")
	accessToken := strings.TrimPrefix(headerAccessToken, "Bearer ")
	err := mcimw.UserInfoSet(c, accessToken)
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err)
	}

	targetSubject, _ := uuid.FromString(c.Data()["Sub"].(string))
	usersess := &usersession{}
	txerr := models.DB.Find(usersess, targetSubject)
	if txerr != nil {
		return handler.CommonResponseStatusBadRequest(txerr.Error())
	}

	req := &handler.CommonRequest{
		Request: &mciammanagerAccessTokenRefeshRequset{
			RefreshToken: usersess.RefreshToken,
		},
	}

	commonResponse, err := handler.CommonCaller(http.MethodPost, handler.MCIAMMANAGER, logout, req, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	txerr = models.DB.Destroy(usersess)
	if txerr != nil {
		return handler.CommonResponseStatusInternalServerError(txerr.Error())
	}
	return commonResponse
}

func McIamGetUserInfo(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, getuserinfo, commonRequest, c.Request().Header.Get("Authorization"))
	return commonResponse
}

func McIamGetUserValidate(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, getusevalidate, commonRequest, c.Request().Header.Get("Authorization"))
	return commonResponse
}

// project
func McIamGetprojectlist(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, getprojectlist, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamCreateproject(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPost, handler.MCIAMMANAGER, createproject, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamDeleteproject(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodDelete, handler.MCIAMMANAGER, deleteproject, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamGetproject(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, getproject, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamUpdateproject(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPut, handler.MCIAMMANAGER, updateproject, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

// workspace
func McIamGetworkspacelist(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, getworkspacelist, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamGetworkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, getworkspace, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamCreateworkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPost, handler.MCIAMMANAGER, createworkspace, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamDeleteworkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodDelete, handler.MCIAMMANAGER, deleteworkspace, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamUpdateworkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPut, handler.MCIAMMANAGER, updateworkspace, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

// role
func McIamGetrolelist(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, getrolelist, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamGetrole(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, getrole, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamCreaterole(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPost, handler.MCIAMMANAGER, createrole, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamDeleterole(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodDelete, handler.MCIAMMANAGER, deleterole, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

// workspace - project Mapping
func McIamGetworkspaceprojectmapping(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, getworkspaceprojectmapping, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamDeleteworkspaceprojectmappingallbyworkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodDelete, handler.MCIAMMANAGER, deleteworkspaceprojectmappingallbyworkspace, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamGetworkspaceprojectmappingbyworkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, getworkspaceprojectmappingbyworkspace, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamCreateworkspaceprojectmapping(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPost, handler.MCIAMMANAGER, createworkspaceprojectmapping, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamUpdateworkspaceprojectmapping(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPut, handler.MCIAMMANAGER, updateworkspaceprojectmapping, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamDeleteworkspaceprojectmapping(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodDelete, handler.MCIAMMANAGER, deleteworkspaceprojectmapping, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

// workspace - user - role Mapping
func McIamGetworkspaceuserrolemapping(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, getworkspaceuserrolemapping, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamGetworkspaceuserrolemappingbyworkspaceuser(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, getworkspaceuserrolemappingbyworkspaceuser, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamDeleteworkspaceuserrolemappingall(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodDelete, handler.MCIAMMANAGER, deleteworkspaceuserrolemappingall, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamGetworkspaceuserrolemappingbyworkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, getworkspaceuserrolemappingbyworkspace, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamCreateworkspaceuserrolemapping(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPost, handler.MCIAMMANAGER, createworkspaceuserrolemapping, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamDeleteworkspaceuserrolemapping(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodDelete, handler.MCIAMMANAGER, deleteworkspaceuserrolemapping, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamGetworkspaceuserrolemappingbyuser(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, getworkspaceuserrolemappingbyuser, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamUpdateworkspaceuserrolemappingbyuser(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPut, handler.MCIAMMANAGER, updateworkspaceuserrolemappingbyuser, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}
