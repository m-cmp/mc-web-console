package actions

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"
	"time"
)

func resetMenuGuardCache() {
	menuGuardCache.mu.Lock()
	menuGuardCache.catalog = nil
	menuGuardCache.catAt = time.Time{}
	menuGuardCache.users = map[string]menuCacheEntry{}
	menuGuardCache.mu.Unlock()
}

// stage Getmenuresources 형식의 일부 (operations > manage > workspaces > roles 등)
var testCatalog = []menuItem{
	{ID: "operations", ParentID: "home", ViewType: "local"},
	{ID: "manage", ParentID: "operations", ViewType: "local"},
	{ID: "workspaces", ParentID: "manage", ViewType: "local", IsAction: true},
	{ID: "roles", ParentID: "workspaces", ViewType: "local", IsAction: true},
	{ID: "workloads", ParentID: "manage", ViewType: "local"},
	{ID: "infraworkloads", ParentID: "workloads", ViewType: "local", IsAction: true},
	{ID: "workflows", ParentID: "manage", ViewType: "local"},
	{ID: "mcworkflows", ParentID: "workflows", ViewType: "iframe", Path: "/web/workflow/list", IsAction: true},
	{ID: "settings", ParentID: "home", ViewType: "local"},
	{ID: "environment", ParentID: "settings", ViewType: "local"},
	{ID: "credentials", ParentID: "environment", ViewType: "local", Path: "/settings/environment/cloudsps/credentials", IsAction: true},
	{ID: "costpopup", ParentID: "manage", ViewType: "popup", Path: "/cost"},
}

func TestMenuHrefs(t *testing.T) {
	hrefs := menuHrefs(testCatalog)
	want := map[string][]string{
		"/webconsole/operations/manage/workspaces/roles":         {"roles"},
		"/webconsole/operations/manage/workspaces":               {"workspaces"},
		"/webconsole/operations/manage/workloads/infraworkloads": {"infraworkloads"},
		"/webconsole/_view/mcworkflows":                          {"mcworkflows"},
		"/webconsole/settings/environment/cloudsps/credentials":  {"credentials"},
	}
	for href, ids := range want {
		if got := hrefs[href]; !reflect.DeepEqual(got, ids) {
			t.Errorf("hrefs[%q] = %v, want %v", href, got, ids)
		}
	}
	for href, ids := range hrefs {
		for _, id := range ids {
			if id == "costpopup" {
				t.Errorf("popup menu must not have a page URL, got %q", href)
			}
		}
	}
}

// newMenuAPI GetAllAvailableMenus 는 userMenus, Getmenuresources 는 testCatalog 를 돌려주는 API 서버
func newMenuAPI(t *testing.T, userMenus []menuItem, status int, calls *int) {
	t.Helper()
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if calls != nil {
			*calls++
		}
		if r.Header.Get("Authorization") != "user-token" {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		if status != http.StatusOK {
			w.WriteHeader(status)
			return
		}
		data := testCatalog
		if r.URL.Path == "/api/mc-iam-manager/GetAllAvailableMenus" {
			data = userMenus
		}
		json.NewEncoder(w).Encode(map[string]interface{}{"responseData": data})
	}))
	t.Cleanup(srv.Close)
	pointApiToServer(t, srv.URL)
	resetMenuGuardCache()
	t.Cleanup(resetMenuGuardCache)
}

func operatorMenus() []menuItem {
	var out []menuItem
	for _, m := range testCatalog {
		if m.ID != "workspaces" && m.ID != "roles" {
			out = append(out, m)
		}
	}
	return out
}

func TestIsMenuAccessDenied(t *testing.T) {
	newMenuAPI(t, operatorMenus(), http.StatusOK, nil)

	cases := []struct {
		path string
		want bool
	}{
		{"/webconsole/operations/manage/workspaces/roles", true},
		{"/webconsole/operations/manage/workspaces/roles/", true},
		{"/webconsole/operations/manage/workspaces", true},
		{"/webconsole/operations/manage/workloads/infraworkloads", false},
		{"/webconsole/_view/mcworkflows", false},
		{"/webconsole/settings/environment/cloudsps/credentials", false},
		{"/webconsole/operations/manage/workloads/infraworkloads/detail", false}, // 메뉴가 아닌 화면
	}
	for _, tc := range cases {
		c := newTestContext()
		c.Set("Authorization", "user-token")
		if got := isMenuAccessDenied(c, tc.path); got != tc.want {
			t.Errorf("isMenuAccessDenied(%q) = %v, want %v", tc.path, got, tc.want)
		}
	}
}

