package actions

import (
	"fmt"
	"net/http"

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

type SpecWithOpertaionId struct {
	OperationId string
	Spec        Spec
}

type ApiSet struct {
	ServiceName         string
	SpecWithOpertaionId []SpecWithOpertaionId
}

type ApiSets []ApiSet

var (
	ApiYamlSet ApiYaml
	devApiSets ApiSets
)

func init() {
	viper.SetConfigName("api")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("../mc_web_console_api/conf")

	if err := viper.ReadInConfig(); err != nil {
		panic(fmt.Errorf("fatal error reading actions/conf/api.yaml file: %s", err))
	}

	if err := viper.Unmarshal(&ApiYamlSet); err != nil {
		panic(fmt.Errorf("unable to decode into struct: %v", err))
	}

	for framework, api := range ApiYamlSet.ServiceActions {
		apiSpeces := []SpecWithOpertaionId{}
		for operationId, spec := range api {
			apiSpec := SpecWithOpertaionId{
				OperationId: operationId,
				Spec:        spec,
			}
			apiSpeces = append(apiSpeces, apiSpec)
		}
		apiSetone := ApiSet{
			ServiceName:         framework,
			SpecWithOpertaionId: apiSpeces,
		}
		devApiSets = append(devApiSets, apiSetone)
	}
}

func Devapicall(c buffalo.Context) error {
	c.Set("devApiSets", devApiSets)
	return c.Render(http.StatusOK, webconsoleRender.HTML("/pages/demo/rest/apicall"))
}
