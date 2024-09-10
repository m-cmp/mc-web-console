package templates

import (
	"embed"
	"io/fs"

	"github.com/gobuffalo/buffalo"
)

//go:embed *.html
//go:embed */*/*.html
//go:embed */*/*/*.html
var files embed.FS

func FS() fs.FS {
	return buffalo.NewFS(files, "templates")
}
