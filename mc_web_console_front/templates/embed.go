package templates

import (
	"embed"
	"io/fs"

	"github.com/gobuffalo/buffalo"
)

// ???????????? TODO : 정규식 표현이 이상함...
//
//go:embed *.html
//go:embed */*.html
//go:embed */*/*.html
//go:embed */*/*/*.html
var files embed.FS

func FS() fs.FS {
	return buffalo.NewFS(files, "templates")
}
