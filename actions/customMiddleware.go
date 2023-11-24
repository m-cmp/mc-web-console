package actions

import (
	"log"
	"strings"

	"github.com/gobuffalo/buffalo"
	//"github.com/gobuffalo/pop/v6"
	"github.com/gofrs/uuid"

	"github.com/pkg/errors"

	_ "mc_web_console/docs" //mc_web_console의 경우
	//iammanager "mc_web_console/frameworkmodel/iammanager"
	"mc_web_console/handler"
	"mc_web_console/models"
	util "mc_web_console/util"
)

/*
	app.go 에서 사용하는 미들웨어를 따로 모아놓음.
	middleware moved to middleware.go
	2023-06-28
*/

// 경로에 따른 middle ware 설정
// "/" 는 루트이므로 skip
// "/user/new" 신규 사용자용으로 skip
// "/signin/", "/logout/" 로그인용으로 skip
// "/api" 는 SetCurrentUser skip. (공유 ns 목록조회로 화면에 표시하는 용도임.)
func SkipMiddlewareByRoutePath(next buffalo.Handler) buffalo.Handler {
	return func(c buffalo.Context) error {
		log.Println("RouteMiddleware ***************", c.Request().URL.Path)
		if c.Request().URL.Path == "/" {
			log.Println("this path is root ", c.Request().URL.Path)
			return next(c)
		}
		if c.Request().URL.Path == "/getget/" || c.Request().URL.Path == "/getget2/" {
			log.Println("this path is getget ", c.Request().URL.Path)
			return next(c)
		}

		if c.Request().URL.Path == "/users/new/" || c.Request().URL.Path == "/auth/signin/mngform/" || c.Request().URL.Path == "/api/auth/logout/" {
			//if c.Request().URL.Path == "/main/" || c.Request().URL.Path == "/users/new/" || c.Request().URL.Path == "/signin/" || c.Request().URL.Path == "/logout/" {
			log.Println("this path skips auth ", c.Request().URL.Path)
			return next(c)
		}

		// '/api'로 시작하는 경로에 대해 SetCurrentUser 미들웨어를 건너뛰도록 설정합니다.
		if strings.HasPrefix(c.Request().URL.Path, "/api/") {
			log.Println("this path for api ", c.Request().URL.Path)
			return next(c)
		}

		if strings.HasPrefix(c.Request().URL.Path, "/ws/") {
			log.Println("this path for websocket ", c.Request().URL.Path)
			return next(c)
		}

		if strings.HasPrefix(c.Request().URL.Path, "/route/") {
			log.Println("this path for router ", c.Request().URL.Path)
			return next(c)
		}

		// 세션이 없으면 로그인화면으로
		if uid := c.Session().Get("current_user_id"); uid == nil {

			c.Session().Set("redirectURL", c.Request().URL.String())
			err := c.Session().Save()
			if err != nil {
				log.Println("Authorize session err ", err)
				return errors.WithStack(err)
			}

			c.Flash().Add("danger", "You must be authorized to see that page")
			log.Println("Flash().Add ~~~~~~ c.Redirect")
			//return c.Redirect(302, "/signin/mngform/")
			//return c.Redirect(302, "/auth/signin/mngform/")
			// return RedirectTool(c,"authNewFormPath")
			return RedirectTool(c, "authNewForm")
		}

		return SetCurrentUser(next)(c)
	}
}

// provider를 미들웨어로 만들어서 세션에 저장하고
// html tempalte에서 사용할 수 있게 만들자.
func SetCloudProviderList(next buffalo.Handler) buffalo.Handler {
	return func(c buffalo.Context) error {
		//log.Println("SetCloudProviderList ~~~~")
		if cloudOsList := c.Session().Get("cloud_os_list"); cloudOsList == nil { // 존재하지 않으면 조회
			log.Println("SetCloudProviderList ~~~~")
			cloudOsList, respStatus := handler.GetCloudOSList()
			if respStatus.StatusCode == 500 {
				return next(c)
			}
			c.Session().Set("cloud_os_list", cloudOsList)
			c.Set("cloud_os_list", cloudOsList)
			log.Println("##########cloud_os_list###########")
			log.Println(cloudOsList)
			log.Println("#########cloud_os_list############")
			err := c.Session().Save()
			if err != nil {
				return errors.WithStack(err)
			}
		} else {
			log.Println("Reuse cloudOsList *** ")
			c.Set("cloud_os_list", cloudOsList) // 화면에서 cloud_os_list 사용을 위해
		}

		return next(c)
	}
}

