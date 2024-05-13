package actions

import (
	"mc_web_console_front/public"
	"mc_web_console_front/templates"

	"github.com/gobuffalo/buffalo/render"
)

var webconsoleRender *render.Engine // 기본 User 를 위한 Render
var defaultRender *render.Engine    // json 또는 Unauthorized User를 위한 Render

func init() {
	webconsoleRender = render.New(render.Options{
		// HTML layout to be used for all HTML requests:
		HTMLLayout: "application.plush.html",

		// fs.FS containing templates
		TemplatesFS: templates.FS(),

		// fs.FS containing assets
		AssetsFS: public.FS(),

		// Add template helpers here:
		Helpers: render.Helpers{
			// for non-bootstrap form helpers uncomment the lines
			// below and import "github.com/gobuffalo/helpers/forms"
			// forms.FormKey:     forms.Form,
			// forms.FormForKey:  forms.FormFor,
		},
	})

	defaultRender = render.New(render.Options{
		// HTML layout to be used for all HTML requests:
		HTMLLayout: "application.index.plush.html",

		// fs.FS containing templates
		TemplatesFS: templates.FS(),

		// fs.FS containing assets
		AssetsFS: public.FS(),

		// Add template helpers here:
		Helpers: render.Helpers{
			// for non-bootstrap form helpers uncomment the lines
			// below and import "github.com/gobuffalo/helpers/forms"
			// forms.FormKey:     forms.Form,
			// forms.FormForKey:  forms.FormFor,
		},
	})
}
