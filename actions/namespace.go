package actions

import (
	"log"
	"math/rand"
	frameworkmodel "mc_web_console/frameworkmodel"
	"mc_web_console/handler"
	"mc_web_console/models"
	"net/http"
	"time"

	tbcommon "mc_web_console/frameworkmodel/tumblebug/common"
	"mc_web_console/frameworkmodel/webtool"

	"github.com/davecgh/go-spew/spew"
	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
	"github.com/gofrs/uuid"
	"github.com/pkg/errors"
)

// const CHARSET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
// namespace 제약조건 : "The first character of name must be a lowercase letter, and all following characters must be a dash, lowercase letter, or digit, except the last character, which cannot be a dash."
const NSCHARSET = "abcdefghijklmnopqrstuvwxyz0123456789"

// 첫번째 문자는 무조건 영문 소문자 여야 한다.
const FCHARSET = "abcdefghijklmnopqrstuvwxyz"

// NamespaceMngForm
//

func (a actions) NamespaceMngForm(c buffalo.Context) error {

	return c.Render(http.StatusOK, r.HTML("settings/namespace/mngform.html"))
}

// NamespaceCreateForm
//

func (a actions) NamespaceCreateForm(c buffalo.Context) error {
	ns := &models.Namespace{}
	c.Set("ns", ns)
	return c.Render(http.StatusOK, r.HTML("namespace/_create.html"))
}

// Tumble에 등록된 모든 namespace 목록 조회
// db에서 사용하는 namespace model에는 사용자 정보가 들어가 있어서
// 가져온 값 그대로 return
func (a actions) NamespaceAllList(c buffalo.Context) error {
	nsList, nsStatus := handler.GetNameSpaceList()
	if nsStatus.StatusCode == 500 {
		return c.Render(http.StatusOK, r.JSON(nsStatus))
	}

	return c.Render(http.StatusOK, r.JSON(nsList))
}

// 해당 user의 namespace 목록 조회

// NamespaceList
//

func (a actions) NamespaceList(c buffalo.Context) error {
	//내가 생성한 NS외에 내가 share받은 NS를 가져와야 함으로
	// user_namespaces 에서 가져와야 함.
	// 아니다 내가 생성한것 만 조히하고 싶을 수도 있겠다.
	// 공유 받은 NS호출때는 GetsharedNamespace를 호출하자
	ns := &models.Namespaces{}

	if uid := c.Session().Get("current_user_id"); uid != nil {
		log.Println("(a actions) NamespaceList ", uid)
		tx := c.Value("tx").(*pop.Connection)

		q := tx.Eager().Where("user_id = ?", uid)

		err := q.All(ns)

		if err != nil {
			return errors.WithStack(err)
		}
	}
	c.Set("ns_list", ns)
	// return c.Render(http.StatusOK, r.HTML("namespace/list.html"))
	return c.Render(http.StatusOK, r.JSON(ns))
}

// 해당 user의 namespace 목록 조회
// NamespaceGet
//

func (a actions) NamespaceGet(c buffalo.Context) error {
	ns := &models.Namespace{}
	c.Set("ns", ns)

	err := c.Bind(ns)
	if err != nil {
		return errors.WithStack(err)
	}

	if uid := c.Session().Get("current_user_id"); uid != nil {

		tx := c.Value("tx").(*pop.Connection)

		q := tx.Eager().Where("user_id = ? and ns_name = ? ", uid, ns.NsName)
		err := q.All(ns)

		if err != nil {
			return errors.WithStack(err)
		}
	}
	return c.Render(http.StatusOK, r.JSON(ns))
}

// NamespaceUpdate - 미구현
//

func (a actions) NamespaceUpdate(c buffalo.Context) error {

	return c.Render(http.StatusBadRequest, r.JSON(frameworkmodel.WebStatus{StatusCode: 500, Message: "not implementated yet"}))
}

