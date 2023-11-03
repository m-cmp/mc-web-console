package actions

import (
	"log"
	"net/http"
	"strings"

	"github.com/davecgh/go-spew/spew"
	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"

	"github.com/pkg/errors"

	"mc_web_console/handler"
	"mc_web_console/models"
)

func (a actions) UsersNewForm(c buffalo.Context) error {
	u := models.MCUser{}
	c.Set("user", u)
	//r.HTMLLayout = "application"
	return c.Render(200, r.HTML("users/new.html", "application_login.html"))
}

func (a actions) MainForm(c buffalo.Context) error {
	u := models.MCUser{}
	c.Set("user", u)
	if ns := c.Session().Get("current_namespace"); ns != nil {
		c.Set("current_namespace", ns)
	}

	return c.Render(200, r.HTML("main/index.html"))
}

// UsersCreate registers a new user with the application.

// UsersNew renders the users form

func (a actions) UsersCreate(c buffalo.Context) error {
	u := &models.MCUser{}
	if err := c.Bind(u); err != nil {
		return errors.WithStack(err)
	}

	// default namespace 생성
	email := strings.ToLower(strings.TrimSpace(u.Email))
	prefix_email := strings.Split(email, "@")
	default_ns := prefix_email[0]
	//u.DefaultNamespace = default_ns

	//verrs, err := u.Create(tx)// handler로 이동

	ns_err := NamespaceCreateDefault(c, default_ns, u)
	if ns_err != nil {
		spew.Dump("=====================")
		spew.Dump("NamespaceCreateDefault error")
		spew.Dump("=====================")
		return errors.WithStack(ns_err)
	}
	// 사용자가 가입하고 signin 으로 로그인하게 보낼 경우는
	// 세션에 사용자 ID를 담을 필요가 없음
	// c.Session().Set("current_user_id", u.ID)
	// c.Flash().Add("success", "Welcome to Buffalo!")
	spew.Dump("=====================")
	spew.Dump("여기까지 실행 됐음!!!")
	spew.Dump("=====================")
	//return c.Redirect(301, "/auth/signin/mngform/")
	//return RedirectTool(c,"authNewFormPath")
	return RedirectTool(c, "authNewForm")
}

// 기본 namespace 설정완료.
// SetCurrentNamespace
//

func (a actions) SetCurrentNamespace(c buffalo.Context) error {
	log.Println("SetCurrentNamespace")
	spew.Dump("======setCurrenttNamespace======")
	namespaceID := c.Param("nsId")
	log.Println(namespaceID)
	//tx := c.Value("tx").(*pop.Connection)
	//ns_err, get_ns := handler.GetNamespaceById(namespaceID, tx)
	ns, ns_err := handler.GetNamespaceById(namespaceID)
	if ns_err != nil {
		spew.Dump(ns_err)
	}
	namespaceName := ns.NsName
	c.Session().Set("current_namespace_id", namespaceID)
	c.Session().Set("current_namespace", namespaceName)
	c.Set("current_namespace_id", namespaceID)
	c.Set("current_namespace", namespaceName)

	return c.Render(200, r.JSON(map[string]interface{}{
		"CurrentNameSpaceID": namespaceID,
	}))
}

// SetDefaultNamespace
//

// func (a actions) SetDefaultNamespace(c buffalo.Context) error {
// 	log.Println("SetDefaultNamespace")
// 	spew.Dump("======setDefaultNamespace======")
// 	namespace := c.Param("nsId")
// 	//namespace := tbcommon.TbNsInfo{}
// 	//if err := c.Bind(namespace); err != nil {
// 	//	return errors.WithStack(err)
// 	//}
// 	//
// 	//log.Debug("bind")

// 	uid := c.Session().Get("current_user_id")

// 	tx := c.Value("tx").(*pop.Connection)
// 	u := &models.MCUser{}
// 	ns := &models.Namespace{}
// 	// 현재 사용자 가져오기
// 	u_err := tx.Find(u, uid)
// 	if namespace != u.DefaultNamespace {
// 		u.DefaultNamespace = namespace
// 		spew.Dump(u)
// 		spew.Dump("======setDefaultNamespace======")
// 		if u_err != nil {
// 			return errors.WithStack(u_err)
// 		}

// 		// 새로 정의한 Default Namespace를 업데이트 친다.
// 		e := tx.Eager().Save(u)
// 		get_ns, ns_err := handler.GetNamespaceById(u.DefaultNamespace)
// 		if ns_err != nil {
// 			spew.Dump(ns_err)
// 		}

// 		if e != nil {
// 			spew.Dump(e)
// 		}
// 		ns = get_ns
// 	}
// 	//현재 사용자의 Default Namespace 를 새로 정의 하고

// 	log.Println(ns)
// 	c.Session().Set("current_namespace", ns.NsName)
// 	c.Session().Set("current_namespace_id", ns.ID)
// 	err := c.Session().Save()
// 	if err != nil {
// 		return errors.WithStack(err)
// 	}

// 	return c.Render(200, r.JSON(map[string]interface{}{
// 		"DefaultNameSpaceID":   u.DefaultNamespace,
// 		"DefaultNameSpaceName": ns.NsName,
// 	}))
// }

// GetUserByEmail
//

func (a actions) GetUserByEmail(c buffalo.Context) error {
	tx := c.Value("tx").(*pop.Connection)
	email := c.Param("email")

	u := &models.MCUser{}

	//이미 스크립트에서 거르는데 또 거를 필요가 있을까? 싶네....
	if email != "" {
		q := tx.Eager().Where("email = ?", email)
		b, e_err := q.Exists(u)
		if e_err != nil {
			return c.Render(http.StatusExpectationFailed, r.JSON(map[string]interface{}{
				"error":  "something query error",
				"status": "301",
			}))
		}
		if b {
			err := q.First(u)
			spew.Dump("====GET FIRST U====")
			spew.Dump(u)
			spew.Dump("====GET FIRST U====")
			h_err, uns := handler.GetAssignUserNamespaces(u.ID, tx)
			if h_err != nil {
				return c.Render(301, r.JSON(map[string]interface{}{
					"error":  "cannot find user",
					"status": "301",
				}))
			}

			u.UserNamespaces = *uns

			if err != nil {
				return c.Render(301, r.JSON(map[string]interface{}{
					"error":  "cannot find user",
					"status": "301",
				}))

			}

		} else {
			return c.Render(301, r.JSON(map[string]interface{}{
				"error":  "cannot find user",
				"status": "301",
			}))
		}
	} else {
		return c.Render(http.StatusExpectationFailed, r.JSON(map[string]interface{}{
			"error":  "Please input Email",
			"status": "301",
		}))
	}
	return c.Render(http.StatusOK, r.JSON(u))
}
