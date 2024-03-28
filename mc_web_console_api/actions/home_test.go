package actions

import "mc_web_console_api/models"

func (as *ActionSuite) TestHomeHandler() {
	res := as.HTML("/").Get()
	as.Equal(302, res.Code)
	as.Equal(res.Location(), "/auth/new")
}

func (as *ActionSuite) TestHomeHandlerLoggedIn() {
	u := &models.User{
		Email:                "mark@example.com",
		Password:             "password",
		PasswordConfirmation: "password",
	}
	verrs, err := u.Create(as.DB)
	as.NoError(err)
	as.False(verrs.HasAny())
	as.Session.Set("current_user_id", u.ID)

	res := as.HTML("/auth").Get()
	as.Equal(200, res.Code)
	as.Contains(res.Body.String(), "Sign Out")

	as.Session.Clear()
	res = as.HTML("/auth").Get()
	as.Equal(200, res.Code)
	as.Contains(res.Body.String(), "Sign In")
}
