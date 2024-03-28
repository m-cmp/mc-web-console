package actions

import (
	"mc_web_console_api/models"
)

func (as *ActionSuite) Test_Categories_New() {
	res := as.HTML("/categories/new").Get()
	as.Equal(200, res.Code)
}

func (as *ActionSuite) Test_Categories_Create() {
	count, err := as.DB.Count("categories")
	as.NoError(err)
	as.Equal(0, count)

	category := &models.Category{
		ID:               "VPC",
		CategoryName:     "VPC",
		ParentCategoryID: "SETTINGS",
		Description:      "Virtual Private Cloud",
		Sort:             1,
	}

	res := as.HTML("/categories").Post(category)
	as.Equal(302, res.Code)

	count, err = as.DB.Count("categories")
	as.NoError(err)
	as.Equal(1, count)
}
