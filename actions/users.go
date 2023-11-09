package actions

import (
	"log"
	"net/http"
	"strings"

	"github.com/davecgh/go-spew/spew"
	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"

	"github.com/gofrs/uuid"
	"github.com/pkg/errors"

	"mc_web_console/handler"
	"mc_web_console/models"

	middleware "mc_web_console/actions/middleware"
	iammanager "mc_web_console/frameworkmodel/iammanager"
	tbcommon "mc_web_console/frameworkmodel/tumblebug/common"

	util "mc_web_console/util"
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

	// c.Set("current_workspace", "-")
	// c.Set("current_workspace_id", "--")
	// c.Set("current_namespace", "|")
	// c.Set("current_namespace_id", "||")

	// middleware에서 user work space를 조회하고 workspace 선택 시 namespace를 조회하므로 해당 로직 필요없음.
	// if ns := c.Session().Get("current_namespace"); ns != nil {
	// 	log.Println("Mainform ns ", ns)
	// 	c.Set("current_namespace", ns)

	// } else {
	// 	c.Set("current_namespace", "")
	// 	c.Set("current_namespace_id", "")
	// }
	log.Println("c get xx 22222222222222222222222222")
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

// 현재 사용자의 workspace 설정
func (a actions) SetCurrentWorkspace(c buffalo.Context) error {
	log.Println("SetCurrentWorkspace")

	//WorkspaceID
	mcimWorkspace := &iammanager.MCIamWorkspace{}
	if err := c.Bind(mcimWorkspace); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(err))
	}
	workspaceID := mcimWorkspace.ID
	//workspaceID := c.Param("wsId")// Get일 때
	log.Println("workspaceID ", workspaceID)

	// session에서 사용자 정보 꺼냄.
	userInfo, err := middleware.GetUserInfoFromSession(c)

	if err != nil {
		log.Println("GetUserInfoFromSession failed at SetCurrentWorkspace ")
		return c.Render(http.StatusUnauthorized, r.JSON(map[string]interface{}{
			"error":  err,
			"status": http.StatusUnauthorized,
		}))
	}

	// user의 workspace 목록 조회
	// Iam Manager로 로그인
	if util.USE_MCIAM == "Y" {
		// DB에서 Token 조회
		authSession := &models.AuthSession{}
		tx := c.Value("tx").(*pop.Connection)
		err := tx.Where("mcuser_id = ?", userInfo.UserID).First(authSession)
		if err != nil {
			return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
				"error": err,
			}))
		}
		log.Println(authSession)
		log.Println("Get user workspaces")
		// iam manager에서 workspace 조회
		workspace, respStatus := handler.GetIamManagerWorkspaceByID(authSession.IamManagerAccessToken, workspaceID)
		log.Println("respStatus", respStatus)
		if respStatus.StatusCode != 200 {
			return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}
		if workspace.ID == "" {
			log.Println("workspace doesn't exist")
			return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}
		log.Println(workspace)
		userInfo.CurrentWorkspaceID = workspace.ID
		userInfo.CurrentWorkspaceName = workspace.Name
		userInfo.CurrentNamespaceID = ""   // workspace변경이되면 namespace는 초기화
		userInfo.CurrentNamespaceName = "" // workspace변경이되면 namespace는 초기화
		middleware.SetUserSession(c, userInfo)
	} else {
		// MCIAM을 사용해야 workspace를 이용할 수 있음.
		return c.Render(301, r.JSON(map[string]interface{}{
			"error":  "Please activate MCIAM-Manager ",
			"status": "301",
		}))
	}

	return c.Render(200, r.JSON(map[string]interface{}{
		"CurrentWorkspaceID":   userInfo.CurrentWorkspaceID,
		"CurrentWorkspaceName": userInfo.CurrentWorkspaceName,
		"CurrentNamespaceID":   userInfo.CurrentNamespaceID,
		"CurrentNamespaceName": userInfo.CurrentNamespaceName,
	}))
}

