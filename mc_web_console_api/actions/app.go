package actions

import (
	"os"
	"sync"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/buffalo-pop/v3/pop/popmw"
	"github.com/gobuffalo/envy"
	contenttype "github.com/gobuffalo/mw-contenttype"
	forcessl "github.com/gobuffalo/mw-forcessl"
	"github.com/gobuffalo/x/sessions"
	"github.com/unrolled/secure"

	// gwa "github.com/gobuffalo/gocraft-work-adapter"

	i18n "github.com/gobuffalo/mw-i18n/v2"
	paramlogger "github.com/gobuffalo/mw-paramlogger"

	// "github.com/gomodule/redigo/redis"

	"mc_web_console_api/locales"
	"mc_web_console_api/models"

	_ "mc_web_console_api/docs" //mcone의 경우
)

// ENV is used to help switch settings based on where the
// application is being run. Default is "development".
var ENV = envy.Get("GO_ENV", "development")

var (
	app     *buffalo.App
	appOnce sync.Once
	T       *i18n.Translator
)

func App() *buffalo.App {
	appOnce.Do(func() {
		app = buffalo.New(buffalo.Options{
			Env:          ENV,
			SessionStore: sessions.Null{},
			PreWares:     []buffalo.PreWare{
				// cors.Default().Handler,
			},
			SessionName: "mc_web_console",
			Addr:        os.Getenv("API_ADDR") + ":" + os.Getenv("API_PORT"),
		})

		app.Use(forceSSL())
		app.Use(paramlogger.ParameterLogger)
		app.Use(contenttype.Set("application/json"))
		app.Use(popmw.Transaction(models.DB))
		// RoutesManager(app)

		// middleware START //
		// app.Use(AuthMiddleware)
		// middleware END //

		// controller func naming Rule
		// 데이터 처리 관점으로
		// 단건, 맵도 한개 :  XXXData
		// 목록 : XXXList
		// 등록(Reg), 생성(Create), 수정(Edit), 삭제(Del), 해제(Rel) : XXXProc
		apiPath := "/api"
		api := app.Group(apiPath)
		api.GET("/{targetController}", GetRouteController)
		api.POST("/{targetController}", PostRouteController)

		// API TEST
		setting := app.Group(apiPath + "/setting")
		namespaces := setting.Group("/namespaces")
		namespace := namespaces.Group("/namespace")
		namespace.GET("/list", NamespaceAllList)
		namespace.POST("/reg/proc", NamespaceReg)

		lu := app.Group(apiPath + "/lu")
		lu.POST("/setting/resources/machineimage/lookupimage", LookupVirtualMachineImageData)

		// List all configs
		config := app.Group(apiPath + "/config")
		config.GET("/", TbConfig)

		// Get config
		// configByid := app.Group(apiPath + "/config")
		// configByid.GET("/", TBconfigbyId)

		// loadcommonresource
		loadcommonresource := app.Group(apiPath + "loadcommonresource")
		loadcommonresource.GET("/", LoadCommonResource)

		// [Admin] Multi-Cloud Environment Configuration
		health := app.Group(apiPath + "/health")
		health.GET("/", GetTBHealth)

		// GET CSP Resources Overview
		resources := setting.Group("/resources")
		resources.GET("/inspectresourcesoverview", GetInspectResourcesOverview)

		// Get value of an object
		object := app.Group(apiPath + "/object")
		object.GET("/", GetObjectThroughTB)

		// List all objects for a given key
		objects := app.Group(apiPath + "/objects")
		objects.GET("/", GetObjectListThroughTB)

		// [Infra service] MCIS Provisioning management
		operation := app.Group(apiPath + "/operation")
		manages := operation.Group("/manages")
		mcismng := manages.Group("/mcismng")

		// List all MCISs or MCISs' ID
		mcismng.GET("/list", McisList)
		// Get MCIS, Action to MCIS (status, suspend, resume, reboot, terminate, refine), or Get VMs' ID
		//mcismng.GET("/", McisGet)

		ns := app.Group(apiPath + "/ns")
		nsid := ns.Group("/{nsid}")
		mciss := nsid.Group("/mcis")
		mcisid := mciss.Group("/{mcisid}")
		mcisid.GET("/", McisGet)

		// List SubGroup IDs in a specified MCIS
		mcismng.GET("/{mcisid}"+"/subgroup", McisSubGroupList)

		mcis := app.Group(apiPath + "/mcis")
		mcis.GET("/mcislist", McisList)

		// for the test
		cluster := app.Group(apiPath + "/cluster")
		cluster.GET("/ns/{nsId}/cluster", ClusterList)
		cluster.POST("/ns/{nsId}/cluster", ClusterReg)
		cluster.DELETE("/ns/{nsId}/cluster/{clusterId}", DelCluster)
		cluster.GET("/ns/{nsId}/cluster/{clusterId}", ClusterList)
		cluster.POST("/ns/{nsId}/cluster/{clusterId}/nodegroup", RegNodeGroup)
		//////////////////////////////////////////////////////////////////////
		// TOBE PATH

		// ns

		// ns/{nsid}

		// benchmark

		// cluster

		// cmd

		// control

		// mcis

		// mcis/{mcisid}/nlb

		// mcis/{mcisid}/subgroup

		// mcis/{mcisid}/vm

		// monitoring

		// network

		// policy/mcis

		// resources/customImage

		// resources/dataDisk

		// resources/

		// resources/image

		// resources/securityGroup

		// resources/spec

		// resources/sshKey

		// resources/vNET

		// object

		// objects

		//
		// MC-IAM-MANAGER REQUIRERD

		// DEBUG START //api/debug/tumblebug
		if ENV == "development" {
			debug := app.Group(apiPath + "/debug")
			debug.ANY("/{targetfw}/{path:.+}", DebugApiCaller)
		}
		//  DEBUG END  //

	})

	return app
}

// middleware moved to middleware.go
// translations, forceSSL는 buffalo 에서 정의한 커스텀 미들웨어이므로 이동시키지 않음.

// translations will load locale files, set up the translator `actions.T`,
// and will return a middleware to use to load the correct locale for each
// request.
// for more information: https://gobuffalo.io/en/docs/localization
func translations() buffalo.MiddlewareFunc {
	var err error
	if T, err = i18n.New(locales.FS(), "en-US"); err != nil {
		app.Stop(err)
	}
	return T.Middleware()
}

// forceSSL will return a middleware that will redirect an incoming request
// if it is not HTTPS. "http://example.com" => "https://example.com".
// This middleware does **not** enable SSL. for your application. To do that
// we recommend using a proxy: https://gobuffalo.io/en/docs/proxy
// for more information: https://github.com/unrolled/secure/
func forceSSL() buffalo.MiddlewareFunc {
	return forcessl.Middleware(secure.Options{
		SSLRedirect:     ENV == "production",
		SSLProxyHeaders: map[string]string{"X-Forwarded-Proto": "https"},
	})
}

// // Redirect에 route 정보 전달
// func RedirectTool(c buffalo.Context, p string) error {
// 	routes := app.Routes()
// 	for _, route := range routes {
// 		if route.PathName == p {
// 			return c.Redirect(http.StatusFound, route.Path)
// 		}
// 	}
// 	return c.Redirect(http.StatusFound, "/")
// }

// func alive(c buffalo.Context) error {
// 	return c.Render(200, r.JSON(map[string]interface{}{
// 		"status": "OK",
// 		"method": c.Request().Method,
// 	}))
// }
