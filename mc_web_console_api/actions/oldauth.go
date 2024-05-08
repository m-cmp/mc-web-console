package actions

import (
	"database/sql"
	"net/http"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
	"github.com/gobuffalo/validate/v3"
	"github.com/pkg/errors"
	"golang.org/x/crypto/bcrypt"

	"mc_web_console_api/handler"
	"mc_web_console_api/models"
)

// AuthCreate attempts to log the user in with an existing account.
//
//	@Summary		로그인
//	@Description	[AuthCreate] 존재하는 계정으로 로그인을 시도합니다. attempts to log the user in with an existing account.
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Param			Email		formData	string	true	"Email"
//	@Param			Password	formData	string	true	"Password"
//	@Success		200			{string}	string	"{'message': 'success', 'user': 'u'}"
//	@Failure		500			{string}	string	"{'error':'verrs','status':'http.StatusUnauthorized'}"
//	@Router			/api/auth/signin/ [post]
func AuthCreate(c buffalo.Context) error {
	u := &models.User{}
	//spew.Dump("buffalo context : ", c)
	u.Email = c.Request().FormValue("Email")
	u.Password = c.Request().FormValue("Password")

	// if err := c.Bind(u); err != nil {
	// 	return errors.WithStack(err)
	// }

	tx := c.Value("tx").(*pop.Connection)

	// find a user with the email
	err := tx.Where("email = ?", strings.ToLower(strings.TrimSpace(u.Email))).First(u)

	// helper function to handle bad attempts
	bad := func() error {
		verrs := validate.NewErrors()
		verrs.Add("email", "invalid email/password")

		c.Set("errors", verrs)
		c.Set("user", u)

		return c.Render(http.StatusUnauthorized, r.JSON(map[string]interface{}{
			"error":  verrs,
			"status": http.StatusUnauthorized,
		}))
	}

	if err != nil {
		if errors.Cause(err) == sql.ErrNoRows {
			// couldn't find an user with the supplied email address.
			return bad()
		}
		return errors.WithStack(err)
	}

	// confirm that the given password matches the hashed password from the db
	err = bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(u.Password))
	if err != nil {
		return bad()
	}
	//_, ns := handler.GetNamespaceById(u.DefaultNamespace, tx)
	ns, _ := handler.GetNamespaceById(u.DefaultNamespace)
	c.Session().Session.Options.MaxAge = 20
	c.Session().Set("current_user_id", u.ID)
	c.Session().Set("current_namespace_id", ns.ID)
	c.Session().Set("current_namespace", ns.NsName)
	c.Session().Set("current_credential", u.DefaultCredential)
	c.Flash().Add("success", "Welcome Back to Buffalo!")

	// redirectURL := "/"
	// if redir, ok := c.Session().Get("redirectURL").(string); ok && redir != "" {
	// 	redirectURL = redir
	// }

	return c.Render(200, r.JSON(map[string]interface{}{
		"status": 200,
		"user":   u,
	}))
}

// AuthDestroy clears the session and logs a user out
//
//	@Summary		로그아웃
//	@Description	[AuthDestroy] 로그아웃을 합니다. clears the session and logs a user out
//	@Tags			auth
//	@Accept			json
//	@Produce		json
//	@Success		200	{string}	string	"{'success-Flash': 'You have been logged out!'}"
//	@Router			/api/auth/logout/ [get]
// func AuthDestroy(c buffalo.Context) error {
// 	c.Session().Clear()
// 	c.Flash().Add("success", "You have been logged out!")
// 	//return c.Redirect(302, "/auth/signin/mngform/")
// 	return RedirectTool(c, "authNewFormPath")
// }
