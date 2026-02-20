package actions

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"reflect"
	"strings"

	"front/public"
	"front/templates"

	"github.com/CloudyKit/jet/v6"
	"github.com/CloudyKit/jet/v6/loaders/httpfs"
	"github.com/labstack/echo/v4"
)

var (
	jetSet          *jet.Set
	webpackManifest map[string]string
)

func init() {
	// embed.FS를 http.FS로 변환하여 Jet 로더 생성
	loader, err := httpfs.NewLoader(http.FS(templates.FS()))
	if err != nil {
		log.Fatalf("Failed to create template loader: %v", err)
	}

	// Jet 템플릿 엔진 초기화
	jetSet = jet.NewSet(
		loader,
		jet.InDevelopmentMode(), // 개발 모드에서는 템플릿 캐싱 비활성화
	)

	// Webpack manifest 로드
	loadWebpackManifest()

	// 전역 함수 등록
	jetSet.AddGlobalFunc("stylesheetTag", stylesheetTagFunc)
	jetSet.AddGlobalFunc("javascriptTag", javascriptTagFunc)
	jetSet.AddGlobalFunc("partial", partialFunc)
	jetSet.AddGlobalFunc("yield", yieldFunc)
}

// loadWebpackManifest - webpack manifest.json 파일을 로드하여 메모리에 저장
func loadWebpackManifest() {
	webpackManifest = make(map[string]string)

	// manifest.json 파일 읽기
	manifestFile, err := public.FS().Open("assets/manifest.json")
	if err != nil {
		log.Printf("Warning: webpack manifest.json not found: %v", err)
		return
	}
	defer manifestFile.Close()

	// JSON 파싱
	if err := json.NewDecoder(manifestFile).Decode(&webpackManifest); err != nil {
		log.Printf("Warning: failed to parse webpack manifest: %v", err)
		return
	}

	log.Printf("Loaded webpack manifest with %d entries", len(webpackManifest))
}

// Jet 렌더러 구조체
type JetRenderer struct {
	views *jet.Set
}

// Echo Renderer 인터페이스 구현
func (r *JetRenderer) Render(w io.Writer, name string, data interface{}, c echo.Context) error {
	// embed.FS에는 leading slash 없이 저장되므로 제거
	name = strings.TrimPrefix(name, "/")

	tmpl, err := r.views.GetTemplate(name)
	if err != nil {
		return err
	}

	vars := make(jet.VarMap)
	if data != nil {
		// data를 VarMap으로 변환
		if dataMap, ok := data.(map[string]interface{}); ok {
			for k, v := range dataMap {
				vars.Set(k, v)
			}
		}
	}

	// Context 데이터 추가
	vars.Set("current_path", c.Request().URL.Path)
	vars.Set("request", c.Request())
	vars.Set("response", c.Response())

	return tmpl.Execute(w, vars, nil)
}

// RenderWithoutLayout - 레이아웃 없이 페이지만 렌더링 (로그인 등 public 페이지용)
func RenderWithoutLayout(c echo.Context, status int, templatePath string, data map[string]interface{}) error {
	templatePath = strings.TrimPrefix(templatePath, "/")

	tmpl, err := jetSet.GetTemplate(templatePath)
	if err != nil {
		log.Printf("Error loading template %s: %v", templatePath, err)
		return err
	}

	vars := make(jet.VarMap)
	if data != nil {
		for k, v := range data {
			vars.Set(k, v)
		}
	}
	vars.Set("current_path", c.Request().URL.Path)
	vars.Set("request", c.Request())
	vars.Set("response", c.Response())

	c.Response().Header().Set(echo.HeaderContentType, echo.MIMETextHTMLCharsetUTF8)
	c.Response().WriteHeader(status)
	return tmpl.Execute(c.Response().Writer, vars, nil)
}

// HTML 렌더링 헬퍼 함수
func RenderHTML(c echo.Context, status int, templatePath string, data map[string]interface{}) error {
	// embed.FS에는 leading slash 없이 저장되므로 제거
	templatePath = strings.TrimPrefix(templatePath, "/")

	// 1단계: 페이지 템플릿을 버퍼에 렌더링
	var pageBuffer strings.Builder
	pageTmpl, err := jetSet.GetTemplate(templatePath)
	if err != nil {
		log.Printf("Error loading page template %s: %v", templatePath, err)
		return err
	}

	pageVars := make(jet.VarMap)
	if data != nil {
		for k, v := range data {
			pageVars.Set(k, v)
		}
	}
	pageVars.Set("current_path", c.Request().URL.Path)
	pageVars.Set("request", c.Request())
	pageVars.Set("response", c.Response())

	if err := pageTmpl.Execute(&pageBuffer, pageVars, nil); err != nil {
		log.Printf("Error executing page template %s: %v", templatePath, err)
		return err
	}

	pageContent := pageBuffer.String()
	log.Printf("Page content length: %d bytes", len(pageContent))

	// 2단계: 레이아웃 템플릿 결정 - iframe 템플릿인 경우 iframe 레이아웃 사용
	layoutName := "application.plush.html"
	if strings.Contains(templatePath, ".iframe.") {
		layoutName = "application.iframe.plush.html"
	}

	layoutTmpl, err := jetSet.GetTemplate(layoutName)
	if err != nil {
		log.Printf("Error loading layout template %s: %v", layoutName, err)
		return err
	}

	layoutVars := make(jet.VarMap)
	// pageContent를 string으로 설정, 템플릿에서 | raw 필터 사용
	layoutVars.Set("pageContent", pageContent)
	layoutVars.Set("current_path", c.Request().URL.Path)
	layoutVars.Set("request", c.Request())
	layoutVars.Set("response", c.Response())

	log.Printf("Executing layout template with content length: %d", len(pageContent))

	c.Response().Header().Set(echo.HeaderContentType, echo.MIMETextHTMLCharsetUTF8)
	c.Response().WriteHeader(status)
	return layoutTmpl.Execute(c.Response().Writer, layoutVars, nil)
}