// SetCurrentUser attempts to find a user based on the current_user_id
// in the session. If one is found it is set on the context.
func SetCurrentUser(next buffalo.Handler) buffalo.Handler {
	return func(c buffalo.Context) error {
		log.Println("SetCurrentUser~~~~~~~~~~~~~~~~~~~")
		// uid := c.Session().Get("current_user_id")
		// if uid == nil {
		// 	c.Session().Clear()
		// 	spew.Dump("session current_user_id error uid is nil ")
		// 	return c.Redirect(302, "/signin")
		// }

		// u := &models.MCUser{}
		// tx := c.Value("tx").(*pop.Connection)
		// err := tx.Find(u, uid)
		// if err != nil {
		// 	c.Session().Clear()
		// 	spew.Dump("user Find  error : ", &err)
		// 	return c.Redirect(302, "/signin")
		// }

		// 의미없네?? 왜? session에 넣어야하나? => render 직전에 c.Set 또는 routeInfo의 getHandlerFuncByName에서
		// c.Set("current_user", "xx")
		// c.Set("current_user_id", "xxx")
		// c.Set("current_user_level", "xxxx")
		// c.Set("current_workspace", "yy")
		// c.Set("current_workspace_id", "yyy") // 의미없네?? 왜? session에 넣어야하나?
		// c.Set("current_namespace", "nn")
		// c.Set("current_namespace_id", "nnn")
		// c.Set("assigned_ws_list", []interface{}{})
		// c.Set("assigned_ns_list", []interface{}{})
		log.Println("c get xx 11111111111111111111111111111111")
		//c.Set("iamAccessToken", "")

		if uid := c.Session().Get("current_workspace_id"); uid != nil {
			c.Session().Set("current_workspace_id", "")
		}
		//if uid := c.Session().Get("current_namespace"); uid != nil {
		//	c.Session().Set("current_namespace", "")
		//}
		//if uid := c.Session().Get("current_namespace_id"); uid != nil {
		//	c.Session().Set("current_namespace_id", "")
		//}

		if uid := c.Session().Get("current_project_name"); uid != nil {
			c.Session().Set("current_project_name", "")
		}
		if uid := c.Session().Get("current_project_id"); uid != nil {
			c.Session().Set("current_project_id", "")
		}

		if uid := c.Session().Get("current_user_id"); uid != nil {
			log.Println("uid ", uid)

			if current_project_name := c.Session().Get("current_project_name"); current_project_name == nil {
				c.Set("current_project_name", current_project_name)
			}
			if current_project_id := c.Session().Get("current_project_id"); current_project_id == nil {
				c.Set("current_project_id", current_project_id)
			}

			if util.USE_MCIAM == "Y" {
				//workspaceList := []iammanager.MCIamWorkspace{}
				// workspace 목록 조회

				authSession := models.AuthSession{}
				//err := models.DB.Where("mcuser_id = ?", uid.(string)).Last(&authSession)
				err := models.DB.Last(&authSession)
				// where expire 추가
				if err != nil {
					log.Println("AuthSession search err ", err)
					return errors.WithStack(err)
				}
				iamAccessToken := authSession.IamManagerAccessToken

				// TODO : valid token 로직 추가
				//mappingPath := app.Group(apiPath + "mapping")
				//mappingPath.POST("/ws/user", MappingWsUser)
				workspaceUserRoleMappingList, respStatus := handler.IamManagerWorkspaceUserRoleMappingListByUserId(iamAccessToken, authSession.MCUserID)
				if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
					log.Println("respStatus-")
					log.Println(respStatus)

					if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
						log.Println(respStatus)
						c.Flash().Add("fail", "IAM Session expired")

						// 할당된 workspace가 없을 수도 있음

						// currentWorkspace 가 설정되어 있으면 project 목록도.
						//IamManagerProjectList(iamAccessToken string, workspaceId string)
					} else {
						currentWorkspaceID := c.Session().Get("current_workspace_id").(string)
						for _, wsMapping := range workspaceUserRoleMappingList {
							wsID := wsMapping.ID
							if wsID == currentWorkspaceID {
								// project 목록 조회.
								projectList, respStatus := handler.IamManagerProjectList(iamAccessToken, currentWorkspaceID)
								if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
									log.Println(respStatus)
									c.Set("project_list", projectList)
								}
							}
						}
					}
				}
				c.Set("assigned_ws_list", workspaceUserRoleMappingList)

				log.Println("c.set curent_user_id ", uid)
				uuidValue, ok := uid.(uuid.UUID)
				if !ok {
					log.Println("uid is not of type uuid.UUID")
				}
				//c.Set("current_user_id", uid.(string))
				c.Set("current_user_id", uuidValue.String())
				log.Println("c.set curent_user_id2 ", uuidValue)
				//c.Set("current_user_level", u.UserLevel)
			} else {
				log.Println("getUser By id from db")
				// user정보를 db에서 처리
				u, _ := handler.GetUserById(uid.(uuid.UUID))
				userNamespaceList, err := handler.GetAssignUserNamespaces(uid.(uuid.UUID), nil)
				// sharedNamespaceList, err := handler.SharedNamespaceList(u.ID)
				if err != nil {
					log.Println("GetAssignUserNamespaces err  ", err)
				} else {
					log.Println("userNamespaceList ", userNamespaceList)
					c.Set("assigned_ns_list", userNamespaceList)
				}

				c.Set("current_user_id", u.Email)
				c.Set("current_user_level", u.UserLevel)
			}

			//shared_ns_list := GetSharedNamespaceList(u.ID, tx)
			// sharedNamespaceList, err := handler.SharedNamespaceList(u.ID)
			// if err != nil {
			// 	log.Println("err  ", err)
			// }
			//c.Session().Set("shared_ns_list", shared_ns_list)

			// c.Set("shared_ns_list", sharedNamespaceList)
			//c.Set("current_user", u)
			//c.Set("current_user_id", u.Email)
			//c.Set("current_user_level", u.UserLevel)
			//c.Set("current_credential", u.DefaultCredential)
			// log.Println("shared_ns_list length ", sharedNamespaceList)
		}

		// Menu Tree
		menutree, respStatus := handler.MenuTree()
		log.Print(respStatus)
		//menutree, respStatus := handler.MenuTree()
		//if respStatus.StatusCode == 500 {
		//	return c.Redirect(302, "/")
		//}
		c.Set("menutree", menutree)

		//log.Println("menutree length ", len(*menutree))
		log.Println("menutree ", menutree)
		//for _, item := range *menutree {
		//	log.Println("menutree  ", item)
		//}

		return next(c)
	}
}