func TestIsMenuAccessDenied_AllMenusUser(t *testing.T) {
	newMenuAPI(t, testCatalog, http.StatusOK, nil)
	c := newTestContext()
	c.Set("Authorization", "user-token")
	if isMenuAccessDenied(c, "/webconsole/operations/manage/workspaces/roles") {
		t.Fatal("user with the roles menu must not be denied")
	}
}

func TestIsMenuAccessDenied_FailOpen(t *testing.T) {
	newMenuAPI(t, nil, http.StatusInternalServerError, nil)
	c := newTestContext()
	c.Set("Authorization", "user-token")
	if isMenuAccessDenied(c, "/webconsole/operations/manage/workspaces/roles") {
		t.Fatal("menu lookup failure must not block the page")
	}
}

func TestIsMenuAccessDenied_CachesMenus(t *testing.T) {
	calls := 0
	newMenuAPI(t, operatorMenus(), http.StatusOK, &calls)
	for i := 0; i < 3; i++ {
		c := newTestContext()
		c.Set("Authorization", "user-token")
		isMenuAccessDenied(c, "/webconsole/operations/manage/workspaces/roles")
	}
	if calls != 2 {
		t.Fatalf("API calls = %d, want 2 (catalog + user menus, then cached)", calls)
	}
}

func TestMenuAccessRedirect_DefaultPageFallsBackToFirstMenu(t *testing.T) {
	// viewer·billviewer 처럼 Infra Workloads 메뉴가 없는 사용자: 로그인 직후 기본 화면이 막히면
	// Unauthorized 대신 사이드바 순서상 첫 메뉴 화면으로 보낸다
	catalog := []menuItem{
		{ID: "operations", ParentID: "home", Priority: 1, MenuNumber: 2000},
		{ID: "manage", ParentID: "operations", Priority: 1, MenuNumber: 2100},
		{ID: "workloads", ParentID: "manage", Priority: 1, MenuNumber: 2110},
		{ID: "infraworkloads", ParentID: "workloads", IsAction: true, Priority: 1, MenuNumber: 2111},
		{ID: "analytics", ParentID: "operations", Priority: 2, MenuNumber: 2200},
		{ID: "costanalysis", ParentID: "analytics", IsAction: "true", Priority: 2, MenuNumber: 2202},
		{ID: "billingreport", ParentID: "analytics", IsAction: true, ViewType: "iframe", Priority: 1, MenuNumber: 2201},
	}
	saved := testCatalog
	testCatalog = catalog
	t.Cleanup(func() { testCatalog = saved })

	newMenuAPI(t, []menuItem{{ID: "costanalysis"}, {ID: "billingreport"}}, http.StatusOK, nil)
	c := newTestContext()
	c.Set("Authorization", "user-token")

	if got := menuAccessRedirect(c, RootPathForRedirectString); got != "/webconsole/_view/billingreport" {
		t.Fatalf("default page redirect = %q, want first user menu /webconsole/_view/billingreport", got)
	}
	if got := menuAccessRedirect(c, "/webconsole/operations/manage/workloads/infraworkloads/"); got != "/webconsole/_view/billingreport" {
		t.Fatalf("default page with trailing slash = %q", got)
	}
	if got := menuAccessRedirect(c, "/webconsole/operations/analytics/costanalysis"); got != "" {
		t.Fatalf("allowed menu redirected to %q", got)
	}
}

func TestMenuAccessRedirect_DeniedGoesToUnauthorized(t *testing.T) {
	newMenuAPI(t, operatorMenus(), http.StatusOK, nil)
	c := newTestContext()
	c.Set("Authorization", "user-token")
	if got := menuAccessRedirect(c, "/webconsole/operations/manage/workspaces/roles"); got != menuDeniedPath {
		t.Fatalf("redirect = %q, want %q", got, menuDeniedPath)
	}
}

func TestMenuAccessRedirect_NoMenuPagesGoesToPending(t *testing.T) {
	// 가입 승인 직후처럼 역할이 없어 사용자 메뉴가 비어 있는 경우: 기본 화면·메뉴 화면 모두 대기 화면으로
	newMenuAPI(t, []menuItem{}, http.StatusOK, nil)
	c := newTestContext()
	c.Set("Authorization", "user-token")

	for _, path := range []string{
		RootPathForRedirectString,
		"/webconsole/operations/manage/workspaces/roles",
		"/webconsole/_view/mcworkflows",
	} {
		if got := menuAccessRedirect(c, path); got != menuPendingPath {
			t.Errorf("menuAccessRedirect(%q) = %q, want %q", path, got, menuPendingPath)
		}
	}
	if got := menuAccessRedirect(c, "/webconsole/operations/manage/workloads/infraworkloads/detail"); got != "" {
		t.Errorf("non-menu page redirected to %q", got)
	}
}
