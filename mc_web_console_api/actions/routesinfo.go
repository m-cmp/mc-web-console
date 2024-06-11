package actions

import (
	"errors"
	"log"
	"net/http"
	"reflect"
	"strings"

	demo "mc_web_console_api/actions/demo"
	tumblebug "mc_web_console_api/actions/tumblebug"
	webconsole "mc_web_console_api/fwmodels/webconsole"
	"mc_web_console_api/models"

	"github.com/gobuffalo/buffalo"
)

// handler 전달을 위한 구조체
// router에 등록할 function 은 ( a action )을 붙여야 함.
// type actions struct{ buffalo.Context }
type actions struct{}

//mciamUse, _ := strconv.ParseBool(os.Getenv("MCIAM_USE"))

// ------------------------//
// Client에서 전송되는 data type은 POST 임 //
// case문에서 controller이름 추출하여 controller 호출
func PostRouteController(c buffalo.Context) error {
	log.Println("#### PostRouteController ")
	commonRequest := &webconsole.CommonRequest{}
	c.Bind(commonRequest)
	targetController := strings.ToLower(c.Param("targetController"))
	log.Printf("== targetController\t:[ %s ]\n", targetController)
	log.Printf("== commonRequest\t:\n%+v\n\n", commonRequest)

	commonResponse := &webconsole.CommonResponse{}
	switch targetController {
	case "getmcislist":
		commonResponse = tumblebug.GetMCISList(c, commonRequest)
	case "getmcis":
		commonResponse = tumblebug.GetMCIS(c, commonRequest)
	case "delmcis":
		commonResponse = tumblebug.DelMCIS(c, commonRequest)
	case "createmcis":
		commonResponse = tumblebug.CreateMCIS(c, commonRequest)
	case "createdynamicmcis":
		commonResponse = tumblebug.CreateDynamicMCIS(c, commonRequest)
	case "getloaddefaultresource":
		commonResponse = tumblebug.GetLoadDefaultResouce(c, commonRequest)
	case "deldefaultresources":
		commonResponse = tumblebug.DelDefaultResouce(c, commonRequest)
	case "mcisrecommendvm":
		commonResponse = tumblebug.MCISRecommendVm(c, commonRequest)
	case "mcisdynamiccheckrequest":
		commonResponse = tumblebug.MCISDynamicCheckRequest(c, commonRequest)
	case "sendcommandtomcis":
		commonResponse = tumblebug.SendCommandtoMCIS(c, commonRequest)
	case "controllifecycle":
		commonResponse = tumblebug.ControlLifecycle(c, commonRequest)
	case "getimageid":
		commonResponse = tumblebug.GetImageId(c, commonRequest)

	case "authlogin":
		commonResponse = AuthLogin(c, commonRequest)
	case "authlogout":
		commonResponse = AuthLogout(c, commonRequest)
	case "authgetuserinfo":
		commonResponse = AuthGetUserInfo(c, commonRequest)
	case "authgetuservalidate":
		commonResponse = AuthGetUserValidate(c, commonRequest)

	case "getworkspacebyuserid":
		commonResponse = GetWorkspaceByUserId(c, commonRequest)

	case "demogetuserinfo":
		commonResponse = demo.DemoGetuserinfo(c, commonRequest)
	case "demogetusercred":
		commonResponse = demo.DemoGetuserCred(c, commonRequest)

	default:
		commonResponse = webconsole.CommonResponseStatusNotFound("NO MATCH targetController")
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

// Get으로 전송되는 data 처리를 위하여
func GetRouteController(c buffalo.Context) error {
	// param 종류( pathParam, queryParam)
	// target controller 이름.

	log.Println("in RouteGetController")
	log.Println("User Role is : ", c.Data()["roles"])

	// path param추출
	path := c.Request().URL.Path
	parts := strings.Split(path, "/")

	var part1, part2 string
	if len(parts) > 1 {
		part1 = parts[1]
	}
	if len(parts) > 2 {
		part2 = parts[2]
	}
	// if len(parts) > 3 {
	//     part3 = parts[3]
	// }

	if part1 != "api" {
		return errors.New("Unauthorized access")
	}

	switch part2 {
	case "alive":
		return c.Render(200, r.JSON(map[string]interface{}{
			"status": "OK",
			"method": c.Request().Method,
		}))
	default:
		return errors.New("not allowed api call")
	}

	// query param 추출
	// switch commonRequest.TargetController {
	// case "McisList":// Get Type
	// 	//
	// 	mcisList, respStatus := tumblebug.TbMcisList(commonRequest)
	// 	commonResponse.ResponseData = mcisList
	// 	commonResponse.Status = respStatus
	// case "McisReg":// Post Type
	// 	// namespaceID := c.Params().Get("namespaceid")
	// 	// optionParam := c.Params().Get("option")
	// 	// filterKeyParam := c.Params().Get("filterKey")
	// 	// filterValParam := c.Params().Get("filterVal")

	// 	// responseData, err := McisReg(dataObj, pathParam, queryParam)

	// //defaut :
	// 	// TODO : a action를 찾아 실행하도록
	// }

	// if commonResponse.Status.StatusCode != 200 && commonResponse.Status.StatusCode != 201 {
	// 	return c.Render(commonResponse.Status.StatusCode, r.JSON(map[string]interface{}{
	// 		"responseData":  commonResponse.ResponseData,
	// 		"status": commonResponse.Status,
	// 	}))
	// }

	// return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
	// 	"responseData":  commonResponse.ResponseData,
	// 	"status": commonResponse.Status,
	// }))

	return c.Render(200, r.JSON(map[string]interface{}{
		"status": "OK",
		"method": c.Request().Method,
	}))
}

// 관리자 설정
func RoutesManager(app *buffalo.App) *buffalo.App {

	// TODO : DB에서 path와 handler를 가져오도록
	// 1. handler 구현한 뒤에 화면을 통해 db에 등록하는 process를 가져가도록
	// 2. 화면이 있으면 xxxform, json의 경우에는 /api/xxx 로 경로명 지정
	// ex ) "/api/<카테고리대분류>/<리소스>/<정의>" / "/<카테고리대분류>/<리소스>/mngform/"

	// ID           uuid.UUID `json:"id" db:"id"`
	// Method       string    `json:"method" db:"method"`
	// Path         string    `json:"path" db:"path"`
	// HandlerName  string    `json:"handler_name" db:"handler_name"`
	// ResourceName string    `json:"resource_name" db:"resource_name"`
	// PathName     string    `json:"path_name" db:"path_name"`
	// Aliases      string    `json:"aliases" db:"aliases"`
	// CreatedAt    time.Time `json:"created_at" db:"created_at"`
	// UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`

	// routerList := []models.RouteInfo{
	// 	{Path: "/home1", HandlerName: "GetHome", Method: "GET"},
	// 	{Path: "/about1", HandlerName: "AboutHandler", Method: "GET"},
	// 	{Path: "/settings/resources/vpc/mngform", HandlerName: "VpcMngForm", Method: "GET"},

	// 	{Path: "/settings/resources/vpc/", HandlerName: "vpcList", Method: "GET"},
	// 	{Path: "/settings/resources/vpc/", HandlerName: "vpcReg", Method: "POST"},
	// 	{Path: "/settings/resources/vpc/id/{vNetId}", HandlerName: "vpcGet", Method: "GET"},
	// 	{Path: "/settings/resources/vpc/id/{vNetId}", HandlerName: "vpcDel", Method: "DELETE"},
	// 	{Path: "/settings/resources/vpc/region", HandlerName: "vpcListByRegion", Method: "DELETE"},
	// }

	routerList := models.RouteInfoes{}

	//err := models.DB.Find(&resultCredential, credential.ID)
	//if err != nil {
	//	return resultCredential, errors.WithStack(err)
	//}

	query := models.DB.Q()
	err := query.All(&routerList)
	if err != nil {
		log.Println("query err ", err)
		return app
	}

	for _, router := range routerList {
		//log.Println(router)
		// handlerFunction은 (a actions) function명 으로 정의 해야 함.
		handlerFunc := getHandlerFuncByName(router.HandlerName)
		if handlerFunc == nil {
			log.Println(router.HandlerName + " Handler not found")
			log.Println(router)
			continue
		}
		//log.Println(router)
		log.Println(router.Path + "   :   " + router.PathName + " : " + router.Method)
		//log.Println(handlerFunc)
		// 라우터 등록

		switch router.Method {
		case "GET":
			app.GET(router.Path, handlerFunc).Name(router.PathName)
		case "POST":
			app.POST(router.Path, handlerFunc).Name(router.PathName)
		case "PUT":
			app.PUT(router.Path, handlerFunc).Name(router.PathName)
		case "PATCH":
			app.PATCH(router.Path, handlerFunc).Name(router.PathName)
		case "HEAD":
			app.HEAD(router.Path, handlerFunc).Name(router.PathName)
		case "OPTIONS":
			app.OPTIONS(router.Path, handlerFunc).Name(router.PathName)
		case "DELETE":
			app.DELETE(router.Path, handlerFunc).Name(router.PathName)
		default:
			log.Println(" any begin~~~~~~~~~~~~~~~~~~~~~~~")
			log.Println(router)
			log.Println(" any end ~~~~~~~~~~~~~~~~~~~~~~~")
			app.ANY(router.Path, handlerFunc)
		}

	}

	return app
}

// Get the handler function by its name
func getHandlerFuncByName(handlerName string) buffalo.Handler {
	actions := &actions{}
	actionsType := reflect.TypeOf(actions)

	// 핸들러 함수 이름으로 메서드 가져오기
	method, ok := actionsType.MethodByName(handlerName)
	if !ok {
		// 핸들러 함수를 찾을 수 없는 경우에 대한 처리
		// 예: log.Fatal("Handler not found")
		return nil
	}

	// 핸들러 함수를 호출할 수 있는 함수 생성
	handlerFunc := func(c buffalo.Context) error {
		// 새로운 인스턴스 생성
		act := reflect.New(actionsType.Elem()).Interface()

		// 핸들러 함수 호출
		//return method.Func.Call([]reflect.Value{
		//	reflect.ValueOf(act),
		//	reflect.ValueOf(c),
		//})[0].Interface().(error)
		// 핸들러 함수 호출
		result := method.Func.Call([]reflect.Value{
			reflect.ValueOf(act),
			reflect.ValueOf(c),
		})

		log.Println("handlerFunc result ", result)
		if errVal := result[0]; !errVal.IsNil() {
			// Convert the error value to the error type
			err := errVal.Interface().(error)
			return err
		}
		return nil
	}

	//return handlerFunc
	return buffalo.Handler(handlerFunc)

	// // Get the method by name from the actions package
	// handlerMethod, found := reflect.TypeOf(actions{}).MethodByName(handlerName)
	// if !found {
	// 	log.Println("getHandlerFuncByName !found ", handlerName)
	// 	return nil
	// }

	// // Create a closure to execute the handler function
	// handlerFunc := func(c buffalo.Context) error {
	// 	// Instantiate the actions struct
	// 	act := actions{c}
	// 	// Call the handler method with the actions struct and context
	// 	return handlerMethod.Func.Call([]reflect.Value{reflect.ValueOf(act), reflect.ValueOf(c)})[0].Interface().(error)
	// }

	// return handlerFunc

	// handlerMethod := reflect.ValueOf(&actions{}).MethodByName(handlerName)
	// if !handlerMethod.IsValid() {
	// 	// Handler not found, handle the error
	// }

	// // Create and return the actual handler function
	// return func(c buffalo.Context) error {
	// 	// Instantiate the actions struct
	// 	act := &actions{}
	// 	// Invoke the handler function
	// 	return handlerMethod.Call([]reflect.Value{reflect.ValueOf(act), reflect.ValueOf(c)})[0].Interface().(error)
	// }

	//////////////
	// actionsType := reflect.TypeOf(actions{})
	// handlerMethod, ok := actionsType.MethodByName(handlerName)
	// if !ok {
	// 	log.Println("actionsType.MethodByName ", ok)
	// 	// Handler not found, handle the error
	// }

	// // Create and return the actual handler function
	// return func(c buffalo.Context) error {
	// 	// Instantiate the actions struct
	// 	act := reflect.New(actionsType).Interface()
	// 	log.Println("getHandlerFuncByName reflect.New ", act)
	// 	//log.Println("reflect.Value{reflect.ValueOf(act), reflect.ValueOf(c)}", reflect.Value{reflect.ValueOf(act), reflect.ValueOf(c)})
	// 	// Invoke the handler function
	// 	return handlerMethod.Func.Call([]reflect.Value{reflect.ValueOf(act), reflect.ValueOf(c)})[0].Interface().(error)
	// }
}

// 삭제 예정
func GetHome(c buffalo.Context) error {
	log.Println("action GetHome")
	//return GetHome(c)
	return c.Render(200, r.String("Hello from GetHome"))
}

//func GetHome(c buffalo.Context) error {
//	log.Println("render GetHome")
//	return c.Render(200, r.String("Hello from GetHome"))
//}

func AboutHandler(c buffalo.Context) error {
	//return c.Render(200, r.String("Hello from AboutHandler"))
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"message":  "success",
		"status":   200,
		"VNetInfo": "aaa",
	}))
}
