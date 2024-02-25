package templates

import (
	"embed"
	"fmt"
	"io/fs"

	"github.com/davecgh/go-spew/spew"
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
	fmt.Println(files)
	spew.Dump(files)
	return buffalo.NewFS(files, "templates")
}
