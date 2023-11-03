package handler

import (
	"log"
	frameworkmodel "mc_web_console/frameworkmodel"
	"mc_web_console/models"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
	"github.com/gofrs/uuid"
)

// 관리를 위한 handler
// 메뉴, 공통코드, region 등...
// TODO: commonHandler와 합쳐야 하나?

func RegionGroupList(paramRegionGroup models.RegionGroup) (models.RegionGroups, frameworkmodel.WebStatus) {
	regionGroupList := []models.RegionGroup{}
	//err := models.DB.All(&regionGroupList)
	//query := models.DB.Q()

	regionGroupList, err := models.RegionGroupList(paramRegionGroup)
	if err != nil {
		log.Println("RegionGroupList err ", err)
		return nil, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	//query := models.DB.Q()

	// if providerId != "" {
	// 	query = query.Where("provider_id = ?", providerId)
	// }
	// if regionGroupName != "" {
	// 	query = query.Where("region_group_name = ?", regionGroupName)
	// }
	//err := query.All(&regionGroupList)
	// //err := query.All(&regionGroupList)
	//if err != nil {
	//	log.Println("regionGroupList err", err)
	// 	//return errors.WithStack(err)
	//	return nil, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	//}
	log.Println("regionGroupList", regionGroupList)
	return regionGroupList, frameworkmodel.WebStatus{StatusCode: 200}
}

// regionList 조건에 ID를 넣으면 1개만 조회 됨.
func GetRegionGroup(paramRegionGroup models.RegionGroup) (models.RegionGroup, frameworkmodel.WebStatus) {

	returnRegionGroup := models.RegionGroup{}

	//regionGroupList, respStatus := RegionGroupList(paramRegionGroup)
	regionGroupList, err := models.RegionGroupList(paramRegionGroup)
	if err != nil {
		log.Println("GetRegionGroup err ", err)
		return returnRegionGroup, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}
	log.Println("GetRegionGroup 1 length = ", len(regionGroupList))
	if len(regionGroupList) > 1 {
		return returnRegionGroup, frameworkmodel.WebStatus{StatusCode: 500, Message: "more than one result value"}
	}
	log.Println("GetRegionGroup 2")
	if len(regionGroupList) < 1 {
		return returnRegionGroup, frameworkmodel.WebStatus{StatusCode: 500, Message: "no results"}
	}
	log.Println("GetRegionGroup 3")
	returnRegionGroup = regionGroupList[0] // 1개만 있어야 함.
	return returnRegionGroup, frameworkmodel.WebStatus{StatusCode: 200}

	// regionGroup := models.RegionGroup{}
	// valueCount := 0
	// query := models.DB.Q()
	// if regionGroupId != "" {
	// 	query = query.Where("id = ?", regionGroupId)
	// 	valueCount++
	// }
	// if providerId != "" {
	// 	query = query.Where("provider_id = ? ", providerId)
	// 	valueCount++
	// }
	// if regionGroupName != "" {
	// 	query = query.Where("region_group_name = ? ", regionGroupName)
	// 	valueCount++
	// }

	// if valueCount == 0 {
	// 	errMsg := "There are no search conditions"
	// 	return regionGroup, frameworkmodel.WebStatus{StatusCode: 500, Message: errMsg}
	// }
	// err := query.First(&regionGroup)

	// if err != nil {
	// 	return regionGroup, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	// }
	// return regionGroup, frameworkmodel.WebStatus{StatusCode: 200}
}

func SaveRegionGroup(regionGroup *models.RegionGroup, c buffalo.Context) (models.RegionGroup, frameworkmodel.WebStatus) {
	//regionGroup := &models.RegionGroup{}

	tx := c.Value("tx").(*pop.Connection)

	vErrors, err := regionGroup.ValidateCreate(tx)
	if vErrors.HasAny() {
		log.Println("Reg RegionGroup vErrors", vErrors.Error())
		return *regionGroup, frameworkmodel.WebStatus{StatusCode: 500, Message: vErrors.Error()}
	}
	if err != nil {
		log.Println("Reg RegionGroup err", err)
		return *regionGroup, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	return *regionGroup, frameworkmodel.WebStatus{StatusCode: 200}
}

func DeleteRegionGroup(regionGroup *models.RegionGroup, c buffalo.Context) (models.RegionGroup, frameworkmodel.WebStatus) {

	tx := c.Value("tx").(*pop.Connection)

	err := regionGroup.Destroy(tx)
	if err != nil {
		log.Println("Del RegionGroup err", err)
		return *regionGroup, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	return *regionGroup, frameworkmodel.WebStatus{StatusCode: 200}
}

// 메뉴 Tree 조회
// category, menu구조를 tree형태로 쿼리
func MenuTree() (*models.MenuTree, frameworkmodel.WebStatus) {
	menuTrees := &models.MenuTree{}

	db := models.DB

	sb := strings.Builder{}

	sb.WriteString(" with recursive category_tree (category_id, category_name, parent_category_id, level, lp, sort, use_yn) as ( ")
	//-- 최상위 category
	sb.WriteString(" 	select id as category_id, category_name, parent_category_id, 0 as level, cast(id as varchar) as lp, sort, use_yn ")
	sb.WriteString(" 	from categories ")
	sb.WriteString(" 		where parent_category_id = '-' ")
	sb.WriteString(" 		union all ")
	sb.WriteString(" 		select c.id as category_id, c.category_name, c.parent_category_id, ct.level +1 as level, ct.lp || ',' || ct.category_id, c.sort, c.use_yn ")
	sb.WriteString(" 		from categories c ")
	sb.WriteString(" 		inner join category_tree ct on c.parent_category_id = ct.category_id ")
	sb.WriteString(" 	) ")
	sb.WriteString(" 	select ct.category_id, ct.category_name, ct.parent_category_id, ct.level, ct.lp ")
	sb.WriteString(" 		, COALESCE(mn.id, '-') as id, COALESCE(mn.name, '-') as name, COALESCE(COALESCE(mn.alias, mn.name), '-') as alias, COALESCE(mn.visible, true) as visible ")
	sb.WriteString(" 		, ct.sort as category_sort, COALESCE(mn.sort, -1) as menu_sort, ct.use_yn ")
	sb.WriteString(" 	from category_tree ct ")
	sb.WriteString(" 	left join menus mn ")
	//sb.WriteString(" 	on ct.category_id = mn.category_id ")// 임시주석
	sb.WriteString(" 	on ct.category_id = mn.menu_category_id ")
	sb.WriteString(" 	where ct.use_yn = true ")
	sb.WriteString(" 	order by category_sort, menu_sort ")

	q := db.RawQuery(sb.String())
	err := q.All(menuTrees)
	if err != nil {
		log.Println("menu err", err)
		return nil, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	log.Println("menuTrees", menuTrees)
	return menuTrees, frameworkmodel.WebStatus{StatusCode: 200}
}

// 임시 User 조회
func GetUserById(userId uuid.UUID) (*models.MCUser, frameworkmodel.WebStatus) {
	user := &models.MCUser{}
	//query := models.DB.Q()
	//err := query.Find(user, userId)
	err := models.DB.Find(user, userId)
	if err != nil {
		return user, frameworkmodel.WebStatus{StatusCode: 500, Message: err.Error()}
	}

	log.Println("user", user)
	return user, frameworkmodel.WebStatus{StatusCode: 200}
}
