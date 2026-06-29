package handler

import (
	"net/http"
	"strings"

	"github.com/labstack/echo/v4"
	"mc_web_console_api/internal/model"
)

type diskLookupReq struct {
	QueryParams struct {
		Provider       string `json:"provider"`
		ConnectionName string `json:"connectionName"`
	} `json:"queryParams"`
}

type diskTypeInfo struct {
	ProviderID   string   `json:"providerId"`
	RootDiskType []string `json:"rootdisktype"`
	DiskSize     []string `json:"disksize"`
}

var diskTypeTable = []diskTypeInfo{
	{
		ProviderID:   "AWS",
		RootDiskType: []string{"standard", "gp2", "gp3"},
		DiskSize:     []string{"standard|1|1024|GB", "gp2|1|16384|GB", "gp3|1|16384|GB", "io1|4|16384|GB", "io2|4|16384|GB", "st1|125|16384|GB", "sc1|125|16384|GB"},
	},
	{
		ProviderID:   "GCP",
		RootDiskType: []string{"pd-standard", "pd-balanced", "pd-ssd", "pd-extreme"},
		DiskSize:     []string{"pd-standard|10|65536|GB", "pd-balanced|10|65536|GB", "pd-ssd|10|65536|GB", "pd-extreme|500|65536|GB"},
	},
	{
		ProviderID:   "ALIBABA",
		RootDiskType: []string{"cloud_essd", "cloud_efficiency", "cloud", "cloud_ssd"},
		DiskSize:     []string{"cloud|5|2000|GB", "cloud_efficiency|20|32768|GB", "cloud_ssd|20|32768|GB", "cloud_essd_PL0|40|32768|GB", "cloud_essd_PL1|20|32768|GB"},
	},
	{
		ProviderID:   "AZURE",
		RootDiskType: []string{"Standard_LRS", "StandardSSD_LRS", "Premium_LRS", "UltraSSD_LRS"},
		DiskSize:     []string{"Standard_LRS|1|32767|GB", "StandardSSD_LRS|1|32767|GB", "Premium_LRS|4|32767|GB", "UltraSSD_LRS|4|65536|GB"},
	},
	{
		ProviderID:   "TENCENT",
		RootDiskType: []string{"CLOUD_PREMIUM", "CLOUD_SSD"},
		DiskSize:     []string{"CLOUD_PREMIUM|10|32000|GB", "CLOUD_SSD|20|32000|GB", "CLOUD_HSSD|20|32000|GB"},
	},
	{
		ProviderID:   "NCP",
		RootDiskType: []string{"HDD", "SSD"},
		DiskSize:     []string{"HDD|10|2000|GB", "SSD|10|2000|GB"},
	},
	{
		ProviderID:   "NHN",
		RootDiskType: []string{"General HDD", "General SSD"},
		DiskSize:     []string{"General HDD|20|2048|GB", "General SSD|20|2048|GB"},
	},
	{
		ProviderID:   "IBM",
		RootDiskType: []string{"BLOCK_STORAGE"},
		DiskSize:     []string{"BLOCK_STORAGE|10|2000|GB"},
	},
}

// DiskLookup returns CSP disk type metadata for VM creation forms.
// @Summary     Disk type lookup
// @Description Lookup root disk types and size ranges by cloud provider
// @Tags        bff
// @Security    BearerAuth
// @Accept      json
// @Produce     json
// @Param       request body diskLookupReq true "Provider filter (optional)"
// @Success     200 {object} model.CommonResponse
// @Router      /api/disklookup [post]
func DiskLookup(c echo.Context) error {
	var req diskLookupReq
	if err := c.Bind(&req); err != nil {
		return err
	}

	provider := strings.TrimSpace(req.QueryParams.Provider)
	if provider == "" {
		return c.JSON(http.StatusOK, model.CommonResponseStatusOK(diskTypeTable))
	}

	upper := strings.ToUpper(provider)
	for _, info := range diskTypeTable {
		if info.ProviderID == upper {
			return c.JSON(http.StatusOK, model.CommonResponseStatusOK([]diskTypeInfo{info}))
		}
	}

	return c.JSON(http.StatusOK, model.CommonResponseStatusOK([]diskTypeInfo{}))
}
