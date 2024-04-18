package actions

import (
	"fmt"
	"net/http"

	"github.com/gobuffalo/buffalo"

	util "mc_web_console_api/util"
)

func AuthLogin(c buffalo.Context) error {
	if util.MCIAM_USE {
		fmt.Println("MCIAM_USE")
		return c.Render(http.StatusServiceUnavailable,
			r.JSON("MCIAM_USE"))
	} else {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"err": "Auth Service Is Not Available"}))
	}
}

func AuthLogout(c buffalo.Context) error {
	if util.MCIAM_USE {
		fmt.Println("MCIAM_USE")
		return c.Render(http.StatusServiceUnavailable,
			r.JSON("MCIAM_USE"))
	} else {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"err": "Auth Service Is Not Available"}))
	}
}

func AuthGetUserInfo(c buffalo.Context) error {
	if util.MCIAM_USE {
		fmt.Println("MCIAM_USE")
		return c.Render(http.StatusServiceUnavailable,
			r.JSON("MCIAM_USE"))
	} else {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"err": "Auth Service Is Not Available"}))
	}
}

func AuthGetUserValidate(c buffalo.Context) error {
	if util.MCIAM_USE {
		fmt.Println("MCIAM_USE")
		return c.Render(http.StatusServiceUnavailable,
			r.JSON("MCIAM_USE"))
	} else {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"err": "Auth Service Is Not Available"}))
	}
}

func AuthMiddleware(next buffalo.Handler) buffalo.Handler {
	return func(c buffalo.Context) error {
		if util.MCIAM_USE {
			fmt.Println("MCIAM_USE")
			return next(c)
		} else {
			return next(c)
		}
	}
}
