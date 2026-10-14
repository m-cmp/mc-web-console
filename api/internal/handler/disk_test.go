package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/labstack/echo/v4"
)

func lookupDisk(t *testing.T, provider string) diskTypeInfo {
	t.Helper()
	e := echo.New()
	body := `{"queryParams":{"provider":"` + provider + `"}}`
	req := httptest.NewRequest(http.MethodPost, "/api/disklookup", strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	rec := httptest.NewRecorder()
	if err := DiskLookup(e.NewContext(req, rec)); err != nil {
		t.Fatalf("DiskLookup: %v", err)
	}
	var resp struct {
		ResponseData []diskTypeInfo `json:"responseData"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &resp); err != nil {
		t.Fatalf("decode: %v (%s)", err, rec.Body.String())
	}
	if len(resp.ResponseData) != 1 {
		t.Fatalf("provider %s: want 1 entry, got %d", provider, len(resp.ResponseData))
	}
	return resp.ResponseData[0]
}

// Tencent 현세대 인스턴스(S8 등)는 시스템 디스크로 CLOUD_BSSD·CLOUD_HSSD 만 지원한다.
// 목록에 없으면 사용자가 고를 수 없어 기본값 CLOUD_PREMIUM 으로 노드풀이 만들어지고,
// CVM 생성이 "[19045] CVM not support the required disk" 로 매번 거부돼 노드가 뜨지 않는다.
// 기준: cb-tumblebug assets/diskinfo.yaml (tencent diskTypes, rootDisk: true)
func TestDiskLookupTencentOffersCurrentGenerationRootDisks(t *testing.T) {
	info := lookupDisk(t, "tencent")

	for _, want := range []string{"CLOUD_PREMIUM", "CLOUD_SSD", "CLOUD_HSSD", "CLOUD_BSSD"} {
		if !contains(info.RootDiskType, want) {
			t.Errorf("TENCENT RootDiskType should include %s, got %v", want, info.RootDiskType)
		}
	}
	// CLOUD_TSSD 는 시스템 디스크가 될 수 없다
	if contains(info.RootDiskType, "CLOUD_TSSD") {
		t.Errorf("TENCENT RootDiskType must not include CLOUD_TSSD, got %v", info.RootDiskType)
	}
	// 고른 타입마다 크기 범위가 있어야 폼이 크기를 안내할 수 있다
	for _, rootType := range info.RootDiskType {
		if !hasSizeRange(info.DiskSize, rootType) {
			t.Errorf("TENCENT DiskSize has no range for root type %s: %v", rootType, info.DiskSize)
		}
	}
}

func contains(list []string, v string) bool {
	for _, x := range list {
		if x == v {
			return true
		}
	}
	return false
}

func hasSizeRange(sizes []string, diskType string) bool {
	for _, s := range sizes {
		if strings.HasPrefix(s, diskType+"|") {
			return true
		}
	}
	return false
}
