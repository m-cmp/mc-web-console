package self

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"mc_web_console_api/handler"
	"mime/multipart"
	"net/http"
	"os"
	"strings"

	"github.com/gobuffalo/buffalo"
	"github.com/spf13/viper"
)

type Menu struct {
	Id           string `json:"id"` // for routing
	ParentMenuId string `json:"parentMenuId"`
	DisplayName  string `json:"displayName"` // for display
	IsAction     string `json:"isAction"`    // maybe need type assertion..?
	Priority     string `json:"priority"`
	Menus        Menus  `json:"menus"`
}

type Menus []Menu

func GetAllAvailableMenus(c buffalo.Context) (*Menus, error) {
	commonResponse, err := handler.AnyCaller(c, "getallavailablemenus", &handler.CommonRequest{
		PathParams: map[string]string{
			"framework": "mc-web-console",
		},
	}, true)

	if err != nil {
		return &Menus{}, err
	}
	if commonResponse.Status.StatusCode != 200 {
		return &Menus{}, fmt.Errorf(commonResponse.Status.Message)
	}

	menuListResp := commonResponse.ResponseData.([]interface{})
	menuList := &Menu{}
	for _, menuResp := range menuListResp {
		menuPart := strings.Split(menuResp.(map[string]interface{})["rsname"].(string), ":")

		menu := &Menu{
			Id:           menuPart[2],
			DisplayName:  menuPart[3],
			ParentMenuId: menuPart[4],
			Priority:     menuPart[5],
			IsAction:     menuPart[6],
		}
		menuList.Menus = append(menuList.Menus, *menu)
	}

	return &menuList.Menus, nil
}

func GetMenuTree(menuList Menus) (*Menus, error) {
	menuTree := buildMenuTree(menuList, "")
	return &menuTree, nil
}

func buildMenuTree(menus Menus, parentID string) Menus {
	var tree Menus

	for _, menu := range menus {
		if menu.ParentMenuId == parentID {
			menu.Menus = buildMenuTree(menus, menu.Id)
			tree = append(tree, menu)
		}
	}

	return tree
}

func CreateMenusByLocalMenuYaml(c buffalo.Context) error {

	yamlFile := "./conf/menu.yaml"

	file, err := os.Open(yamlFile)
	if err != nil {
		return err
	}
	defer file.Close()

	var requestBody bytes.Buffer
	writer := multipart.NewWriter(&requestBody)

	part, err := writer.CreateFormFile("yaml", "menu.yaml")
	if err != nil {
		return err
	}
	_, err = io.Copy(part, file)
	if err != nil {
		return err
	}
	err = writer.Close()
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", getCreateWebMenuByYamlEndpoint(), &requestBody)
	if err != nil {
		fmt.Printf("Error creating POST request: %s\n", err)
		return err
	}
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Add("Authorization", c.Value("Authorization").(string))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Error making POST request: %s\n", err)
		return err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Printf("Error reading response: %s\n", err)
		return err
	}

	fmt.Println("Response:", string(respBody))

	return nil
}

func getCreateWebMenuByYamlEndpoint() string {
	viper.SetConfigName("api")
	viper.SetConfigType("yaml")
	viper.AddConfigPath("./conf")
	if err := viper.ReadInConfig(); err != nil {
		log.Fatalf("Error reading config file, %s", err)
	}
	baseUrl := viper.Get("services.mc-iam-manager.baseurl").(string)
	createwebmenubyyamlUri := viper.Get("serviceActions.mc-iam-manager.Createwebmenubyyaml.resourcePath").(string)
	urlModified := strings.ReplaceAll(baseUrl+createwebmenubyyamlUri, "{framework}", "web")
	fmt.Println("Createwebmenubyyaml Endpoint is : ", urlModified)
	return urlModified
}
