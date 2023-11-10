package actions

import (
	"log"

	"database/sql"
	"encoding/gob"
	"net/http"
	"strings"
	//"time"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
	"github.com/pkg/errors"
	"golang.org/x/crypto/bcrypt"

	middleware "mc_web_console/actions/middleware"
	frameworkmodel "mc_web_console/frameworkmodel"
	iammanager "mc_web_console/frameworkmodel/iammanager"
	"mc_web_console/handler"
	"mc_web_console/models"

	util "mc_web_console/util"
)

//func init() {
//	gob.Register(map[string]string{})
//}

func init() {
	gob.Register(middleware.UserSession{})
}

// AuthLanding shows a landing page to login
// AuthLandingForm는 렌딩 화면을 렌더링합니다.
//
//	@Summary		렌딩 화면 렌더링
//	@Description	[AuthLandingForm] 렌딩 화면을 렌더링합니다. AuthLanding shows a landing page to login
//	@Tags			auth
//	@Produce		html
//	@Success		200	{html}	html	"auth/landing.html"
//	@Router			/auth/landing/mngform/ [get]
func (a actions) AuthLandingForm(c buffalo.Context) error {
	return c.Render(200, r.HTML("auth/landing.html"))
}
func (a actions) AuthLandingMngForm(c buffalo.Context) error {
	return c.Render(200, r.HTML("auth/landing.html"))
}

// AuthNewFormdms 새로운 로그인 화면을 렌더링합니다.
// AuthNew loads the signin page
//
//	@Summary		로그인 화면 렌더링
//	@Description	[AuthNewForm] 로그인 화면을 렌더링합니다. AuthNew loads the signin page
//	@Tags			auth
//	@Produce		html
//	@Success		200	{html}	html	"auth/new.html"
//	@Router			/auth/signin/mngform/ [GET]
func (a actions) AuthNewForm(c buffalo.Context) error {
	log.Println("AuthNewForm startt")
	c.Set("user", models.MCUser{})
	log.Println("AuthNewForm saved 'models.MCUser{}'")

	//r.Options.HTMLLayout = "application_login.plush.html"
	return c.Render(200, r.HTML("auth/new.html", "application_login.html"))
}

func (a actions) AuthNewMngForm(c buffalo.Context) error {
	log.Println("AuthNewMngForm startt")
	c.Set("user", models.MCUser{})
	log.Println("AuthNewMngForm saved'models.MCUser{}'")

	//r.Options.HTMLLayout = "application_login.plush.html"
	return c.Render(200, r.HTML("auth/new.html", "application_login.html"))
}

