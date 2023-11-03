package actions

import (
	"log"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/gofrs/uuid"

	"github.com/pkg/errors"

	_ "mc_web_console/docs" //mc_web_console의 경우
	"mc_web_console/handler"
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
		log.Println("SetCloudProviderList ~~~~")
		if cloudOsList := c.Session().Get("cloud_os_list"); cloudOsList == nil { // 존재하지 않으면 조회
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

		if uid := c.Session().Get("current_user_id"); uid != nil {
			// u := &models.MCUser{}
			// tx := c.Value("tx").(*pop.Connection)
			// err := tx.Find(u, uid)
			// if err != nil {
			// 	c.Session().Clear()
			// 	spew.Dump("user Find  error : ", &err)
			// 	return c.Redirect(302, "/")
			// 	//return errors.WithStack(err)
			// }
			u, _ := handler.GetUserById(uid.(uuid.UUID))

			if current_namespace_id := c.Session().Get("current_namespace_id"); current_namespace_id == nil {
				// ns, _ := handler.GetNamespaceById(u.DefaultNamespace)
				// c.Set("current_namespace", ns.NsName)
				// c.Set("current_namespace_id", ns.ID)

				c.Set("current_namespace", "")
				c.Set("current_namespace_id", "")

			} else {
				current_namespace := c.Session().Get("current_namespace")
				c.Set("current_namespace", current_namespace)
				c.Set("current_namespace_id", current_namespace_id)

			}

			//shared_ns_list := GetSharedNamespaceList(u.ID, tx)
			sharedNamespaceList, err := handler.SharedNamespaceList(u.ID)
			if err != nil {
				log.Println("err  ", err)
			}

			//c.Session().Set("shared_ns_list", shared_ns_list)

			c.Set("shared_ns_list", sharedNamespaceList)
			c.Set("current_user", u)
			c.Set("current_user_id", u.Email)
			c.Set("current_user_level", u.UserLevel)
			//c.Set("current_credential", u.DefaultCredential)
			log.Println("shared_ns_list length ", sharedNamespaceList)
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
