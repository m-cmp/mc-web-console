package templates

import (
	"embed"
	"io/fs"

	"github.com/gobuffalo/buffalo"
)

var files embed.FS

func FS() fs.FS {
	return buffalo.NewFS(files, "templates")
}
