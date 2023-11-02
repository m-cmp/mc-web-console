package actions

import (
	"mc_web_console/frameworkmodel/webtool"
	"mc_web_console/handler"
	"sync"

	"github.com/gobuffalo/buffalo/worker"
)

var w worker.Worker
var wg sync.WaitGroup

func init() {
	w = App().Worker
	w.Register("life_cycle_scheduler", LifeCycleScheduler)
}

// func TestRegisterWorker(c buffalo.Context) error {
// 	//wg := &sync.WaitGroup{}

// 	DoRegister()

//		return c.Render(http.StatusOK, r.JSON("success"))
//	}
func LifeCycleScheduler(a worker.Args) error {
	//var mcisLifeCycle *webtool.McisLifeCycle

	mcisLifeCycle := a["mcisLifeCycle"].(*webtool.McisLifeCycle)

	handler.McisLifeCycle(mcisLifeCycle)

	return nil
}

func DoWork(m *webtool.McisLifeCycle) {
	// var mcisLifeCycle *webtool.McisLifeCycle
	// mcisLifeCycle.McisID =
	// mcisLifeCycle.NameSpaceID = a["namespaceID"].(string)
	a := map[string]interface{}{
		"action":        "",
		"mcisLifeCycle": m,
	}
	w.Perform(worker.Job{
		Queue:   "defaut",
		Handler: "life_cycle_scheduler",
		Args:    a,
	})
}