func CheckAdmin(next buffalo.Handler) buffalo.Handler {
	return func(c buffalo.Context) error {
		if admin := c.Session().Get("current_user_level"); admin != "admin" {
			c.Flash().Add("danger", "You must be authorized to see that page")
			//return c.Redirect(302, "/")
			return RedirectTool(c, "homeFormPath")
		}
		return next(c)
	}
}

// Authorize require a user be logged in before accessing a route
func Authorize(next buffalo.Handler) buffalo.Handler {
	return func(c buffalo.Context) error {
		log.Println("Authorize ~~~~")
		if uid := c.Session().Get("current_user_id"); uid == nil {

			if c.Request().URL.Path == "/auth/signin/mngform/" {
				next(c)
			}

			c.Session().Set("redirectURL", c.Request().URL.String())
			err := c.Session().Save()
			if err != nil {
				log.Println("Authorize session err ", err)
				return errors.WithStack(err)
			}

			c.Flash().Add("danger", "You must be authorized to see that page")
			log.Println("Authorize Flash().Add ~~~~~~ c.Redirect")
			//return c.Redirect(302, "/auth/signin/mngform/")
			return RedirectTool(c, "authNewFormPath")

		}
		return next(c)
	}
}

func SkipMiddleware(next buffalo.Handler) buffalo.Handler {
	return func(c buffalo.Context) error {

		// 특정 경로와 하위 경로를 건너뛰고자 하는 조건을 체크합니다.
		if strings.HasPrefix(c.Request().URL.Path, "/api/") {
			log.Println("c.RequestURL.Path ", c.Request().URL.Path)
			// 건너뛰고자 하는 경우에는 다음 미들웨어나 핸들러를 호출하지 않고 종료합니다.
			return nil
		}

		return next(c)
	}
}