// 템플릿 헬퍼 함수들 (jet.Func 시그니처)

// SafeHTML - HTML 이스케이프를 우회하기 위한 타입
type SafeHTML string

// resolveAssetPath - webpack manifest를 사용하여 실제 asset 경로 반환
func resolveAssetPath(entryName string, extension string) string {
	// 확장자가 없으면 추가
	if !strings.HasSuffix(entryName, extension) {
		entryName = entryName + extension
	}

	// webpack manifest에서 실제 파일명 조회
	if actualFile, exists := webpackManifest[entryName]; exists {
		// manifest에서 찾은 경우 /assets/ 경로로 반환
		return "/assets/" + actualFile
	}

	// manifest에 없는 경우 fallback: /static/ 경로 사용
	if !strings.HasPrefix(entryName, "/") {
		if extension == ".css" {
			return "/static/css/" + entryName
		} else if extension == ".js" {
			return "/static/js/" + entryName
		}
	}

	return entryName
}

// Render - Jet의 Renderer 인터페이스 구현
func (s SafeHTML) Render(r *jet.Runtime) {
	r.Write([]byte(s))
}

// stylesheetTagFunc - CSS 파일 링크 태그 생성
func stylesheetTagFunc(args jet.Arguments) reflect.Value {
	args.RequireNumOfArguments("stylesheetTag", 1, 1)
	path := args.Get(0).String()

	// webpack manifest에서 실제 파일명 조회
	actualPath := resolveAssetPath(path, ".css")

	result := SafeHTML(`<link rel="stylesheet" href="` + actualPath + `">`)
	return reflect.ValueOf(&result)
}

// javascriptTagFunc - JavaScript 파일 스크립트 태그 생성
func javascriptTagFunc(args jet.Arguments) reflect.Value {
	args.RequireNumOfArguments("javascriptTag", 1, 1)
	path := args.Get(0).String()

	// webpack manifest에서 실제 파일명 조회
	actualPath := resolveAssetPath(path, ".js")

	result := SafeHTML(`<script src="` + actualPath + `"></script>`)
	return reflect.ValueOf(&result)
}

// partialFunc - 부분 템플릿 렌더링
func partialFunc(args jet.Arguments) reflect.Value {
	args.RequireNumOfArguments("partial", 1, 2)
	name := args.Get(0).String()

	// Buffalo 규칙: partial 파일명 앞에 '_' 추가
	// 예: "partials/layout/header.html" -> "partials/layout/_header.html"
	parts := strings.Split(name, "/")
	if len(parts) > 0 {
		lastPart := parts[len(parts)-1]
		if !strings.HasPrefix(lastPart, "_") {
			parts[len(parts)-1] = "_" + lastPart
			name = strings.Join(parts, "/")
		}
	}

	tmpl, err := jetSet.GetTemplate(name)
	if err != nil {
		log.Printf("Warning: partial template not found: %s, error: %v", name, err)
		return reflect.ValueOf("")
	}

	vars := make(jet.VarMap)
	if args.NumOfArguments() > 1 {
		// 두 번째 인자가 있으면 데이터로 사용
		data := args.Get(1).Interface()
		if dataMap, ok := data.(map[string]interface{}); ok {
			for k, v := range dataMap {
				vars.Set(k, v)
			}
		}
	}

	var buf strings.Builder
	err = tmpl.Execute(&buf, vars, nil)
	if err != nil {
		empty := SafeHTML("")
		return reflect.ValueOf(&empty)
	}

	result := SafeHTML(buf.String())
	return reflect.ValueOf(&result)
}

// yieldFunc - 레이아웃에서 페이지 컨텐츠를 렌더링
func yieldFunc(args jet.Arguments) reflect.Value {
	// yield는 런타임에서 "content" 변수를 출력
	// 실제 구현은 VarMap의 "content" 값을 반환
	// 이 함수는 템플릿 실행 시 Runtime에서 호출됨
	args.RequireNumOfArguments("yield", 0, 0)

	// Runtime에서 content 변수를 가져옴
	runtime := args.Runtime()
	content := runtime.Resolve("content")

	if content.IsNil() {
		empty := SafeHTML("")
		return reflect.ValueOf(&empty)
	}

	// content를 SafeHTML로 변환하여 반환
	result := SafeHTML(content.String())
	return reflect.ValueOf(&result)
}
