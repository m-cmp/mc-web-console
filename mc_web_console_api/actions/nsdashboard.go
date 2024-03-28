package actions

import (
	"net/http"

	"github.com/gobuffalo/buffalo"
)

// DashboardGet default implementation.
func (a actions) NsDashboardGet(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.HTML("operations/nsdashboard/get.html"))
}

// DashboardList default implementation.
func (a actions) NsDashboardList(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.HTML("operations/nsdashboard/list.html"))
}

// DashboardForm default implementation.
func (a actions) NsDashboardMngForm(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.HTML("operations/nsdashboard/mngform.html"))
}
