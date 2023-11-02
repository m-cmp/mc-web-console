package actions

import (
	"net/http"

	"github.com/gobuffalo/buffalo"
)

//	@Summary		Global Dashboard 폼 렌더링 : TODO
//	@Description	[GlobalDashboardGet] Global Dashboard 폼을 렌더링 합니다. GlobalDashboardMngForm default implementation.
//	@Tags			globaldashboard
//	@Produce		html
//	@Success		200	{html}	html	"operations/globaldashboard/mngform.html"
//	@Router			/operations/globaldashboard/mngform/ [get]
func (a actions) GlobalDashboardMngForm(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.HTML("operations/globaldashboard/mngform.html"))
}

func (a actions) GlobalDashboardGet(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.HTML("operations/globaldashboard/get.html"))
}

func (a actions) GlobalDashboardList(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.HTML("operations/globaldashboard/list.html"))
}
