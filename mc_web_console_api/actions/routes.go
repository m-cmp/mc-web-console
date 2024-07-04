package actions

import (
	"encoding/base64"
	"fmt"
	"log"
	"mc_web_console_api/handler"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/spf13/viper"
)

type Auth struct {
	Type     string `mapstructure:"type"`
	Username string `mapstructure:"username"`
	Password string `mapstructure:"password"`
}

type Service struct {
	BaseURL string `mapstructure:"baseurl"`
	Auth    Auth   `mapstructure:"auth"`
}

type Spec struct {
	Method       string `mapstructure:"method"`
	ResourcePath string `mapstructure:"resourcePath"`
	Description  string `mapstructure:"description"`
}

type ApiYaml struct {
	CLISpecVersion string                     `mapstructure:"cliSpecVersion"`
	Services       map[string]Service         `mapstructure:"services"`
	ServiceActions map[string]map[string]Spec `mapstructure:"serviceActions"`
}

var (
	ApiYamlSet ApiYaml
)

func init() {
	viper.SetConfigName("api")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("../conf")

	if err := viper.ReadInConfig(); err != nil {
		panic(fmt.Errorf("fatal error reading actions/conf/api.yaml file: %s", err))
	}

	if err := viper.Unmarshal(&ApiYamlSet); err != nil {
		panic(fmt.Errorf("unable to decode into struct: %v", err))
	}
}

func AnyController(c buffalo.Context) error {
	log.Println("#### AnyController")
	operationId := strings.ToLower(c.Param("operationId"))
	if operationId == "" {
		commonResponse := handler.CommonResponseStatusNotFound("no operationId is provided")
		return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
	}

	commonRequest := &handler.CommonRequest{}
	c.Bind(commonRequest)

	log.Printf("== operationId\t:[ %s ]\n", operationId)
	log.Printf("== commonRequest\t:\n%+v\n==\n", commonRequest)

	commonResponse, _ := AnyCaller(c, operationId, commonRequest, true)

	return c.Render(commonResponse.Status.StatusCode, r.JSON(commonResponse))
}

// AnyCaller는 buffalo.Context, operationId, commonRequest, auth유무 를 받아 conf/api.yaml 정보를 바탕으로 commonCaller를 호출합니다.
// 모든 error 는 기본적으로 commonResponse 에 담아져 반환됩니다.
func AnyCaller(c buffalo.Context, operationId string, commonRequest *handler.CommonRequest, auth bool) (*handler.CommonResponse, error) {
	targetFrameworkInfo, targetApiSpec, err := getApiSpec(operationId)
	if (err != nil || targetFrameworkInfo == Service{} || targetApiSpec == Spec{}) {
		commonResponse := handler.CommonResponseStatusNotFound(operationId + "-" + err.Error())
		return commonResponse, err
	}

	var authString string
	if auth {
		authString, err = getAuth(c, targetFrameworkInfo)
		if err != nil {
			commonResponse := handler.CommonResponseStatusBadRequest(err.Error())
			return commonResponse, err
		}
	} else {
		authString = ""
	}

	commonResponse, err := handler.CommonCaller(strings.ToUpper(targetApiSpec.Method), targetFrameworkInfo.BaseURL, targetApiSpec.ResourcePath, commonRequest, authString)
	if err != nil {
		return commonResponse, err
	}
	return commonResponse, err
}

// getApiSpec은 OpertinoId를 받아 conf/api.yaml에 정의된 Service, Spec 을 반환합니다.
// 없을경우 not found error를 반환합니다.
func getApiSpec(requestOpertinoId string) (Service, Spec, error) {
	for framework, api := range ApiYamlSet.ServiceActions {
		for opertinoId, spec := range api {
			if opertinoId == requestOpertinoId {
				return ApiYamlSet.Services[framework], spec, nil
			}
		}
	}
	return Service{}, Spec{}, fmt.Errorf("getApiSpec not found")
}

// getAuth는 컨텍스트 및 대상 서비스 정보를 받아, 옳바른 Authorization 값을 반환합니다.
// 오류의 경우 각 경우, 해당하는 오류가 반환됩니다.
// Auth 방식이 없을경우, 아무것도 반환되지 않습니다.
func getAuth(c buffalo.Context, service Service) (string, error) {
	switch service.Auth.Type {
	case "basic":
		if apiUserInfo := service.Auth.Username + ":" + service.Auth.Password; service.Auth.Username != "" && service.Auth.Password != "" {
			encA := base64.StdEncoding.EncodeToString([]byte(apiUserInfo))
			return "Basic " + encA, nil
		} else {
			return "", fmt.Errorf("username or password is empty")
		}

	case "bearer":
		if authValue, ok := c.Value("Authorization").(string); ok {
			return authValue, nil
		} else {
			return "", fmt.Errorf("authorization key does not exist or is not a string")
		}

	default:
		return "", nil
	}
}
