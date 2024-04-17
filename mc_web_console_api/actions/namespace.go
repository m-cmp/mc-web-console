package actions

import (
	"log"
	"math/rand"
	"mc_web_console_api/fwmodels"
	"mc_web_console_api/handler"
	"mc_web_console_api/models"
	"net/http"
	"time"

	tbcommon "mc_web_console_api/fwmodels/tumblebug/common"
	"mc_web_console_api/fwmodels/webtool"

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

// Tumble에 등록된 모든 namespace 목록 조회
// db에서 사용하는 namespace model에는 사용자 정보가 들어가 있어서
// 가져온 값 그대로 return
func NamespaceAllList(c buffalo.Context) error {
	nsList, nsStatus := handler.GetNameSpaceList()
	if nsStatus.StatusCode == 500 {
		return c.Render(http.StatusOK, r.JSON(nsStatus))
	}

	return c.Render(http.StatusOK, r.JSON(nsList))
}

// 해당 user의 namespace 목록 조회

// NamespaceList
//

func NamespaceList(c buffalo.Context) error {
	//내가 생성한 NS외에 내가 share받은 NS를 가져와야 함으로
	// user_namespaces 에서 가져와야 함.
	// 아니다 내가 생성한것 만 조히하고 싶을 수도 있겠다.
	// 공유 받은 NS호출때는 GetsharedNamespace를 호출하자
	ns := &models.Namespaces{}

	if uid := c.Session().Get("current_user_id"); uid != nil {

		tx := c.Value("tx").(*pop.Connection)

		q := tx.Eager().Where("user_id = ?", uid)

		err := q.All(ns)

		if err != nil {
			return errors.WithStack(err)
		}
	}
	c.Set("ns_list", ns)
	return c.Render(http.StatusOK, r.JSON(ns))
}

// 해당 user의 namespace 목록 조회
// NamespaceGet
//

func NamespaceGet(c buffalo.Context) error {
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

func NamespaceUpdate(c buffalo.Context) error {
	return c.Render(http.StatusBadRequest, r.JSON(fwmodels.WebStatus{StatusCode: 500, Message: "not implementated yet"}))
}

// SetAssignNamespace
//

func SetAssignNamespace(c buffalo.Context) error {
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

func SetDeAssignNamespace(c buffalo.Context) error {
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

func GetSharedNamespace(c buffalo.Context) error {
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

func NamespaceReg(c buffalo.Context) error {
	//form 에서 그냥 네임 값 가져 올때
	//ts := c.Request().FormValue("input name")
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
	u := c.Value("current_user").(*models.User)
	if u.ID == uuid.Nil {
		c.Flash().Add("warning", "Cannot Find User")

		//return c.Redirect(301, "/")
		return RedirectTool(c, "homeFormPath")
	}

	ns.User = u
	ns.UserID = u.ID
	ns.ID = StringWithCharset()
	//namespace create
	verrs, err := ns.Create(tx)
	if err != nil {
		return errors.WithStack(err)
	}
	if verrs.HasAny() {
		spew.Dump("validate error", verrs)
		c.Set("errors", verrs)
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

	verr, err := un.Create(tx)

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

// namespace Name dupe check
func CheckDupeNamespaceName(c buffalo.Context, ns_name string) error {
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

func estUpdateNamespace(c buffalo.Context) error {
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

func GetSharedNamespaceList(uid uuid.UUID, tx *pop.Connection) *models.UserNamespaces {
	uns := &models.UserNamespaces{}
	err := tx.Eager().Where("user_id = ?", uid).All(uns)
	if err != nil {
		errors.WithStack(err)
	}
	return uns
}
