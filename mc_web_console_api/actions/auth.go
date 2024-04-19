package actions

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gobuffalo/buffalo"

	"mc_web_console_api/actions/auth"
	"mc_web_console_api/fwmodels/webconsole"
	util "mc_web_console_api/util"
)

func AuthLogin(c buffalo.Context, commonReq *webconsole.CommonRequest) *webconsole.CommonResponse {
	commonResponse := &webconsole.CommonResponse{}
	var err error
	if util.MCIAM_USE {
		commonResponse, err = auth.AuthMcIamLogin(c, commonReq)
		if err != nil {
			log.Println(err.Error())
			return commonResponse
		}
		return commonResponse
	}
	return webconsole.CommonResponseStatusInternalServerError(nil)
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
			if auth.AuthMcIamMiddleware(c) != nil {
				res := webconsole.CommonResponseStatusStatusUnauthorized(nil)
				return c.Render(res.Status.StatusCode, r.JSON(res))
			}
			return next(c)
		} else {
			return next(c)
		}
	}
}
