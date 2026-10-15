package actions

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/labstack/echo/v4"
)

// 메뉴 접근 가드: 전체 메뉴(Getmenuresources)에 있는 화면 URL인데 사용자 메뉴(GetAllAvailableMenus)에
// 없으면 화면 진입을 막는다. 메뉴로 관리되지 않는 화면(상세·내부 페이지)은 대상이 아니다.
// 메뉴 조회가 실패하면 화면을 막지 않고 로그만 남긴다(IAM 일시 장애로 전 화면이 막히지 않도록).

type menuItem struct {
	ID         string      `json:"id"`
	ParentID   string      `json:"parentId"`
	Path       string      `json:"path"`
	ViewType   string      `json:"viewType"`
	IsAction   interface{} `json:"isAction"` // bool 또는 "true"/"false"
	Priority   int         `json:"priority"`
	MenuNumber int         `json:"menuNumber"`
}

func (m menuItem) isAction() bool {
	switch v := m.IsAction.(type) {
	case bool:
		return v
	case string:
		return strings.EqualFold(v, "true")
	}
	return false
}

// menuCatalogData 전체 메뉴에서 계산한 화면 URL 표와 사이드바 순서의 화면 목록
type menuCatalogData struct {
	byHref  map[string][]string // 화면 URL → 그 URL로 열리는 메뉴 id 목록
	ordered []menuPage          // 사이드바 표시 순서(priority, menuNumber)의 화면 메뉴
}

type menuPage struct {
	id   string
	href string
}

type menuListResponse struct {
	ResponseData []menuItem `json:"responseData"`
}

type menuCacheEntry struct {
	ids      map[string]bool
	storedAt time.Time
}

const menuGuardCacheTTL = 60 * time.Second

var menuGuardCache = struct {
	mu      sync.Mutex
	catalog *menuCatalogData
	catAt   time.Time
	users   map[string]menuCacheEntry // 토큰 해시 → 사용자 메뉴 id 집합
}{users: map[string]menuCacheEntry{}}

// fetchMenus API 서버의 서브시스템 프록시로 mc-iam-manager 메뉴 목록을 사용자 토큰으로 조회한다.
func fetchMenus(token, operationID string) ([]menuItem, error) {
	url := API_SCHEME + "://" + API_ADDR + ":" + API_PORT + "/api/mc-iam-manager/" + operationID
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewBufferString("{}"))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", token)

	resp, err := (&http.Client{Timeout: 10 * time.Second}).Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("%s returned %d", operationID, resp.StatusCode)
	}
	var parsed menuListResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		return nil, err
	}
	return parsed.ResponseData, nil
}

// menuHrefs 사이드바(sidebar.js resolveMenuHref)와 같은 규칙으로 메뉴별 화면 URL을 계산한다.
//   - iframe: /webconsole/_view/{id}
//   - local + path: /webconsole{path}
//   - local, path 없음: 루트부터의 id 경로 (/webconsole/{root}/{category}/{menu}[/{sub}])
//   - popup: 화면 URL 없음
func menuHrefs(menus []menuItem) map[string][]string {
	return buildMenuCatalog(menus).byHref
}

func menuHref(m menuItem, chain []string) string {
	switch strings.ToLower(m.ViewType) {
	case "iframe":
		return "/webconsole/_view/" + m.ID
	case "popup":
		return ""
	}
	if m.Path != "" {
		return strings.TrimSuffix("/webconsole/"+strings.TrimPrefix(m.Path, "/"), "/")
	}
	return "/webconsole/" + strings.Join(chain, "/")
}

func buildMenuCatalog(menus []menuItem) *menuCatalogData {
	byID := make(map[string]menuItem, len(menus))
	for _, m := range menus {
		byID[m.ID] = m
	}
	chain := func(m menuItem) []string {
		ids := []string{m.ID}
		seen := map[string]bool{m.ID: true}
		for p := m.ParentID; p != "" && p != "home"; {
			parent, ok := byID[p]
			if !ok || seen[p] {
				break
			}
			seen[p] = true
			ids = append([]string{p}, ids...)
			p = parent.ParentID
		}
		return ids
	}

	data := &menuCatalogData{byHref: map[string][]string{}}
	for _, m := range menus {
		if href := menuHref(m, chain(m)); href != "" {
			data.byHref[href] = append(data.byHref[href], m.ID)
		}
	}

	// 사이드바와 같은 순서로 화면 메뉴를 나열한다 (형제끼리 priority → menuNumber)
	children := map[string][]menuItem{}
	for _, m := range menus {
		parent := m.ParentID
		if parent == "home" {
			parent = ""
		}
		if _, ok := byID[parent]; parent != "" && !ok {
			parent = ""
		}
		children[parent] = append(children[parent], m)
	}
	for _, list := range children {
		sort.SliceStable(list, func(i, j int) bool {
			if list[i].Priority != list[j].Priority {
				return list[i].Priority < list[j].Priority
			}
			return list[i].MenuNumber < list[j].MenuNumber
		})
	}
	visited := map[string]bool{}
	var walk func(parent string)
	walk = func(parent string) {
		for _, m := range children[parent] {
			if visited[m.ID] {
				continue
			}
			visited[m.ID] = true
			if m.isAction() {
				if href := menuHref(m, chain(m)); href != "" {
					data.ordered = append(data.ordered, menuPage{id: m.ID, href: href})
				}
			}
			walk(m.ID)
		}
	}
	walk("")
	return data
}