// share namespace
func (a actions) NamespaceShare(c buffalo.Context) error {
	tx := c.Value("tx").(*pop.Connection)
	// 현재 사용자 가져 오기
	u := c.Value("current_user").(*models.MCUser)
	user_level := u.UserLevel
	c.Set("user_level", user_level)

	us := models.MCUsers{}
	ns := models.Namespaces{}
	uns := models.UserNamespaces{}

	// 관리자 여부 확인에 따른 NS 가져 오기
	// 관리자는 모든 사용자 리스트르 다 가져오고
	// 일반 사용자는 검색해 할당하는 것으로 한다.
	if user_level == "admin" {
		//err := tx.Eager().Where(" user_level != 'admin' ").All(&us)
		err := tx.Eager().All(&us)
		if err != nil {
			return errors.WithStack(err)
		}
		err1 := tx.Eager().All(&ns)
		if err1 != nil {
			return errors.WithStack(err1)
		}
		c.Set("ns_list", ns)
		c.Set("user_list", us)

	} else {
		//us = append(us, *u)
		// 일반 사용자는 자신이 할당 된 ns 만 공유해 줄 수 있음.
		err1 := tx.Eager().Where("user_id = ?", u.ID).All(&uns)
		if err1 != nil {
			return errors.WithStack(err1)
		}
		c.Set("ns_list", uns)
		c.Set("user_list", us)

	}
	spew.Dump("==================")
	spew.Dump(uns)
	spew.Dump("==================")
	return c.Render(http.StatusOK, r.HTML("namespace/namespace.share.html"))
}

// SetAssignNamespace
//

func (a actions) SetAssignNamespace(c buffalo.Context) error {
	obj := &webtool.UserNamespaceReq{}

	err := c.Bind(obj)

	if err != nil {
		return errors.WithStack(err)
	}

	tx := c.Value("tx").(*pop.Connection)

	herr := handler.RegUserNamespace(obj, tx)
	if herr != nil {
		return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{
			"error":  "Create User namespace error",
			"status": 500,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "success",
		"status":  200,
	}))

}

// SetDeAssignNamespace
//

func (a actions) SetDeAssignNamespace(c buffalo.Context) error {
	obj := &webtool.UserNamespaceReq{}

	err := c.Bind(obj)

	if err != nil {
		return errors.WithStack(err)
	}

	tx := c.Value("tx").(*pop.Connection)

	herr := handler.DelUserNamespace(obj, tx)
	if herr != nil {
		return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{
			"error":  "Delete User namespace error",
			"status": 500,
		}))
	}

	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message": "delete success",
		"status":  200,
	}))

}

// GetSharedNamespace
//

func (a actions) GetSharedNamespace(c buffalo.Context) error {
	tx := c.Value("tx").(*pop.Connection)

	// Selected USER ID
	request_param := c.Param("UID")
	var uid uuid.UUID
	if request_param == "" {
		uid = c.Session().Get("current_user_id").(uuid.UUID)
	} else {
		uid = uuid.Must(uuid.FromString(request_param))
	}

	uns := models.UserNamespaces{}
	err := tx.Eager().Where("user_id = ?", uid).All(&uns)
	if err != nil {
		return errors.WithStack(err)
	}

	return c.Render(http.StatusOK, r.JSON(uns))

}

// Namespace 생성
//

