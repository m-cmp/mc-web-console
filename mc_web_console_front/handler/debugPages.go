package handler

import (
	"io/ioutil"

	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
)

// /////// test /////
func HomeHandler(c buffalo.Context) error {
	c.Set("pretitle", "pretitle")
	c.Set("title", "title")
	return c.Render(http.StatusOK, tr.HTML("_debug/home/dash.html"))
}

// 로그인 폼 -> 로그인폼은 기본 렌더를 따름.
func AuthLoginHandler(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.HTML("auth/sign-in.html"))
}

///// DEBUG /////

func DEBUGRalive(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.JSON(map[string]interface{}{
		"status": 200,
		"msg":    "goodtogo",
	}))
}

func DEBUGRouteHandler(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.HTML("_debug/buffaloRoute/index.html"))
}

func DEBUGWorkflowHandler(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.HTML("_debug/flow/index.html"))
}

func DEBUGTablerMainHandler(c buffalo.Context) error {
	targetDir := "./templates/_debug/tabler"
	files, err := ioutil.ReadDir(targetDir)
	if err != nil {
		return err
	}
	list := []string{}
	for _, file := range files {
		if file.Name() == "main.html" {
			continue
		}
		list = append(list, strings.TrimRight(file.Name(), ".html"))
	}
	c.Set("files", list)
	return c.Render(http.StatusOK, r.HTML("_debug/tabler/main.html"))
}

func DEBUGTablerHandler(c buffalo.Context) error {
	target := "_debug/tabler/" + c.Param("target") + ".html"
	return c.Render(http.StatusOK, r.HTML(target))
}

func DEBUGSamplePageHandler(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.HTML("_debug/tabler/main.html"))
}

func DEBUGTabulatorHandler(c buffalo.Context) error {
	return c.Render(http.StatusOK, tr.HTML("_debug/tabulator/tabulator.html"))
}

// sy sample page
func SyPageController(c buffalo.Context) error {
	//logger.Info("syPage")
	return c.Render(http.StatusOK, r.HTML("_debug/sy/extra.html"))
}
func TestPageController(c buffalo.Context) error {

	return c.Render(http.StatusOK, r.HTML("_debug/sy/est/main.html"))
}