func tokenKey(token string) string {
	sum := sha256.Sum256([]byte(token))
	return hex.EncodeToString(sum[:])
}

func menuCatalog(token string) (*menuCatalogData, error) {
	menuGuardCache.mu.Lock()
	if menuGuardCache.catalog != nil && time.Since(menuGuardCache.catAt) < menuGuardCacheTTL {
		catalog := menuGuardCache.catalog
		menuGuardCache.mu.Unlock()
		return catalog, nil
	}
	menuGuardCache.mu.Unlock()

	menus, err := fetchMenus(token, "Getmenuresources")
	if err != nil {
		return nil, err
	}
	catalog := buildMenuCatalog(menus)

	menuGuardCache.mu.Lock()
	menuGuardCache.catalog = catalog
	menuGuardCache.catAt = time.Now()
	menuGuardCache.mu.Unlock()
	return catalog, nil
}

func userMenuIDs(token string) (map[string]bool, error) {
	key := tokenKey(token)
	menuGuardCache.mu.Lock()
	if e, ok := menuGuardCache.users[key]; ok && time.Since(e.storedAt) < menuGuardCacheTTL {
		menuGuardCache.mu.Unlock()
		return e.ids, nil
	}
	menuGuardCache.mu.Unlock()

	menus, err := fetchMenus(token, "GetAllAvailableMenus")
	if err != nil {
		return nil, err
	}
	ids := make(map[string]bool, len(menus))
	for _, m := range menus {
		ids[m.ID] = true
	}

	menuGuardCache.mu.Lock()
	now := time.Now()
	for k, e := range menuGuardCache.users {
		if now.Sub(e.storedAt) >= menuGuardCacheTTL {
			delete(menuGuardCache.users, k)
		}
	}
	menuGuardCache.users[key] = menuCacheEntry{ids: ids, storedAt: now}
	menuGuardCache.mu.Unlock()
	return ids, nil
}

// menuAccessRedirect 요청 경로가 사용자에게 할당되지 않은 메뉴 화면이면 이동할 경로를, 아니면 ""를 반환한다.
// 로그인 직후 기본 화면(RootPathForRedirectString)이 막히면 사용자의 첫 메뉴 화면으로 보낸다
// (Unauthorized 화면은 Back to Login 만 있어 로그인할 때마다 막히기 때문).
func menuAccessRedirect(c echo.Context, path string) string {
	token, _ := c.Get("Authorization").(string)
	if token == "" {
		return ""
	}
	path = strings.TrimSuffix(path, "/")

	catalog, err := menuCatalog(token)
	if err != nil {
		log.Printf("[MenuGuard] menu catalog unavailable, allowing %s: %v", path, err)
		return ""
	}
	menuIDs, ok := catalog.byHref[path]
	if !ok {
		return ""
	}

	allowed, err := userMenuIDs(token)
	if err != nil {
		log.Printf("[MenuGuard] user menus unavailable, allowing %s: %v", path, err)
		return ""
	}
	for _, id := range menuIDs {
		if allowed[id] {
			return ""
		}
	}

	// 화면 메뉴가 하나도 없는 사용자(가입 승인 직후 역할 미배정 등)는 역할 배정 대기 화면으로 보낸다
	hasPage := false
	for _, p := range catalog.ordered {
		if allowed[p.id] {
			hasPage = true
			break
		}
	}
	if !hasPage {
		log.Printf("[MenuGuard] no menu pages for user, redirecting %s to %s", path, menuPendingPath)
		return menuPendingPath
	}

	if path == RootPathForRedirectString {
		for _, p := range catalog.ordered {
			if allowed[p.id] {
				log.Printf("[MenuGuard] default page %s not in user menus, redirecting to %s", path, p.href)
				return p.href
			}
		}
	}
	log.Printf("[MenuGuard] denied %s (menu %v not in user menus)", path, menuIDs)
	return menuDeniedPath
}

const (
	menuDeniedPath  = "/auth/unauthorized#menuNotAllowed"
	menuPendingPath = "/auth/pending"
)

// isMenuAccessDenied 요청 경로가 사용자에게 할당되지 않은 메뉴 화면이면 true.
func isMenuAccessDenied(c echo.Context, path string) bool {
	return menuAccessRedirect(c, path) != ""
}
