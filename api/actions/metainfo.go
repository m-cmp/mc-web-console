package actions

import (
	"mc_web_console_api/handler"
	"mc_web_console_api/handler/self"

	"github.com/gobuffalo/buffalo"
)

func GetCompanyInfo(c buffalo.Context) error {
	companiesInfo, err := self.GetCompanyInfo()
	if err != nil {
		commonResponse := handler.CommonResponseStatusBadRequest(err.Error())
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	commonResponse := handler.CommonResponseStatusOK(companiesInfo)

	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func GetIamCompanyInfo(c buffalo.Context) error {
	companiesInfo, err := self.GetCompanyInfo()
	if err != nil {
		commonResponse := handler.CommonResponseStatusBadRequest(err.Error())
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	commonResponse := handler.CommonResponseStatusOK(companiesInfo)

	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}
