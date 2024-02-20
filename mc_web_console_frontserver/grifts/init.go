package grifts

import (
	"buffalo_sequential_workflow/actions"

	"github.com/gobuffalo/buffalo"
)

func init() {
	buffalo.Grifts(actions.App())
}