// AuthCreate attempts to log the user in with an existing account.
//
//	@Summary		로그인
//	@Description	[AuthCreate] 존재하는 계정으로 로그인을 시도합니다. attempts to log the user in with an existing account.
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			Email		formData	string	true	"Email"
//	@Param			Password	formData	string	true	"Password"
//	@Success		200			{string}	string	"{'message': 'success', 'user': 'u'}"
//	@Failure		500			{string}	string	"{'error':'verrs','status':'http.StatusUnauthorized'}"
//	@Router			/api/auth/signin/ [post]
func (a actions) AuthCreate(c buffalo.Context) error {

	//assignedWorkspaceMap := map[string]string{}
	u := &models.MCUser{}
	//spew.Dump("buffalo context : ", c)
	u.Email = c.Request().FormValue("Email")
	u.Password = c.Request().FormValue("Password")

	// if err := c.Bind(u); err != nil {
	// 	return errors.WithStack(err)
	// }

	// Iam Manager로 로그인
	if util.USE_MCIAM == "Y" {
		iamLoginInfo := iammanager.IamLoginInfo{}
		iamLoginInfo.UserName = u.Email
		iamLoginInfo.Password = u.Password

		iamAccessToken, respStatus := handler.IamManagerLogin(iamLoginInfo)
		if respStatus.StatusCode != 200 && respStatus.StatusCode != 201 {
			return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
				"message": "login failed",
				"status":  "fail",
			}))
		}

		log.Println("get iammanager access token ", iamAccessToken)
		// token을 db에 저장 : session에 저장하기에 너무 길어서 db에 저장.
		authSession := &models.AuthSession{
			MCUserID:              u.Email,
			MCAccessToken:         u.Password, // 이걸 빼?
			IamManagerAccessToken: iamAccessToken,
		}
		tx := c.Value("tx").(*pop.Connection)
		err := tx.Where("mcuser_id = ?", authSession.MCUserID).First(authSession)

		if err != nil { // 없으면 insert
			if verrs, err := authSession.Validate(tx); err != nil {
				log.Println("authSession insert Validate verrs ", verrs)
				log.Println("authSession insert Validate save err ", err)
				return err
			}
			if err := tx.Create(authSession); err != nil {
				log.Println("authSession insert Create save err ", err)
				return err
			}
		} else { // 있으면 update
			if verrs, err := authSession.Validate(tx); err != nil {
				log.Println("authSession update Validate verrs ", verrs)
				log.Println("authSession update Validate save err ", err)
				return err
			}

			//if err := tx.Update(authSession); err != nil {
			if err := tx.Save(authSession); err != nil {
				log.Println("authSession update Create save err ", err)
				return err
			}
		}

		//err = tx.Create(authSession)
		// verrs, err := authSession.ValidateCreate(tx)// 오류는 없으나 insert가 되지 않음.(버전이 안맞나?)
		// if verrs.HasAny() {
		// 	log.Println("authSession failed to save verrs ", verrs)
		// }
		// log.Println("verrs ", verrs)
		// if err != nil {
		// 	//if verrs, err := authSession.ValidateCreate(tx); err != nil {

		// 	//log.Println("authSession failed to save verrs ", verrs)
		// 	log.Println("authSession failed to save err ", err)
		// 	return err
		// }
		log.Println("saved authSession")

		// //log.Println(authSession)
		// authSession2 := &models.AuthSession{}
		// // log.Println(authSession2.TableName())
		// err = tx.Where("mcuser_id = ?", strings.ToLower(strings.TrimSpace(u.Email))).First(authSession2)

		// //err = models.DB.Where("mcuser_id = ?", u.Email).Last(&authSession2)
		// // where expire 추가
		// if err != nil {
		// 	log.Println("user authSession search err", err)
		// 	return errors.WithStack(err)
		// }

		// verrs, err := authSession.ValidateCreate(tx)
		// if verrs != nil {
		// 	log.Println("authSession failed to save1 ", verrs)
		// 	return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
		// 		"message": "login failed",
		// 		"status":  "fail",
		// 	}))
		// }
		// if err != nil {
		// 	log.Println("authSession failed to save2 ", err)
		// 	return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
		// 		"message": "login failed",
		// 		"status":  "fail",
		// 	}))
		// }

	} else {
		// DB로 로그인 : MCIAM을 사용하지 않으면 workspace도 사용하지 않음.(MCIAM 안에 workspace가 있음)
		// USER로그인이 되면 사용가능한 namespace 목록까지 return
		// TODO : 쿼리 날리는 부분 handler로 옮길 것.
		tx := c.Value("tx").(*pop.Connection)

		// find a user with the email
		err := tx.Where("email = ?", strings.ToLower(strings.TrimSpace(u.Email))).First(u)

		// helper function to handle bad attempts
		bad := func() error {
			verrs := validate.NewErrors()
			verrs.Add("email", "invalid email/password")
			c.Set("errors", verrs)
			c.Set("user", u)
			return c.Render(http.StatusUnauthorized, r.JSON(map[string]interface{}{
				"error":  verrs,
				"status": http.StatusUnauthorized,
			}))

		}

		if err != nil {
			if errors.Cause(err) == sql.ErrNoRows {
				log.Println("sql.ErrNoRows ", err)
				return bad()
			}
			log.Println("bad() ", err)
			return errors.WithStack(err)
		}

		// confirm that the given password matches the hashed password from the db
		err = bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(u.Password))
		if err != nil {
			log.Println("CompareHashAndPassword bad() ", err)
			return bad()
		}
		// _, ns := handler.GetNamespaceById(u.DefaultNamespace, tx)

	}

	userSession := middleware.UserSession{}
	userSession.UserID = u.Email
	//userSession.CurrentUserToken = u.Password

	middleware.SetUserSession(c, userSession)

	// c.Session().Session.Options.MaxAge = 20
	// //c.Session().Set("current_user_id", u.ID)
	// c.Session().Set("current_user_id", u.Email)
	// c.Session().Set("current_user_pw", u.Password) // iam manager 로그인을 위해 임시 추가.(token 재발행 시 필요)

	// c.Set("current_namespace", "")
	// c.Set("current_namespace_id", "")
	//c.Set("assigned_ws_list", assignedWorkspaceMap)

	// if u.DefaultNamespace != "" {
	// 	ns, err := handler.GetNamespaceById(u.DefaultNamespace)
	// 	if err != nil {
	// 		c.Session().Set("current_namespace_id", "")
	// 		c.Session().Set("current_namespace", "")
	// 	} else {
	// 		c.Session().Set("current_namespace_id", ns.ID)
	// 		c.Session().Set("current_namespace", ns.NsName)
	// 	}

	// } else {
	// 	c.Session().Set("current_namespace_id", "")
	// 	c.Session().Set("current_namespace", "")
	// }
	// log.Println("login step. ")
	// if u.DefaultCredential != "" {
	// 	c.Session().Set("current_credential", u.DefaultCredential)
	// }
	c.Flash().Add("success", "Welcome Back to MCMP!")
	log.Println("return login success ")
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))
}

