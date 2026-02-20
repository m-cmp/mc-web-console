package templates

import (
	"embed"
	"io/fs"
)

//go:embed *.html
//go:embed */*/*.html
//go:embed */*/*/*.html
//go:embed */*/*/*/*.html
var files embed.FS

func FS() fs.FS {
	return files
}
