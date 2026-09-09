package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"mc_web_console_api/internal/config"
	"mc_web_console_api/internal/model"

	"github.com/labstack/echo/v4"
)

func newTestContext() (echo.Context, *httptest.ResponseRecorder) {
	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/api/mc-iam-manager/GetAllAvailableMenus", nil)
	rec := httptest.NewRecorder()
	return e.NewContext(req, rec), rec
}

func TestHandleLocalAvailableMenus_ReturnsAllMenus(t *testing.T) {
	c, rec := newTestContext()
	cfg := &config.Config{
		Menus: []config.Menu{
			{ID: "settings", ParentID: "home", DisplayName: "Settings"},
			{ID: "users", ParentID: "settings", DisplayName: "Users"},
		},
	}

	if err := handleLocalAvailableMenus(c, cfg); err != nil {
		t.Fatalf("handleLocalAvailableMenus returned error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var resp model.CommonResponse
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	menus, ok := resp.ResponseData.([]interface{})
	if !ok {
		t.Fatalf("expected responseData to be a flat array, got %T", resp.ResponseData)
	}
	if len(menus) != len(cfg.Menus) {
		t.Errorf("expected %d menus (no role filtering), got %d", len(cfg.Menus), len(menus))
	}
}

func TestFilterSelfModeMenus_HidesIAMOnlyMenusAndDescendants(t *testing.T) {
	menus := []config.Menu{
		{ID: "settings", ParentID: "home"},
		{ID: "organizations", ParentID: "settings"},
		{ID: "users", ParentID: "organizations"},
		{ID: "menus", ParentID: "organizations"},
		{ID: "menus-child", ParentID: "menus"},            // 숨겨진 부모의 자식
		{ID: "menus-grandchild", ParentID: "menus-child"}, // yaml 순서상 부모보다 뒤
		{ID: "cloudsps", ParentID: "settings"},
		{ID: "cloudoverview", ParentID: "cloudsps"},
		{ID: "credentials", ParentID: "cloudsps"},
		{ID: "workspaces", ParentID: "manage"},
		{ID: "roles", ParentID: "workspaces"},
		{ID: "csproles", ParentID: "workspaces"},
		{ID: "projects", ParentID: "workspaces"},
	}

	got := filterSelfModeMenus(menus)

	visible := map[string]bool{}
	for _, m := range got {
		visible[m.ID] = true
	}
	for _, id := range []string{"settings", "organizations", "users", "cloudsps", "credentials", "workspaces", "projects"} {
		if !visible[id] {
			t.Errorf("expected %q to stay visible in self mode", id)
		}
	}
	for _, id := range []string{"menus", "menus-child", "menus-grandchild", "cloudoverview", "roles", "csproles"} {
		if visible[id] {
			t.Errorf("expected %q to be hidden in self mode", id)
		}
	}
}

func TestIsLocalMenuOperation(t *testing.T) {
	for _, op := range []string{"Getallavailablemenus", "GetAllAvailableMenus", "Getmenuresources", "listMenus", "LISTMENUS"} {
		if !isLocalMenuOperation(op) {
			t.Errorf("expected %q to be handled locally in self mode", op)
		}
	}
	for _, op := range []string{"Createmenu", "Updatemenu", "Deletemenu", "Listmenustree", "InitialMenus"} {
		if isLocalMenuOperation(op) {
			t.Errorf("expected %q NOT to be handled locally", op)
		}
	}
}

func TestHandleLocalAvailableMenus_EmptyMenusReturns500(t *testing.T) {
	c, rec := newTestContext()
	cfg := &config.Config{Menus: nil}

	if err := handleLocalAvailableMenus(c, cfg); err != nil {
		t.Fatalf("handleLocalAvailableMenus returned error: %v", err)
	}
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", rec.Code)
	}
}
