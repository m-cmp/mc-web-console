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
	commonResponse, err := handler.CommonCallerWithoutToken(http.MethodGet, handler.MCIAMMANAGER, Alive, commonRequest)
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

// auth
func McIamLogin(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCallerWithoutToken(http.MethodPost, handler.MCIAMMANAGER, Login, commonRequest)
	if err != nil {
		log.Println("CommonCallerWithoutToken", err)
		return commonResponse
	}

	accessTokenResponse := &mciammanagerAccessTokenResponse{}
	if err := mapstructure.Decode(commonResponse.ResponseData, accessTokenResponse); err != nil {
		log.Println("token Decode ", err)
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}

	err = mcimw.UserInfoSet(c, accessTokenResponse.AccessToken)
	if err != nil {
		log.Println("UserInfoSet", err)
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
		log.Println("txErr", err)
		if strings.Contains(txerr.Error(), "SQLSTATE 23505") { // unique constraint violation catch
			txerr = models.DB.Update(usersess)
			if txerr != nil {

				return handler.CommonResponseStatusInternalServerError(txerr)
			}
		} else {
			return handler.CommonResponseStatusInternalServerError(txerr)
		}
	}
	log.Println("McIamLogin return ", commonResponse)
	return commonResponse
}

func McIamLoginRefresh(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPost, handler.MCIAMMANAGER, Loginrefresh, commonRequest, c.Request().Header.Get("Authorization"))
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

	commonResponse, err := handler.CommonCaller(http.MethodPost, handler.MCIAMMANAGER, Logout, req, c.Request().Header.Get("Authorization"))
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
	commonResponse, _ := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, Getuserinfo, commonRequest, c.Request().Header.Get("Authorization"))
	return commonResponse
}

func McIamGetUserValidate(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, _ := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, Getusevalidate, commonRequest, c.Request().Header.Get("Authorization"))
	return commonResponse
}

// project
func McIamGetprojectlist(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, Getprojectlist, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamCreateproject(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPost, handler.MCIAMMANAGER, Createproject, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamDeleteproject(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodDelete, handler.MCIAMMANAGER, Deleteprojectbyid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamGetproject(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, Getprojectbyid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamUpdateproject(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPut, handler.MCIAMMANAGER, Updateprojectbyid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

// workspace
func McIamGetworkspacelist(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, Getworkspacelist, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamGetworkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, Getworkspacebyid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamCreateworkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPost, handler.MCIAMMANAGER, Createworkspace, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamDeleteworkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodDelete, handler.MCIAMMANAGER, Deleteworkspacebyid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamUpdateworkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPut, handler.MCIAMMANAGER, Updateworkspacebyid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

// role
func McIamGetrolelist(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, Getrolelist, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamGetrole(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, Getrolebyid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamCreaterole(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPost, handler.MCIAMMANAGER, Createrole, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamDeleterole(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodDelete, handler.MCIAMMANAGER, Deleterolebyid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

// workspace - project Mapping
func McIamGetworkspaceprojectmapping(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, Getwpmappinglistorderbyworkspace, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamGetworkspaceprojectmappingbyworkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, Getwpmappinglistbyworkspaceid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamCreateworkspaceprojectmapping(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPost, handler.MCIAMMANAGER, Createwpmapping, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamUpdateworkspaceprojectmapping(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPut, handler.MCIAMMANAGER, Updatewpmappings, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamDeleteworkspaceprojectmapping(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodDelete, handler.MCIAMMANAGER, Deleteworkspaceprojectmappingbyid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

// workspace - user - role Mapping
func McIamGetworkspaceuserrolemapping(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, Getworkspaceuserrolemappinglistorderbyworkspace, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamGetworkspaceuserrolemappingbyworkspaceuser(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, Getworkspaceuserrolemappinglistbyuserid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		log.Print(" err ", err)
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	log.Print(" commonResponse ", commonResponse)
	return commonResponse
}

func McIamGetworkspaceuserrolemappingbyworkspace(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, Getworkspaceuserrolemappinglistbyworkspaceid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamCreateworkspaceuserrolemapping(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodPost, handler.MCIAMMANAGER, Createworkspaceuserrolemappingbyname, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamDeleteworkspaceuserrolemapping(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodDelete, handler.MCIAMMANAGER, Deleteworkspaceuserrolemapping, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}

func McIamGetworkspaceuserrolemappingbyuser(c buffalo.Context, commonRequest *handler.CommonRequest) *handler.CommonResponse {
	commonResponse, err := handler.CommonCaller(http.MethodGet, handler.MCIAMMANAGER, Getworkspaceuserrolemappingbyid, commonRequest, c.Request().Header.Get("Authorization"))
	if err != nil {
		return handler.CommonResponseStatusInternalServerError(err.Error())
	}
	return commonResponse
}
