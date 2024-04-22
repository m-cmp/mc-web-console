package mciammanager

// 사용자의 workspace 목록 조회
// mciammamager를 사용하지 않으면 default 를 return
func WorkspaceListByUser(c buffalo.Context) error {
	if util.MCIAM_USE {
		fmt.Println("MCIAM_USE")
		return c.Render(http.StatusServiceUnavailable,
			r.JSON("MCIAM_USE"))
	} else {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"err": "Auth Service Is Not Available"}))
	}
}

// workspace에 할당 된 project 목록 조회
// 미 할당 된 workspace는 default에 있음
// mciammanager를 사용하지 않으면 모든 project는 default workspace에 있다고 간주.
func ProjectListByWorkspaceId(c buffalo.Context) error {
	if util.MCIAM_USE {
		fmt.Println("MCIAM_USE")
		return c.Render(http.StatusServiceUnavailable,
			r.JSON("MCIAM_USE"))
	} else {
		return c.Render(http.StatusServiceUnavailable,
			r.JSON(map[string]string{"err": "Auth Service Is Not Available"}))
	}
}