// AuthDestroy clears the session and logs a user out
//
//	@Summary		로그아웃
//	@Description	[AuthDestroy] 로그아웃을 합니다. clears the session and logs a user out
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Success		200	{string}	string	"{'success-Flash': 'You have been logged out!'}"
//	@Router			/api/auth/logout/ [get]
func (a actions) AuthDestroy(c buffalo.Context) error {
	//middleware.ClearUserIDSession(c, userSession)
	c.Session().Clear()
	c.Flash().Add("success", "You have been logged out!")
	//return c.Redirect(302, "/auth/signin/mngform/")
	return RedirectTool(c, "authNewFormPath")
}

// UserInfo
//
//	@Summary		사용자 정보 조회
//	@Description	사용자의 현재 workspace, namespace 등
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Success		200			{string}	string	"{'message': 'success', 'user': 'u'}"
//	@Failure		500			{string}	string	"{'error':'verrs','status':'http.StatusUnauthorized'}"
//	@Router			/api/auth/user/ [get]
func (a actions) UserInfo(c buffalo.Context) error {
	// session에서 사용자 정보 꺼냄.
	userInfo, err := middleware.GetUserInfoFromSession(c)

	if err != nil {
		return c.Render(http.StatusUnauthorized, r.JSON(map[string]interface{}{
			"error":  err,
			"status": http.StatusUnauthorized,
		}))
	}

	workspaceList := []iammanager.MCIamWorkspace{}
	namespaceList := []models.Namespace{}
	respStatus := frameworkmodel.WebStatus{}

	// Iam Manager로 로그인
	if util.USE_MCIAM == "Y" {
		//userSession := middleware.UserSession{}
		//userSession.UserID = u.Email
		//userSession.CurrentUserToken = u.Password

		log.Println("Get Token from db")

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
		// iam manager에서 workspace 목록 조회
		workspaceList, respStatus = handler.IamManagerWorkspaceList(authSession.IamManagerAccessToken)
		log.Println("respStatus", respStatus)
		if respStatus.StatusCode != 200 {
			return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{
				"error":  respStatus.Message,
				"status": respStatus.StatusCode,
			}))
		}
		log.Println(workspaceList)
		//"id": "83f1636c-a4c2-479b-a31f-83b73e1e5674",
		// "name": "test_workspace",
		// "description": "test_workspace create",
		// "created_at": "2023-11-02T18:22:23.719184Z",
		// "updated_at": "2023-11-02T18:22:23.719184Z"
		log.Println("Get user namespaces")
		// iam manager에서 workspace의 namespace 목록 조회 또는 추출
		namespaceList = append(namespaceList, models.Namespace{ID: "ns01", NsName: "ns01"})

	} else {
		// userNamespace 목록 조회
		namespaceList = append(namespaceList, models.Namespace{ID: "ns01", NsName: "ns01"})
	}
	middleware.SetUserSession(c, userInfo)

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":       "success",
		"status":        200,
		"userInfo":      userInfo,
		"workspaceList": workspaceList,
		"namespaceList": namespaceList,
	}))
}
