package config

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const testMenuYaml = `
menus:
  - id: settings
    parentid: home
    displayname: Settings
    restype: menu
    isaction: false
    priority: 4
    menunumber: 1200

  - id: cloudresources
    parentid: settings
    displayname: Cloud Resources
    restype: iframe
    isaction: true
    priority: 1
    menunumber: 1201
    viewtype: iframe
    frameworkservice: mc-infra-manager
    path: /cloud-resources
`

func writeTestMenuYaml(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, "webconsole_menu_resources.yaml")
	if err := os.WriteFile(path, []byte(testMenuYaml), 0o644); err != nil {
		t.Fatalf("failed to write test menu yaml: %v", err)
	}
	return path
}

func TestLoadMenuSpec_Success(t *testing.T) {
	path := writeTestMenuYaml(t)

	spec, err := LoadMenuSpec(path)
	if err != nil {
		t.Fatalf("LoadMenuSpec returned error: %v", err)
	}
	if len(spec.Menus) != 2 {
		t.Fatalf("expected 2 menus, got %d", len(spec.Menus))
	}

	root := spec.Menus[0]
	if root.ID != "settings" || root.ParentID != "home" || root.DisplayName != "Settings" {
		t.Errorf("unexpected root menu: %+v", root)
	}
	if root.Priority != 4 || root.MenuNumber != 1200 {
		t.Errorf("unexpected numeric fields on root menu: %+v", root)
	}

	iframe := spec.Menus[1]
	if iframe.ViewType != "iframe" || iframe.FrameworkService != "mc-infra-manager" || iframe.Path != "/cloud-resources" {
		t.Errorf("unexpected iframe menu fields: %+v", iframe)
	}

	// front(menus_api.js/login.js)가 기대하는 camelCase 응답 필드 확인
	data, err := json.Marshal(root)
	if err != nil {
		t.Fatalf("json.Marshal returned error: %v", err)
	}
	got := string(data)
	for _, want := range []string{`"id":"settings"`, `"parentId":"home"`, `"displayName":"Settings"`, `"menuNumber":1200`} {
		if !strings.Contains(got, want) {
			t.Errorf("expected json output to contain %q, got %s", want, got)
		}
	}
}

func TestLoadMenuSpec_FileNotFound(t *testing.T) {
	_, err := LoadMenuSpec(filepath.Join(t.TempDir(), "does-not-exist.yaml"))
	if err == nil {
		t.Fatal("expected error for missing file, got nil")
	}
}

func TestLoadMenuSpec_InvalidYaml(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "broken.yaml")
	if err := os.WriteFile(path, []byte("menus: [this is not valid: yaml"), 0o644); err != nil {
		t.Fatalf("failed to write broken yaml: %v", err)
	}

	_, err := LoadMenuSpec(path)
	if err == nil {
		t.Fatal("expected error for invalid yaml, got nil")
	}
}