func (a actions) NamespaceReg(c buffalo.Context) error {
	//form 에서 그냥 네임 값 가져 올때
	//ts := c.Request().FormValue("input name")
	log.Println("NamespaceCreate@@@@@@@@@@@= ")
	log.Println("param= ", c.Param("name"))
	log.Println("params= ", c.Params())
	ns := &models.Namespace{}
	err := c.Bind(ns)
	if err != nil {
		log.Println(ns)
		log.Println("err ", err)
		return errors.WithStack(err)
	}
	log.Println("Namespace Bind@@@@@@@@@@@= ")

	// 0. check dupe ns name
	// dupe_err := CheckDupeNamespaceName(c, ns.NsName)

	// if dupe_err != nil {
	// 	return dupe_err
	// }

	// 1.중복체크
	// tb에서 모든 namespace를 조회한다.
	tbNamespaceList, nsStatus := handler.GetNameSpaceList()
	if nsStatus.StatusCode == 500 {
		return c.Render(http.StatusMovedPermanently, r.JSON(map[string]interface{}{
			"error":  nsStatus.Message,
			"status": nsStatus.StatusCode,
		}))
	}
	log.Println("tbNamespaceList@@@@@@@@@@@= ")
	for _, tbns := range tbNamespaceList {
		if tbns.ID == ns.ID {
			return c.Render(http.StatusMovedPermanently, r.JSON(map[string]interface{}{
				"error":  "namespace exists",
				"status": 500,
			}))
		}
	}

	c.Set("ns", ns) // bind 이후로 이전 by yhnoh.

	tx := c.Value("tx").(*pop.Connection)

	//현재 사용자 값 가져 오기
	u := c.Value("current_user").(*models.MCUser)
	if u.ID == uuid.Nil {
		c.Flash().Add("warning", "Cannot Find User")

		//return c.Redirect(301, "/")
		return RedirectTool(c, "homeFormPath")
	}

	ns.User = u
	ns.UserID = u.ID
	ns.ID = StringWithCharset()
	//namespace create
	verrs, err := ns.ValidateCreate(tx)
	if err != nil {
		return errors.WithStack(err)
	}
	if verrs.HasAny() {
		spew.Dump("validate error", verrs)
		c.Set("errors", verrs)
		// return c.Render(301, r.HTML("namespace/create.html"))
	}

	// 이쪽을 따로 때어서 권한 관리와 같이 엮어서 처리
	// user_namespace create
	un := &models.UserNamespace{}

	//if ns.ID == "" {// ns의 ID는 stringWithCharset로 생성하므로 의미없음 by yhnoh
	if ns.NsName == "" {
		c.Flash().Add("warning", "cannot find namespace")
		//return c.Redirect(301, "/")// ajax로 넘어오므로 redirect는 의미 없음 by yhnoh
		return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
			"error":  "cannot find namespace",
			"status": "301",
		}))
	}

	un.NamespaceID = ns.ID
	un.UserID = u.ID
	un.Namespace = ns
	un.User = u

	verr, err := un.ValidateCreate(tx)

	if verr.HasAny() {
		spew.Dump("user_namespace", *verr)
		//return c.Redirect(200, "/namespace/list/")// ajax로 넘어오므로 redirect는 의미 없음 by yhnoh
		return c.Render(http.StatusMovedPermanently, r.JSON(map[string]interface{}{
			"error":  verr.Error,
			"status": "301",
		}))
	}
	if err != nil {
		spew.Dump("user_namespace", un)
		//return errors.WithStack(err)
		return c.Render(http.StatusMovedPermanently, r.JSON(map[string]interface{}{
			"error":  err.Error,
			"status": "301",
		}))
	}
	//return c.Render(http.StatusOK, r.HTML("namespace/update.html"))
	//spew.Dump("namespace create before redirect")

	//return c.Redirect(301, "/namespace/list")

	// 2. TB에 namespace 생성
	nameSpaceInfo := &tbcommon.TbNsInfo{}
	//nameSpaceInfo.ID = ns.ID
	nameSpaceInfo.Name = ns.ID
	tbNamespace, nsStatus := handler.RegNameSpace(nameSpaceInfo)
	if nsStatus.StatusCode == 500 {
		return c.Render(http.StatusMovedPermanently, r.JSON(map[string]interface{}{
			"error":  nsStatus.Message,
			"status": nsStatus.StatusCode,
		}))
	}
	log.Println("tbNamespace!!!!!!!!!!!!!!!!!!!= ", tbNamespace)

	// 3. 해당 user의 namespace 목록 조회
	userNamespaceList, nsStatus := handler.UserNameSpaceListFromDB(u.ID, tx)
	if nsStatus.StatusCode != 200 && nsStatus.StatusCode != 201 {
		log.Println("UserNameSpaceListFromDB !!!!= ", nsStatus)
		return c.Render(http.StatusMovedPermanently, r.JSON(map[string]interface{}{
			"error":  nsStatus.Message,
			"status": "301",
		}))
	}
	log.Println("return nsList !!!!!!!!!!!!!!!!!!!= ", userNamespaceList)
	return c.Render(http.StatusOK, r.JSON(userNamespaceList))
}

// stringWithCharset return of random string
// 라우팅 X
func StringWithCharset() string {
	var seededRand *rand.Rand = rand.New(rand.NewSource(time.Now().UnixNano()))

	b := make([]byte, 8)
	f := make([]byte, 2)

	for i := range b {
		b[i] = NSCHARSET[seededRand.Intn(len(NSCHARSET))]
	}
	for i := range f {
		f[i] = FCHARSET[seededRand.Intn(len(FCHARSET))]
	}
	fb := string(f) + string(b)
	return fb
}

