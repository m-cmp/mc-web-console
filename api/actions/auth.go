package actions

import (
	"log"
	"mc_web_console_api/handler"
	"mc_web_console_api/handler/self"
	"mc_web_console_api/models"
	"net/http"

	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
)

// SELF AUTH

func AuthLogin(c buffalo.Context) error {
	commonRequest := &handler.CommonRequest{}
	if err := c.Bind(commonRequest); err != nil {
		commonResponse := handler.CommonResponseStatusBadRequest(err)
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	id := commonRequest.Request.(map[string]interface{})["id"].(string)
	password := commonRequest.Request.(map[string]interface{})["password"].(string)

	tokenSet, err := self.GetUserToken(id, password)
	if err != nil {
		commonResponse := handler.CommonResponseStatusBadRequest(err)
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	tx := c.Value("tx").(*pop.Connection)
	userSess := &models.Usersess{
		UserID:           id,
		AccessToken:      tokenSet.Accresstoken,
		ExpiresIn:        float64(tokenSet.ExpiresIn),
		RefreshToken:     tokenSet.RefreshToken,
		RefreshExpiresIn: float64(tokenSet.RefreshExpiresIn),
	}
	_, err = self.CreateUserSess(tx, userSess)
	if err != nil {
		commonResponse := handler.CommonResponseStatusBadRequest(err)
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	commonResponse := handler.CommonResponseStatusOK(tokenSet)
	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func AuthLoginRefresh(c buffalo.Context) error {
	log.Println("######## AuthLoginRefresh START ########")

	tx := c.Value("tx").(*pop.Connection)
	userId := c.Value("UserId").(string)
	sess, err := self.GetUserByUserId(tx, userId)
	if err != nil {
		app.Logger.Error(err.Error())
		commonResponse := handler.CommonResponseStatusBadRequest(err.Error())
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	tokenSet, err := self.RefreshAccessToken(sess.RefreshToken)
	if err != nil {
		app.Logger.Error(err.Error())
		commonResponse := handler.CommonResponseStatusBadRequest(err.Error())
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	sess.AccessToken = tokenSet.Accresstoken
	sess.ExpiresIn = float64(tokenSet.ExpiresIn)
	sess.RefreshToken = tokenSet.Accresstoken
	sess.RefreshExpiresIn = float64(tokenSet.RefreshExpiresIn)

	_, err = self.UpdateUserSess(tx, sess)
	if err != nil {
		app.Logger.Error(err.Error())
		commonResponse := handler.CommonResponseStatusBadRequest(err.Error())
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	commonResponse := handler.CommonResponseStatusOK(tokenSet)

	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func AuthLogout(c buffalo.Context) error {
	tx := c.Value("tx").(*pop.Connection)
	_, err := self.DestroyUserSessByAccesstokenforLogout(tx, c.Value("UserId").(string))
	if err != nil {
		log.Println("AuthLogout err : ", err.Error())
		commonResponse := handler.CommonResponseStatusBadRequest("no user session")
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}
	commonResponse := handler.CommonResponseStatusNoContent(nil)
	return c.Render(http.StatusOK, r.JSON(commonResponse))
}

func AuthUserinfo(c buffalo.Context) error {
	commonResponse := handler.CommonResponseStatusOK(map[string]interface{}{
		"userid":   c.Value("UserId").(string),
		"username": c.Value("UserName").(string),
		"email":    c.Value("Email").(string),
		"role":     c.Value("Role").(string),
	})
	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func AuthValidate(c buffalo.Context) error {
	commonResponse := handler.CommonResponseStatusOK(nil)
	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

// MCMP AUTH

func AuthMCIAMLogin(c buffalo.Context) error {
	commonRequest := &handler.CommonRequest{}
	c.Bind(commonRequest)

	commonResponse, _ := handler.AnyCaller(c, "login", commonRequest, false)
	if commonResponse.Status.StatusCode != 200 && commonResponse.Status.StatusCode != 201 {
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	tx := c.Value("tx").(*pop.Connection)
	_, err := self.CreateUserSessFromResponseData(tx, commonResponse, commonRequest.Request.(map[string]interface{})["id"].(string))
	if err != nil {
		return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{"error": err.Error()}))
	}

	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func AuthMCIAMLoginRefresh(c buffalo.Context) error {
	// fmt.Println("=== AuthMCIAMLoginRefresh START ===")

	// 1. CommonRequest로 바인딩
	commonRequest := &handler.CommonRequest{}
	if err := c.Bind(commonRequest); err != nil {
		// fmt.Printf("1. Binding error: %v\n", err)
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{"error": "Binding error: " + err.Error()}))
	}
	// fmt.Printf("1. CommonRequest bound: %+v\n", commonRequest)

	// 2. Request 데이터 확인
	if commonRequest.Request == nil {
		// fmt.Println("2. ERROR: Request data is missing")
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{"error": "Request data is missing"}))
	}

	// 3. Request 데이터 타입 변환
	requestData, ok := commonRequest.Request.(map[string]interface{})
	if !ok {
		// fmt.Printf("3. ERROR: Invalid request format, expected map[string]interface{}, got %T\n", commonRequest.Request)
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{"error": "Invalid request format"}))
	}
	// fmt.Printf("3. Request data converted: %+v\n", requestData)

	// 4. refresh_token 확인
	_, hasRefreshToken := requestData["refresh_token"]
	if !hasRefreshToken {
		// fmt.Println("4. ERROR: refresh_token not found in request")
		return c.Render(http.StatusBadRequest, r.JSON(map[string]interface{}{"error": "refresh_token is required"}))
	}
	// fmt.Printf("4. Refresh token found: %s\n", refreshToken)

	// 6. 데이터베이스 트랜잭션 시작
	tx := c.Value("tx").(*pop.Connection)
	// fmt.Println("6. Database transaction started")

	var refreshRes *handler.CommonResponse
	var err error

	// 7. mc-iam-manager 호출 준비
	// fmt.Println("7. Preparing to call mc-iam-manager with 'loginrefresh' action")

	if commonRequest.Request != nil {
		// fmt.Printf("7a. Request data is not nil, calling AnyCaller...\n")
		refreshRes, err = handler.AnyCaller(c, "loginrefresh", commonRequest, false)
		// fmt.Printf("7b. AnyCaller result - refreshRes: %+v, err: %v\n", refreshRes, err)

		if err != nil {
			// fmt.Printf("7c. AnyCaller error: %v\n", err)
			return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{"error": "AnyCaller error: " + err.Error()}))
		}
	} else {
		// fmt.Println("7a. Request data is nil, getting userId from context...")
		userId := c.Value("UserId")
		if userId == nil {
			// fmt.Println("7b. ERROR: UserId not found in context")
			return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{"error": "UserId not found in context"}))
		}
		// fmt.Printf("7b. UserId found: %s\n", userId)

		sess, err := self.GetUserByUserId(tx, userId.(string))
		if err != nil {
			// fmt.Printf("7c. GetUserByUserId error: %v\n", err)
			return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{"error": err.Error()}))
		}
		// fmt.Printf("7c. User session found: %+v\n", sess)

		commonRequest.Request = map[string]interface{}{"refresh_token": sess.RefreshToken}
		// fmt.Printf("7d. Updated CommonRequest: %+v\n", commonRequest)

		refreshRes, err = handler.AnyCaller(c, "loginrefresh", commonRequest, false)
		// fmt.Printf("7e. AnyCaller result - refreshRes: %+v, err: %v\n", refreshRes, err)

		if err != nil {
			// fmt.Printf("7f. AnyCaller error: %v\n", err)
			return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{"error": "AnyCaller error: " + err.Error()}))
		}
	}

	// 8. 응답 검증
	// fmt.Println("8. Validating response...")

	// ResponseData가 nil인지 확인
	if refreshRes == nil {
		// fmt.Println("8a. ERROR: Response is nil from AnyCaller")
		return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{"error": "Response is nil from AnyCaller"}))
	}
	// fmt.Printf("8a. Response is not nil: %+v\n", refreshRes)

	if refreshRes.Status.StatusCode != 200 {
		// fmt.Printf("8b. ERROR: Status code is not 200: %d, message: %s\n", refreshRes.Status.StatusCode, refreshRes.Status.Message)

		// Frontend가 기대하는 CommonResponse 형태로 에러 응답 구성
		errorResponse := &handler.CommonResponse{
			ResponseData: refreshRes.ResponseData,
			Status: handler.WebStatus{
				StatusCode: refreshRes.Status.StatusCode,
				Message:    refreshRes.Status.Message,
			},
		}

		return c.Render(refreshRes.Status.StatusCode, r.JSON(errorResponse))
	}
	// fmt.Printf("8b. Status code is 200: %s\n", refreshRes.Status.Message)

	// ResponseData가 nil인지 확인
	if refreshRes.ResponseData == nil {
		// fmt.Println("8c. ERROR: ResponseData is nil from AnyCaller")
		return c.Render(http.StatusInternalServerError, r.JSON(map[string]interface{}{"error": "ResponseData is nil from AnyCaller"}))
	}
	// fmt.Printf("8c. ResponseData is not nil: %+v\n", refreshRes.ResponseData)

	// 9. 응답 데이터 타입 확인
	// fmt.Printf("9. ResponseData type: %T\n", refreshRes.ResponseData)

	// 10. 최종 응답 반환
	// fmt.Println("10. Returning successful response")
	// fmt.Println("=== AuthMCIAMLoginRefresh END ===")

	// 정상 함수들과 동일한 패턴으로 응답 생성
	commonResponse := handler.CommonResponseStatusOK(refreshRes.ResponseData)

	// 디버깅을 위한 로그 추가
	// fmt.Printf("10a. Final response structure: %+v\n", commonResponse)
	// fmt.Printf("10b. ResponseData content: %+v\n", commonResponse.ResponseData)

	// JSON 직렬화 테스트
	// jsonBytes, _ := json.Marshal(commonResponse)
	// fmt.Printf("10c. JSON serialized: %s\n", string(jsonBytes))

	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

func AuthMCIAMLogout(c buffalo.Context) error {
	tx := c.Value("tx").(*pop.Connection)
	rt, err := self.DestroyUserSessByAccesstokenforLogout(tx, c.Value("UserId").(string))
	if err != nil {
		commonResponse := handler.CommonResponseStatusBadRequest(err.Error())
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}
	commonRequest := &handler.CommonRequest{
		Request: map[string]string{
			"refresh_token": rt,
		},
	}
	commonResponse, _ := handler.AnyCaller(c, "logout", commonRequest, true)
	return c.Render(http.StatusOK, r.JSON(commonResponse))
}

func AuthMCIAMUserinfo(c buffalo.Context) error {
	commonRequest := &handler.CommonRequest{}
	commonResponse, _ := handler.AnyCaller(c, "getuserinfo", commonRequest, true)
	return c.Render(200, r.JSON(commonResponse))
}

func AuthMCIAMValidate(c buffalo.Context) error {
	commonRequest := &handler.CommonRequest{}
	c.Bind(commonRequest)
	commonResponse, _ := handler.AnyCaller(c, "authgetuservalidate", commonRequest, true)
	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}
