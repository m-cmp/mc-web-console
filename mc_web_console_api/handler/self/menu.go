package self

import (
	"encoding/json"
	"mc_web_console_api/handler"
	"strings"

	"github.com/gobuffalo/buffalo"
)

type Menu struct {
	Id           string `json:"id"` // for routing
	ParentMenuId string `json:"parentMenuId"`
	DisplayName  string `json:"displayName"` // for display
	IsAction     string `json:"isAction"`    // maybe need type assertion..?
	Priority     string `json:"priority"`
	Menus        Menus  `json:"menus"`
}
type Menus []Menu

func GetAllAvailableMenus(c buffalo.Context) (*Menus, error) {
	commonResponse, err := handler.AnyCaller(c, "getmenuresources", &handler.CommonRequest{}, true)
	if err != nil {
		return &Menus{}, err
	}

	var menuListResp []map[string]interface{}
	err = json.Unmarshal([]byte(commonResponse.ResponseData.(string)), &menuListResp)
	if err != nil {
		return &Menus{}, err
	}

	menuList := &Menu{}
	for _, menuResp := range menuListResp {
		menuPart := strings.Split(menuResp["name"].(string), ":")

		menu := &Menu{
			Id:           menuPart[2],
			DisplayName:  menuPart[3],
			ParentMenuId: menuPart[4],
			Priority:     menuPart[5],
			IsAction:     menuPart[6],
		}
		menuList.Menus = append(menuList.Menus, *menu)
	}

	return &menuList.Menus, nil
}

func GetMenuTree(menuList Menus) (*Menus, error) {
	menuTree := buildMenuTree(menuList, "")
	return &menuTree, nil
}

func buildMenuTree(menus Menus, parentID string) Menus {
	var tree Menus

	for _, menu := range menus {
		if menu.ParentMenuId == parentID {
			menu.Menus = buildMenuTree(menus, menu.Id)
			tree = append(tree, menu)
		}
	}

	return tree
}
