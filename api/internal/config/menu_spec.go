package config

import (
	"fmt"

	"github.com/spf13/viper"
)

// Menu conf/webconsole_menu_resources.yaml의 메뉴 항목. mapstructure 태그는 yaml의
// lowercase 키(mc-iam-manager src/model/menu.go의 Menu와 동일 스키마)에 대응하고,
// json 태그는 front(menus_api.js/login.js)가 기대하는 camelCase 응답 필드에 대응한다.
type Menu struct {
	ID               string `mapstructure:"id" json:"id"`
	ParentID         string `mapstructure:"parentid" json:"parentId,omitempty"`
	DisplayName      string `mapstructure:"displayname" json:"displayName"`
	ResType          string `mapstructure:"restype" json:"resType"`
	IsAction         bool   `mapstructure:"isaction" json:"isAction"`
	Priority         uint   `mapstructure:"priority" json:"priority"`
	MenuNumber       uint   `mapstructure:"menunumber" json:"menuNumber"`
	ViewType         string `mapstructure:"viewtype" json:"viewType,omitempty"`
	FrameworkService string `mapstructure:"frameworkservice" json:"frameworkService,omitempty"`
	Path             string `mapstructure:"path" json:"path,omitempty"`
}

// MenuSpec conf/webconsole_menu_resources.yaml의 최상위 구조 ("menus:" 키)
type MenuSpec struct {
	Menus []Menu `mapstructure:"menus"`
}

// LoadMenuSpec conf/webconsole_menu_resources.yaml 로드 (LoadApiSpec과 동일 패턴)
func LoadMenuSpec(path string) (*MenuSpec, error) {
	v := viper.New()
	v.SetConfigFile(path)
	v.SetConfigType("yaml")

	if err := v.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("failed to read menu spec file: %w", err)
	}

	var spec MenuSpec
	if err := v.Unmarshal(&spec); err != nil {
		return nil, fmt.Errorf("failed to unmarshal menu spec: %w", err)
	}

	return &spec, nil
}