// 라우팅 X
func NamespaceCreateDefault(c buffalo.Context, default_ns string, user *models.MCUser) error {
	//form 에서 그냥 네임 값 가져 올때
	//ts := c.Request().FormValue("input name")
	log.Println("NamespaceCreateDefault@@@@@@@@@@@= ")
	ns := &models.Namespace{}
	ns.ID = StringWithCharset()
	log.Println("**************** namespace ID : ", ns.ID)
	// 1.중복체크
	// tb에서 모든 namespace를 조회한다.
	tbNamespaceList, nsStatus := handler.GetNameSpaceList()
	if nsStatus.StatusCode == 500 {
		return c.Render(http.StatusMovedPermanently, r.JSON(map[string]interface{}{
			"error":  nsStatus.Message,
			"status": nsStatus.StatusCode,
		}))
	}
	log.Println("tbNamespaceList@@@@@@@@@@@= ")
	for _, tbns := range tbNamespaceList {
		if tbns.ID == ns.ID {
			return c.Render(http.StatusMovedPermanently, r.JSON(map[string]interface{}{
				"error":  "namespace exists",
				"status": 500,
			}))
		}
	}

	c.Set("ns", ns) // bind 이후로 이전 by yhnoh.

	tx := c.Value("tx").(*pop.Connection)

	//사용자 Default namespace 에 위에서 생성한 ID값 집어 넣기
	//user.DefaultNamespace = ns.ID
	log.Println("defaultNamespace@@@@@@@@@@@= ")
	// 사용자 생성
	vuerr, uerr := user.ValidateCreate(tx)
	if uerr != nil {
		spew.Dump("====1 어디서 에러 났나 보자 1====")
		spew.Dump(uerr)
		spew.Dump("====1 어디서 에러 났나 보자 1====")
		return errors.WithStack(uerr)
	}

	if vuerr.HasAny() {
		spew.Dump("====2어디서 에러 났나 보자 2====")
		spew.Dump(vuerr)
		spew.Dump("====2어디서 에러 났나 보자 2====")
		c.Set("user", user)
		c.Set("errors", vuerr)
		return c.Render(301, r.HTML("users/new.html"))
	}
	// default namespace 생성
	// ns.NsName = default_ns

	// ns.Description = "This is default namespace"
	// log.Println("CreateDefault NS @@@@@@@@@@@= ")
	// log.Println(ns.NsName)

	// ns.User = user
	// ns.UserID = user.ID

	// //check dupe ns name
	// // 이름 중복 허용
	// // dupe_err := CheckDupeNamespaceName(c, ns.NsName)

	// // if dupe_err != nil {
	// // 	return dupe_err
	// // }

	// //namespace create
	// verrs, err := ns.ValidateCreate(tx)
	// if err != nil {
	// 	return errors.WithStack(err)
	// }
	// if verrs.HasAny() {
	// 	spew.Dump("validate error", verrs)
	// 	c.Set("errors", verrs)
	// 	// return c.Render(301, r.HTML("namespace/create.html"))
	// }

	// 이쪽을 따로 때어서 권한 관리와 같이 엮어서 처리
	// user_namespace create
	// un := &models.UserNamespace{}

	// //if ns.ID == "" {// ns의 ID는 stringWithCharset로 생성하므로 의미없음 by yhnoh
	// if ns.NsName == "" {
	// 	c.Flash().Add("warning", "cannot find namespace")
	// 	//return c.Redirect(301, "/")// ajax로 넘어오므로 redirect는 의미 없음 by yhnoh
	// 	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
	// 		"error":  "cannot find namespace",
	// 		"status": "301",
	// 	}))
	// }

	// un.NamespaceID = ns.ID
	// un.UserID = user.ID
	// un.Namespace = ns
	// un.User = user

	// verr, err := un.ValidateCreate(tx)

	// if verr.HasAny() {
	// 	spew.Dump("user_namespace", *verr)
	// 	//return c.Redirect(200, "/namespace/list/")// ajax로 넘어오므로 redirect는 의미 없음 by yhnoh
	// 	return c.Render(http.StatusMovedPermanently, r.JSON(map[string]interface{}{
	// 		"error":  verr.Error,
	// 		"status": "301",
	// 	}))
	// }
	// if err != nil {
	// 	spew.Dump("user_namespace", un)
	// 	//return errors.WithStack(err)
	// 	return c.Render(http.StatusMovedPermanently, r.JSON(map[string]interface{}{
	// 		"error":  err.Error,
	// 		"status": "301",
	// 	}))
	// }
	//return c.Render(http.StatusOK, r.HTML("namespace/update.html"))
	//spew.Dump("namespace create before redirect")

	//return c.Redirect(301, "/namespace/list")

	// 2. TB에 namespace 생성
	//TB 에서 우리가 생성한 ID값으로 namespace 를 생성하려면
	// namespaceInfo.Name 에  ID 값을 넣어주어야 함.
	// nameSpaceInfo := &tbcommon.TbNsInfo{}
	// //nameSpaceInfo.ID = ns.ID
	// //여기에 우리가 생성한 ID값을 넣어주어야 생성이 됨

	// nameSpaceInfo.Name = ns.ID
	// nameSpaceInfo.Description = ns.Description

	// tbNamespace, nsStatus := handler.RegNameSpace(nameSpaceInfo)
	// if nsStatus.StatusCode == 500 {
	// 	return c.Render(http.StatusMovedPermanently, r.JSON(map[string]interface{}{
	// 		"error":  nsStatus.Message,
	// 		"status": nsStatus.StatusCode,
	// 	}))
	// }
	// log.Println("tbNamespace!!!!!!!!!!!!!!!!!!!= ", tbNamespace)

	// // 3. 해당 user의 namespace 목록 조회
	// userNamespaceList, nsStatus := handler.UserNameSpaceListFromDB(user.ID, tx)
	// if nsStatus.StatusCode != 200 && nsStatus.StatusCode != 201 {
	// 	log.Println("UserNameSpaceListFromDB !!!!= ", nsStatus)
	// 	return c.Render(http.StatusMovedPermanently, r.JSON(map[string]interface{}{
	// 		"error":  nsStatus.Message,
	// 		"status": "301",
	// 	}))
	// }
	// log.Println("return nsList !!!!!!!!!!!!!!!!!!!= ", userNamespaceList)
	// return c.Render(http.StatusOK, r.JSON(userNamespaceList))
	return nil
}

