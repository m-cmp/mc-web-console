package grifts

import (
	"mc_web_console_apiserver/actions"

	"github.com/gobuffalo/buffalo"
)

func init() {
	buffalo.Grifts(actions.App())
}
