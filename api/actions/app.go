package actions

import (
	"os"
	"sync"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/buffalo-pop/v3/pop/popmw"
	contenttype "github.com/gobuffalo/mw-contenttype"
	"github.com/gobuffalo/x/sessions"
	"github.com/rs/cors"

	i18n "github.com/gobuffalo/mw-i18n/v2"
	paramlogger "github.com/gobuffalo/mw-paramlogger"

	"mc_web_console_api/handler/mciammanager"
	"mc_web_console_api/handler/self"
	"mc_web_console_api/models"
)

var (
	app     *buffalo.App
	appOnce sync.Once
	T       *i18n.Translator
)

func App() *buffalo.App {
	appOnce.Do(func() {
		app = buffalo.New(buffalo.Options{
			SessionStore: sessions.Null{},
			PreWares: []buffalo.PreWare{
				cors.AllowAll().Handler, // disable require, when front proxy done.
			},
			SessionName: "mc_web_console",
			Addr:        os.Getenv("API_ADDR") + ":" + os.Getenv("API_PORT"),
		})
		app.Use(paramlogger.ParameterLogger)
		app.Use(contenttype.Set("application/json"))
		app.Use(popmw.Transaction(models.DB))

		if MCIAM_USE { // MCIAM USE True
			app.Use(mciammanager.TokenValidMiddleware)
			app.Use(mciammanager.SetContextMiddleware)
			app.Middleware.Skip(mciammanager.TokenValidMiddleware, readyz)
			app.Middleware.Skip(mciammanager.SetContextMiddleware, readyz)

			app.ANY("/readyz", readyz)

			apiPath := "/api"

			auth := app.Group(apiPath + "/auth")
			auth.Middleware.Skip(mciammanager.TokenValidMiddleware, AuthMCIAMLogin, AuthMCIAMLoginRefresh)
			auth.Middleware.Skip(mciammanager.SetContextMiddleware, AuthMCIAMLogin, AuthMCIAMLoginRefresh)
			auth.POST("/login", AuthMCIAMLogin)
			auth.POST("/refresh", AuthMCIAMLoginRefresh)
			auth.POST("/validate", AuthMCIAMValidate)
			auth.POST("/logout", AuthMCIAMLogout)
			auth.POST("/userinfo", AuthMCIAMUserinfo)

			api := app.Group(apiPath)
			if MCIAM_TICKET_USE {
				api.Use(mciammanager.SelfApiMiddleware)
			}
			api.POST("/disklookup", self.DiskLookup)
			api.POST("/availabledisktypebyproviderregion", self.AvailableDiskTypeByProviderRegion)
			api.POST("/createmenuresources", CreateMCIAMMenuResources)
			api.POST("/getmenutree", GetMCIAMmenuTree)

			api.POST("/getapihosts", GetApiHosts)

			api.POST("/getworkspaceuserrolemappingbytoken", GetWorkspaceUserRoleMappingByToken)

			api.POST("/getcompanyinfo", GetCompanyInfo)
			api.POST("/getplatformroles", GetPlatformRoles)
			api.POST("/getworkspaceroles", GetWorkspaceRoles)

			api.Middleware.Skip(mciammanager.SelfApiMiddleware, AnyController)
			if MCIAM_TICKET_USE {
				// api.POST("/{operationId}", mciammanager.ApiMiddleware(AnyController))
				api.POST("/{subsystemName}/{operationId}", mciammanager.ApiMiddleware(SubsystemAnyController))
			} else {
				// api.POST("/{operationId}", AnyController)
				api.POST("/{subsystemName}/{operationId}", SubsystemAnyController)
			}

		} else { // MCIAM USE False

			app.Use(DefaultMiddleware)
			app.Middleware.Skip(DefaultMiddleware, readyz)

			app.ANY("/readyz", readyz)

			apiPath := "/api"

			auth := app.Group(apiPath + "/auth")
			auth.Middleware.Skip(DefaultMiddleware, AuthLogin)
			auth.POST("/login", AuthLogin)
			auth.POST("/refresh", AuthLoginRefresh)
			auth.POST("/validate", AuthValidate)
			auth.POST("/logout", AuthLogout)
			auth.POST("/userinfo", AuthUserinfo)

			api := app.Group(apiPath)
			api.POST("/disklookup", self.DiskLookup)
			api.POST("/availabledisktypebyproviderregion", self.AvailableDiskTypeByProviderRegion)
			api.POST("/getmenutree", GetmenuTree)
			api.POST("/getcompanyinfo", GetCompanyInfo)
			api.POST("/getplatformroles", GetPlatformRoles)
			api.POST("/getworkspaceroles", GetWorkspaceRoles)

			// Projects Manage
			api.POST("/createproject", CreateProject)
			api.POST("/getprojectlist", GetProjectList)
			api.POST("/getprojectbyid", GetProjectById)
			api.POST("/updateprojectbyid", UpdateProjectById)
			api.POST("/deleteprojectbyid", DeleteProjectById)

			// Projects and Workspace Get
			api.POST("/getwpmappinglistbyworkspaceid", GetWPmappingListByWorkspaceId)
			api.POST("/getworkspaceuserrolemappinglistbyuserid", GetWorkspaceUserRoleMappingListByUserId)

			// api.POST("/{operationId}", AnyController)
			api.POST("/{subsystemName}/{operationId}", SubsystemAnyController)
		}
	})

	return app
}

func readyz(c buffalo.Context) error {
	return c.Render(200, r.JSON(map[string]interface{}{"status": "OK", "MCIAM_USE": MCIAM_USE}))
}