// namespace Name dupe check
func (a actions) CheckDupeNamespaceName(c buffalo.Context, ns_name string) error {
	tx := c.Value("tx").(*pop.Connection)
	ns := &models.Namespace{}
	ns.NsName = ns_name
	q := tx.Where("ns_name = ?", ns.NsName)

	b, err := q.Exists(ns)

	if b {
		return c.Render(http.StatusMovedPermanently, r.JSON(map[string]interface{}{
			"error":  "already Exist!!",
			"status": "301",
		}))
	}

	if err != nil {
		return errors.WithStack(err)
	}

	return nil
}

// TestUpdateNamespace
//

func (a actions) estUpdateNamespace(c buffalo.Context) error {
	ns := &models.Namespace{}
	description := "test update Namespace"
	nsName := "update-ns-name"
	// check_err := CheckDupeNamespaceName(c, nsName)
	// if check_err != nil {
	// 	spew.Dump("---------error--------")
	// 	spew.Dump(check_err)
	// 	spew.Dump("---------error--------")
	// 	return check_err
	// }
	//err := c.Bind(ns)
	ns_id := "u9cznc87dp"
	tx := c.Value("tx").(*pop.Connection)
	//ferr := tx.Find(ns, ns_id)
	ferr := tx.Eager().Where("id = ?", ns_id).First(ns)
	if ferr != nil {
		spew.Dump(ferr)
	}
	ns.NsName = nsName
	ns.Description = description
	spew.Dump("==============")
	spew.Dump(ns)
	//err := models.DB.Update(ns, "user_id")
	verr, err := ns.ValidateUpdate(tx)
	if verr.HasAny() {
		spew.Dump("==============")
		spew.Dump("=======true=====")
		spew.Dump("==============")
		spew.Dump(verr.String())

	}

	if err != nil {
		spew.Dump(err)
	}
	//err := q.All(u)

	return nil

}

func (a actions) GetSharedNamespaceList(uid uuid.UUID, tx *pop.Connection) *models.UserNamespaces {
	uns := &models.UserNamespaces{}
	err := tx.Eager().Where("user_id = ?", uid).All(uns)
	if err != nil {
		errors.WithStack(err)
	}
	return uns
}