// 기본 namespace 설정완료.
// SetCurrentNamespace
// TODO : 이름도 Namespace -> project로 바꿔야 하나??
func (a actions) SetCurrentNamespace(c buffalo.Context) error {
	log.Println("SetCurrentNamespace")

	//namespaceID := c.Param("nsId")
	//log.Println(namespaceID)
	namespaceInfo := &tbcommon.TbNsInfo{}
	if err := c.Bind(namespaceInfo); err != nil {
		return c.Render(http.StatusBadRequest, r.JSON(err))
	}

	// session에서 사용자 정보 꺼냄.
	userInfo, err := middleware.GetUserInfoFromSession(c)
	if err != nil {
		log.Println("GetUserInfoFromSession failed at SetCurrentNamespace ")
		return c.Render(http.StatusUnauthorized, r.JSON(map[string]interface{}{
			"error":  err,
			"status": http.StatusUnauthorized,
		}))
	}

	// mciam manager를 사용하는 경우 workspace 가 먼저 선택되어야 한다.
	if util.USE_MCIAM == "Y" {
		// workspace가 선택되어 있어야 한다.
		if userInfo.CurrentWorkspaceID == "" {
			return c.Render(http.StatusUnauthorized, r.JSON(map[string]interface{}{
				"error":  "Select the workspace first",
				"status": http.StatusUnauthorized,
			}))
		}

		// DB에서 Token 조회
		authSession := &models.AuthSession{}
		tx := c.Value("tx").(*pop.Connection)
		err := tx.Where("mcuser_id = ?", userInfo.UserID).First(authSession)
		if err != nil {
			return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
				"error": err,
			}))
		}
		log.Println(authSession)

		// 해당 workspace내 project가 존재해야 한다.( iam 전송시 namespace => project로 사용 )// iammanager.MCIamProject
		project, respStatus := handler.GetIamManagerProject(authSession.IamManagerAccessToken, userInfo.CurrentWorkspaceID, namespaceInfo.ID)
		log.Println("respStatus", respStatus)
		if respStatus.StatusCode != 200 {
			return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}
		if project.ID != "" {
			log.Println("namespace doesn't exist")
			return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}

		userInfo.CurrentNamespaceID = project.ID
		userInfo.CurrentNamespaceName = project.Name
		middleware.SetUserSession(c, userInfo)
	} else {
		namespaceID := namespaceInfo.ID
		uid, err := uuid.FromString(userInfo.UserID) // 사용자 ID를 DB에서 조회결과를 넣었으면 조회도 uuid형태로 변경필요.
		if err != nil {
			log.Println("userID  ", userInfo.UserID)
			log.Println("can not change to uuid ", err)
			return c.Render(500, r.JSON(map[string]interface{}{
				"error":  err.Error(),
				"status": 500,
			}))
		}

		tx := c.Value("tx").(*pop.Connection)
		exists, _ := handler.CheckExistsUserNamespace(uid, namespaceID, tx)
		if !exists {
			return c.Render(301, r.JSON(map[string]interface{}{
				"error":  "cannot find the user's namespace of user",
				"status": "301",
			}))
		}
		// log.Println("UserNamespace ", userNamespace)

		// Model에 관계정의를 하면 자동으로 Join이 되어야 하는데... 안되어서 ns만 다시 조회
		namespace, err := handler.GetNamespaceById(namespaceID)
		if err != nil {
			return c.Render(301, r.JSON(map[string]interface{}{
				"error":  "cannot find the user's namespace of user",
				"status": "301",
			}))
		}

		userInfo.CurrentNamespaceID = namespace.ID
		userInfo.CurrentNamespaceName = namespace.NsName // local table에 ns이름을 NsName으로 정의 함.
		middleware.SetUserSession(c, userInfo)
	}

	return c.Render(200, r.JSON(map[string]interface{}{
		"CurrentNamespaceID":   userInfo.CurrentNamespaceID,
		"CurrentNamespaceName": userInfo.CurrentNamespaceName,
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
			uns, h_err := handler.GetAssignUserNamespaces(u.ID, tx)
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
