package mcis

type TbInspectResourcesResponse struct {
	ResourcesOnTumblebug	[]ResourceOnTumblebug	`json:"resourcesOnTumblebug"`
	ResourcesOnCsp	[]ResourceOnCspOrSpider	`json:"resourcesOnCsp"`
	ResourcesOnSpider	[]ResourceOnCspOrSpider	`json:"resourcesOnSpider"`
}