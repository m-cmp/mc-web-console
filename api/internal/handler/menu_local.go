package handler

import (
	"log"
	"strings"

	"mc_web_console_api/internal/config"
	"mc_web_console_api/internal/model"

	"github.com/labstack/echo/v4"
)

// localMenuOperations self 모드에서 mc-iam-manager 대신 로컬 yaml로 응답하는 operationId.
// 모두 flat 메뉴 배열을 반환하는 op라 같은 핸들러를 공유한다.
var localMenuOperations = []string{
	"Getallavailablemenus", // 로그인 사용자 메뉴 (login.js / menus_api.js)
	"Getmenuresources",     // 전체 메뉴 (menus_api.js / roles_api.js)
	"listMenus",            // 전체 메뉴 (setup_status_api.js)
}

func isLocalMenuOperation(operationId string) bool {
	for _, op := range localMenuOperations {
		if strings.EqualFold(op, operationId) {
			return true
		}
	}
	return false
}

// selfModeHiddenMenuIDs self 모드에서 숨기는 메뉴. 해당 화면이 mc-iam-manager 전용 API
// (메뉴/역할 관리, Setup Status 재시딩)를 호출하므로 IAM 없이는 동작하지 않는다.
// 하위 메뉴는 parentid 체인을 따라 함께 제외된다.
var selfModeHiddenMenuIDs = map[string]struct{}{
	"menus":         {}, // Settings > Organizations > Menus
	"roles":         {}, // Operations > Workspaces > Roles
	"csproles":      {}, // Operations > Workspaces > CSP Roles
	"cloudoverview": {}, // Settings > Cloud SPs > Cloud Overview (Setup Status 섹션)
}

// filterSelfModeMenus selfModeHiddenMenuIDs와 그 하위 메뉴를 제외한 목록을 반환한다.
func filterSelfModeMenus(menus []config.Menu) []config.Menu {
	hidden := make(map[string]struct{}, len(selfModeHiddenMenuIDs))
	for id := range selfModeHiddenMenuIDs {
		hidden[id] = struct{}{}
	}
	// 부모가 숨겨지면 자식도 숨긴다. yaml 순서에 의존하지 않도록 변화가 없을 때까지 반복.
	for changed := true; changed; {
		changed = false
		for _, m := range menus {
			if _, isHidden := hidden[m.ID]; isHidden {
				continue
			}
			if _, parentHidden := hidden[m.ParentID]; parentHidden {
				hidden[m.ID] = struct{}{}
				changed = true
			}
		}
	}

	visible := make([]config.Menu, 0, len(menus))
	for _, m := range menus {
		if _, isHidden := hidden[m.ID]; !isHidden {
			visible = append(visible, m)
		}
	}
	return visible
}

// handleLocalAvailableMenus MC_WEB_CONSOLE_USE_IAM=false일 때 메뉴 조회 op를
// mc-iam-manager로 프록시하지 않고 로컬 conf/webconsole_menu_resources.yaml 기반의
// 목록을 반환한다. self 모드는 전체 메뉴 = 역할별 메뉴이며, IAM 전용 화면만 제외한다.
//
// 응답 포맷은 mc-iam-manager의 ListUserMenu(src/handler/menu_handler.go)가 반환하는 것과
// 동일하게 래핑 없는 flat 배열을 CommonResponse.responseData에 그대로 담는다 — front
// (menus_api.js/login.js)가 flat 배열을 기대하기 때문이다.
func handleLocalAvailableMenus(c echo.Context, cfg *config.Config) error {
	if len(cfg.Menus) == 0 {
		log.Printf("[handleLocalAvailableMenus] cfg.Menus is empty (yaml load failed at boot or file is empty)")
		resp := model.CommonResponseStatusInternalServerError(
			"local menu definition unavailable (conf/webconsole_menu_resources.yaml)",
		)
		return c.JSON(resp.ToJSON())
	}

	resp := model.CommonResponseStatusOK(filterSelfModeMenus(cfg.Menus))
	return c.JSON(resp.ToJSON())
}
