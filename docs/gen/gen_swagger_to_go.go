// package main

// import (
// 	"fmt"
// 	"io/ioutil"
// 	"log"
// )

// func main() {
// 	// Swagger JSON 파일명
// 	swaggerJSONFile := "tb_swagger.json"

// 	// Swagger JSON 파일을 읽기
// 	swaggerJSON, err := ReadSwaggerJSON(swaggerJSONFile)
// 	if err != nil {
// 		log.Fatalf("Error reading Swagger JSON: %v", err)
// 	}

// 	// Swagger JSON 내용 출력 (테스트용)
// 	fmt.Println("Swagger JSON Contents:")
// 	fmt.Println(swaggerJSON)
// }

// // ReadSwaggerJSON 함수는 Swagger JSON 파일을 읽어서 문자열로 반환합니다.
// func ReadSwaggerJSON(filename string) (string, error) {
// 	// 파일 읽기
// 	data, err := ioutil.ReadFile(filename)
// 	if err != nil {
// 		return "", err
// 	}

// 	// 읽은 데이터를 문자열로 변환하여 반환
// 	return string(data), nil
// }

package main

import (
	"encoding/json"
	"errors"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/davecgh/go-spew/spew"
	"gopkg.in/yaml.v2" // go-yaml 패키지를 사용합니다.
)

// go run main.go -file your-swagger.yaml
// go run gen_swagger_to_go.go -file tb_swagger_v0.5.0.yaml
func main() {

	// yamlData1 := `
	// - default: ns01
	//   description: Namespace ID
	//   in: path
	//   name: nsId
	//   required: true
	//   type: string
	// - description: Resource Type
	//   in: path
	//   name: resourceType
	//   required: true
	//   type: string
	// - description: Resource ID
	//   in: path
	//   name: resourceId
	//   required: true
	//   type: string
	// `

	// var data []map[string]interface{}
	// err := yaml.Unmarshal([]byte(yamlData1), &data)
	// if err != nil {
	// 	fmt.Println("YAML 파싱 오류:", err)
	// 	return
	// }

	// // JSON으로 변환
	// jsonData, err := json.Marshal(data)
	// if err != nil {
	// 	fmt.Println("JSON 변환 오류:", err)
	// 	return
	// }

	// // JSON 데이터 출력
	// fmt.Println(string(jsonData))

	// YAML 파일명을 입력받기 위한 플래그 정의
	var yamlFile string
	flag.StringVar(&yamlFile, "file", "", "YAML 파일 경로를 입력하세요.")
	flag.Parse()

	// 입력된 YAML 파일명이 없는 경우 에러 출력
	if yamlFile == "" {
		fmt.Println("Usage: go run main.go -file <YAML 파일 경로>")
		return
	}

	// YAML 파일 읽기
	yamlData, err := ioutil.ReadFile(yamlFile)
	if err != nil {
		log.Fatalf("YAML 파일을 읽는 중 오류 발생: %v", err)
	}

	// version 추출
	sourceVersion := "v1"
	log.Printf("sourceVersion: %s\n", sourceVersion)
	// // YAML 데이터 파싱
	// var data interface{}
	// if err := yaml.Unmarshal(yamlData, &data); err != nil {
	// 	log.Fatalf("YAML 데이터 파싱 중 오류 발생: %v", err)
	// }

	// // 파싱된 데이터 출력 (테스트용)
	// fmt.Printf("YAML 데이터:\n%v\n", data)

	// YAML 데이터 파싱
	var swaggerData map[string]interface{}
	if err := yaml.Unmarshal(yamlData, &swaggerData); err != nil {
		log.Fatalf("YAML 데이터 파싱 중 오류 발생: %v", err)
	}

	// basePath 추출
	basePath, err := extractBasePath(swaggerData)
	if err != nil {
		log.Fatalf("basePath 추출 중 오류 발생: %v", err)
	}
	log.Printf("BasePath: %s\n", basePath)

	//extractStepPaths(basePath, swaggerData)
	extractStepPathsYaml(basePath, swaggerData)

	//deprecated : extractStepModel(basePath, swaggerData) -> extractStepModel_old 로 변경. for문 돌면서 하나씩 만들도록 함.

	// modelCount := 0
	// for name := range swaggerData["definitions"].(map[interface{}]interface{}) {
	// 	structName := name.(string)
	// 	log.Print("sourceVersion", sourceVersion)
	// 	log.Print(structName)
	// 	structDefinition, ok := swaggerData["definitions"].(map[interface{}]interface{})[structName]
	// 	if !ok {
	// 		log.Fatalf("%s의 정의를 찾을 수 없습니다.", structDefinition)
	// 	}

	// 	packageName, fileName := extractPackageAndFileName(structName)
	// 	log.Print("*** packageName ", packageName)
	// 	log.Print("*** fileName ", fileName)
	// 	// if fileName != "JSONResult" {
	// 	// 	continue
	// 	// }
	// 	//basePath string, fileName string, packageName string, structName string, structDefinition interface{}) (string, error) {
	// 	fileContent, err := extractStepModel(basePath, fileName, packageName, structName, structDefinition)
	// 	if err != nil {
	// 		log.Fatalf(" 파일 생성 오류 : %v", fileName)
	// 		log.Fatalf(err.Error())
	// 	}

	// 	if fileContent != "" {
	// 		//basePath string, packageName string, fileName string, goFileContent string, version string
	// 		generateModelFile(basePath, packageName, strings.Title(fileName), fileContent, sourceVersion)
	// 		modelCount++
	// 	} else {
	// 		log.Fatalf("file content empty", fileName)
	// 	}
	// }
	// log.Print(" %d 개의 파일이 만들어 졌습니다.", modelCount)

	// properties에 정의된 모델 구조체 생성
	// models, err := generateModels(swaggerData)
	// if err != nil {
	// 	log.Fatalf("모델 구조체 생성 중 오류 발생: %v", err)
	// }

	// "common.ConfigInfo"의 정의 추출
	// configInfoDefinition, ok := swaggerData["definitions"].(map[interface{}]interface{})["common.ConfigInfo"]
	// if !ok {
	// 	log.Fatalf("common.ConfigInfo의 정의를 찾을 수 없습니다.")
	// }

	// Golang struct로 변환
	// configInfoStruct := generateStructFromDefinition(configInfoDefinition.(map[interface{}]interface{}))
	// fmt.Println("ConfigInfo Golang Struct:")
	// fmt.Println(configInfoStruct)

	// // "common.ConfigInfo"와 "common.ConfigReq"의 정의 추출
	// configInfoDefinition, ok1 := swaggerData["definitions"].(map[interface{}]interface{})["common.ConfigInfo"]
	// configReqDefinition, ok2 := swaggerData["definitions"].(map[interface{}]interface{})["common.ConfigReq"]
	// if !ok1 || !ok2 {
	// 	log.Fatalf("common.ConfigInfo 또는 common.ConfigReq의 정의를 찾을 수 없습니다.")
	// }

	// // "common" 패키지 아래의 Go 파일 생성
	// //generateGoFile("common", "config_info.go", configInfoDefinition.(map[interface{}]interface{}))
	// //generateGoFile("common", "config_req.go", configReqDefinition.(map[interface{}]interface{}))

	// generateGoFile(basePath, "common", "config_info.go", configInfoDefinition.(map[interface{}]interface{}))
	// generateGoFile(basePath, "common", "config_req.go", configReqDefinition.(map[interface{}]interface{}))
	// fmt.Println("Go 파일이 생성되었습니다.")

	//fmt.Println("Go 파일이 생성되었습니다.")
}

/*
// 1. basePath : 기본 package이름이다. 여기 아래에 생성된다.
// 2. definitions 는 model struct를 정의한 것이다.
//		package명.파일명 아래에 properties와 type이 있다.
//		type은 기본형 ( string, int, bool )
//		type은 Object 형
//		type은 Array 형 이 있다.
//		properties 아래에 property명과 type 이 있다.
*/
func extractStepModel(basePath string, fileName string, packageName string, structName string, structDefinition interface{}) (string, error) {
	//-- definitions를 돌면서 1개씩 structure를 만든다.
	// TODO1 : property에서 package가 다른경우에는 package.파일명이되어야한다.
	// TODO2 : respAPI를 호출하는 struct 생성해야한다.

	structPropertyList, err := extractStructProperties(packageName, structDefinition.(map[interface{}]interface{}))
	if err != nil { // property가 없더라도 진행시켜~
		// JSONResult의 경우 dummy struct로 property가 없음.
		log.Print("no struct property Definition")
		//log.Fatalf(err.Error())
		//return "", err
	}

	// file package
	// file struct definition
	// file properties
	goFileContent := fmt.Sprintf("package %s\n\n", packageName)

	// import 영역
	//importContent := ""
	importContent := "import ( \n"
	importCount := 0
	for _, refProperty := range structPropertyList {
		if refProperty.Type != "string" || refProperty.Type != "int" {
			if refProperty.ItemPackage != "" {
				if packageName != refProperty.ItemPackage {
					//tbcommon "mc_web_console/frameworkmodel/tumblebug/common"
					importContent += "\t" + "\"" + basePath + "/" + refProperty.ItemPackage + "\n"
					importCount++
				}
			}
			// 		//basePath
			// 		// package명이 같으면 그대로
			// 		// package명이 다르면 package명 포함
			// 		// tbcommon "mc_web_console/frameworkmodel/tumblebug/common" :// target 경로를 포함해야하네?
			// 		//importContent += "type " + strings.Title(fileName) + " struct {\n"
		}
	}
	importContent += ") \n"
	if importCount > 0 {
		goFileContent += importContent
	}

	// struct 정의 영역 시작
	goFileContent += "type " + strings.Title(fileName) + " struct {\n"

	// property 영역
	propertyContent := ""
	for _, property := range structPropertyList {
		spew.Dump(property)
		// package명이 같으면 그대로
		// package명이 다르면 package명 포함
		propertyType := property.Type
		if property.Items != "" && packageName != property.ItemPackage {
			propertyType = property.ItemPackageFileName
		}
		propertyContent += "\t" + property.Name + "\t" + propertyType + "\t" + "`json:\"" + property.JsonName + "\"`" + "\n"
	}
	goFileContent += propertyContent

	// struct 정의 영역 종료
	goFileContent += "}"

	// log.Printf(propertyContent)
	// log.Print("!!!!!!!!!!!!!!!!!!!!")
	// log.Printf(importContent)
	// log.Print("xxxxxxxxxxxxxxxxxxxx")
	// log.Printf(goFileContent)

	return goFileContent, nil
}

// func extractStepModel_old(basePath string, swaggerData map[string]interface{}) {
// 	//-- definitions를 돌면서 1개씩 structure를 만든다.
// 	// TODO1 : property에서 package가 다른경우에는 package.파일명이되어야한다.
// 	// TODO2 : respAPI를 호출하는 struct 생성해야한다.
// 	for name := range swaggerData["definitions"].(map[interface{}]interface{}) {
// 		structName := name.(string)
// 		log.Print(structName)
// 		structDefinition, ok := swaggerData["definitions"].(map[interface{}]interface{})[structName]
// 		if !ok {
// 			log.Fatalf("%s의 정의를 찾을 수 없습니다.", structDefinition)
// 		}

// 		//log.Print(structDefinition)
// 		packageName, fileName := extractPackageAndFileName(structName)
// 		log.Print("*** packageName ", packageName)
// 		log.Print("*** fileName ", fileName)
// 		structPropertyList, err := extractStructProperties(packageName, structDefinition.(map[interface{}]interface{}))
// 		if err != nil {
// 			continue
// 		}

// 		// file package
// 		// file struct definition
// 		// file properties
// 		goFileContent := fmt.Sprintf("package %s\n\n", packageName)

// 		// import 영역
// 		//importContent := ""
// 		importContent := "import ( \n"
// 		for _, refProperty := range structPropertyList {
// 			if refProperty.Type != "string" || refProperty.Type != "int" {
// 				if refProperty.ItemPackage != "" {
// 					if packageName != refProperty.ItemPackage {
// 						//tbcommon "mc_web_console/frameworkmodel/tumblebug/common"
// 						importContent += "\t" + "\"" + basePath + "/" + refProperty.ItemPackage + "\n"
// 					}
// 				}
// 				// 		//basePath
// 				// 		// package명이 같으면 그대로
// 				// 		// package명이 다르면 package명 포함
// 				// 		// tbcommon "mc_web_console/frameworkmodel/tumblebug/common" :// target 경로를 포함해야하네?
// 				// 		//importContent += "type " + strings.Title(fileName) + " struct {\n"
// 			}
// 		}
// 		importContent += ") \n"
// 		goFileContent += importContent

// 		// struct 정의 영역 시작
// 		goFileContent += "type " + strings.Title(fileName) + " struct {\n"

// 		// property 영역
// 		propertyContent := ""
// 		for _, property := range structPropertyList {
// 			spew.Dump(property)
// 			// package명이 같으면 그대로
// 			// package명이 다르면 package명 포함
// 			propertyType := property.Type
// 			if property.Items != "" && packageName != property.ItemPackage {
// 				propertyType = property.ItemPackageFileName
// 			}
// 			propertyContent += "\t" + property.Name + "\t" + propertyType + "\t" + "`json:\"" + property.JsonName + "\"`" + "\n"
// 		}
// 		goFileContent += propertyContent

// 		// struct 정의 영역 종료
// 		goFileContent += "}"

// 		// 만들자.
// 		//generateGoFile(basePath, packageName, fileName, structDefinition.(map[interface{}]interface{}))
// 		log.Printf(propertyContent)
// 		log.Print("!!!!!!!!!!!!!!!!!!!!")
// 		log.Printf(importContent)
// 		log.Print("xxxxxxxxxxxxxxxxxxxx")
// 		log.Printf(goFileContent)

// 		// if true {
// 		// 	break
// 		// }
// 		generateModelFile(basePath, packageName, strings.Title(fileName), goFileContent, "v1")
// 	}
// }

/*
host: localhost:1323
info:

	contact:
	  email: contact-to-cloud-barista@googlegroups.com
	  name: API Support
	  url: http://cloud-barista.github.io
	description: CB-Tumblebug REST API
	license:
	  name: Apache 2.0
	  url: http://www.apache.org/licenses/LICENSE-2.0.html
	title: CB-Tumblebug REST API
	version: latest
*/
func extractStepHost(basePath string, swaggerData map[string]interface{}) {

}

type StructHandleFunction struct {
	Path   string
	Method string
}

/*
// 경로와 GET/POST 등의 method 정보
*/
func extractStepPaths(basePath string, swaggerData map[string]interface{}) ([]StructHandleFunction, error) {
	var handleFunctionList []StructHandleFunction

	//structPropertyList, err := extractStructProperties(packageName, structDefinition.(map[interface{}]interface{}))
	//propertiesMap, ok := definition["properties"].(map[interface{}]interface{})
	//definition map[interface{}]interface{}
	log.Print("step1")
	pathMap, ok := swaggerData["paths"].(map[interface{}]interface{})
	if !ok {
		log.Fatalf("%s의 정의를 찾을 수 없습니다.", handleFunctionList)
		return nil, errors.New("aaa")
	}
	log.Print("step2")
	// log.Print(pathMap)
	// getMap, ok := pathMap["get"].(map[interface{}]interface{})
	// if !ok {
	// 	log.Fatalf("down")
	// 	return handleFunctionList, errors.New("get")
	// }
	// log.Print("getMap ", getMap)

	for pathKey, pathVal := range pathMap {
		log.Print("pathKey ", pathKey)

		if pathKey != "/{nsId}/checkResource/{resourceType}/{resourceId}" {
			continue
		}

		//log.Print("pathVal ", pathVal)
		methodMap, ok := pathVal.(map[interface{}]interface{})
		if !ok {
			// value를 맵으로 형변환할 수 없는 경우, 오류 처리
			log.Printf("값을 맵으로 형변환할 수 없습니다: %v\n", pathVal)
			continue // 다음 요소로 이동
		}

		for methodKey, methodVal := range methodMap {
			log.Print("methodKey ", methodKey)
			log.Print("methodVal ", methodVal)

			methodValMap, ok := methodVal.(map[interface{}]interface{})
			if !ok {
				// value를 맵으로 형변환할 수 없는 경우, 오류 처리
				log.Printf("값을 맵으로 형변환할 수 없습니다: %v\n", methodVal)
				continue // 다음 요소로 이동
			}

			log.Print("------------------------")
			// var maps []map[interface{}]interface{}
			// itemMap := make(map[interface{}]interface{})
			// for key, value := range methodValMap {
			// 	itemMap[key] = value
			// }
			// maps = append(maps, itemMap)

			// // 슬라이스 안의 맵 출력
			// for i, itemMap := range maps {
			// 	fmt.Printf("맵 %d:\n", i+1)
			// 	for key, value := range itemMap {
			// 		fmt.Printf("%v: %v\n", key, value)
			// 	}
			// 	fmt.Println()
			// }

			for propertyKey, propertyVal := range methodValMap {
				log.Print("propertyKey ", propertyKey)
				log.Print("propertyVal ", propertyVal)

				if propertyKey == "consumes" {
					// application/json
				}

				if propertyKey == "description" {

				}

				if propertyKey == "parameters" {
					log.Print("--------parameters----------------")

					// switch v := propertyVal.(type) {
					// default:
					// 	log.Print(v)
					// }
					// //itemMap, ok := propertyVal.(map[interface{}]interface{})
					// //itemMap, ok := propertyVal.(map[string]interface{})
					// str, ok := propertyVal.(string)
					// log.Print("str ", str)
					// if !ok {
					// 	// value를 맵으로 형변환할 수 없으면
					// 	log.Printf("값을 string으로 형변환할 수 없습니다: %v\n", propertyVal)
					// 	//log.Print(propertyVal.(type) )
					// 	continue // 다음 요소로 이동
					// } else {
					// 	itemMap, ok := propertyVal.(map[string]interface{})
					// 	if !ok {
					// 		log.Printf("값을 맵으로 형변환할 수 없습니다: %v\n", propertyVal)
					// 	}
					// 	log.Print("itemMap ", itemMap)
					// 	for itemKey, itemVal := range itemMap {

					// 		log.Print("itemKey ", itemKey)
					// 		log.Print("itemVal ", itemVal)
					// 	}
					// 	//log.Print("str ", str)
					// }
				}
			}
			// 	//switch v := propertyVal.(type) {
			// 	//}

			// 	// itemMap, ok := propertyVal.(map[interface{}]interface{})
			// 	// if !ok {
			// 	// 	// value를 맵으로 형변환할 수 없으면
			// 	// 	log.Printf("값을 맵으로 형변환할 수 없습니다: %v\n", propertyVal)
			// 	// 	//log.Print(propertyVal.(type) )
			// 	// 	continue // 다음 요소로 이동
			// 	// } else {
			// 	// 	for itemKey, itemVal := range itemMap {

			// 	// 		log.Print("itemKey ", itemKey)
			// 	// 		log.Print("itemVal ", itemVal)
			// 	// 	}
			// 	// }

			// }

			if true {
				break
			}
		}

		if true {
			break
		}
	}

	// for key, value := range pathMap {
	// 	handleFunction := StructHandleFunction{}

	// 	keyStr, ok := key.(string)
	// 	if !ok {
	// 		log.Printf("키를 문자열로 형변환할 수 없습니다: %v\n", key)
	// 		continue // 다음 요소로 이동
	// 	}
	// 	log.Print("keyStr ", keyStr)

	// 	// valueMap, ok := value.(map[interface{}]interface{})
	// 	// if !ok {
	// 	// 	log.Printf("value값을 맵으로 형변환할 수 없습니다: %v\n", value)
	// 	// 	continue // 다음 요소로 이동
	// 	// }
	// 	// log.Print("value ", valueMap)

	// 	getMap, ok := value.(map[interface{}]interface{})["get"]
	// 	if !ok {
	// 		log.Printf("get값을 맵으로 형변환할 수 없습니다: %v\n", value)
	// 		continue // 다음 요소로 이동
	// 	}
	// 	log.Print("getMap ", getMap)

	// 	handleFunctionList = append(handleFunctionList, handleFunction)

	// 	if true {
	// 		break
	// 	}
	// }
	// for pathKey, pathVal := range pathMap {
	// 	// pathKeyName := pathKey.(string)
	// 	// log.Print(pathKeyName)

	// 	pathStr, ok := pathKey.(string)
	// 	if !ok {
	// 		log.Printf("키를 문자열로 형변환할 수 없습니다: %v\n", pathKey)
	// 		continue // 다음 요소로 이동
	// 	}

	// 	valueMap, ok := pathVal.(map[interface{}]interface{})
	// 	if !ok {
	// 		log.Printf("value값을 맵으로 형변환할 수 없습니다: %v\n", pathVal)
	// 		continue // 다음 요소로 이동
	// 	}

	// 	log.Println("path ", pathStr)
	// 	log.Println("valueMap ", valueMap)

	// }
	return handleFunctionList, nil
}

func extractStepPathsYaml(basePath string, swaggerData map[string]interface{}) ([]StructHandleFunction, error) {
	var handleFunctionList []StructHandleFunction

	//structProp
	// log.Print("step1")
	// pathMap, ok := swaggerData["paths"].(map[interface{}]interface{})
	// if !ok {
	// 	log.Fatalf("%s의 정의를 찾을 수 없습니다.", handleFunctionList)
	// 	return nil, errors.New("aaa")
	// }
	// log.Print("step2")

	//var api API
	//jsonData, err := json.Marshal(swaggerData, &api)
	paths, ok := swaggerData["paths"].(map[interface{}]interface{})
	if !ok {
		return nil, errors.New("sss")
	}
	jsonData, err := json.Marshal(paths.(map[string]interface{}))
	if err != nil {
		fmt.Println("JSON 변환 오류:", err)
		return nil, err
	}
	// for pathKey, pathVal := range pathMap {

	// }
	log.Print(jsonData)
	return handleFunctionList, nil
}

type YamlParameter struct {
	Description string `yaml:"description"`
	In          string `yaml:"in"`
	Name        string `yaml:"name"`
	Required    bool   `yaml:"required"`
	Type        string `yaml:"type"`
}

type YamlResponse struct {
	Description string `yaml:"description"`
	Schema      struct {
		Ref string `yaml:"$ref"`
	} `yaml:"schema"`
}

type YamlPath struct {
	Get    *YamlMethod `yaml:"get"`
	Post   *YamlMethod `yaml:"post"`
	Delete *YamlMethod `yaml:"delete"`
}

type YamlMethod struct {
	Consumes    []string                `yaml:"consumes"`
	Description string                  `yaml:"description"`
	Parameters  []YamlParameter         `yaml:"parameters"`
	Produces    []string                `yaml:"produces"`
	Responses   map[string]YamlResponse `yaml:"responses"`
	Summary     string                  `yaml:"summary"`
	Tags        []string                `yaml:"tags"`
}
type HostInfo struct {
	//Contact    ContactInfo `yaml:"contact"`
	Description string `yaml:"description"`
	//License     LicenseInfo `yaml:"license"`
	Title   string `yaml:"title"`
	Version string `yaml:"version"`
}
type YamlPaths map[string]YamlPath

type API struct {
	YamlPaths YamlPaths `yaml:"paths"`
}

type SwaggerData struct {
	Host  string              `yaml:"host"`
	Info  HostInfo            `yaml:"info"`
	Paths map[string]YamlPath `yaml:"paths"`
}

// model 파일들 생성
func generateModelFile(basePath string, packageName string, fileName string, goFileContent string, version string) {
	// 에러 로그 파일 생성 또는 열기 (기존 로그를 덮어쓰지 않음)
	// logFilePath := "error.log"
	// logFile, err := openOrCreateLogFile(logFilePath)
	// if err != nil {
	// 	log.Printf("에러 로그 파일을 열거나 생성하는 중 오류 발생: %v\n", err)
	// 	return
	// }
	// defer logFile.Close()
	// // 로그 출력을 파일로 설정
	// log.SetOutput(logFile)

	// Go 파일 저장
	//err := ioutil.WriteFile(fileName, []byte(goFileContent), 0644)
	destPath := "." + basePath + "/model/" + version + "/" + packageName + "/" + fileName + ".go"
	log.Print("basePath ", basePath)
	log.Print(destPath)

	// 파일 저장 폴더가 없으면 생성
	dirPath := filepath.Dir(destPath)
	if _, err := os.Stat(dirPath); os.IsNotExist(err) {
		if err := os.MkdirAll(dirPath, 0755); err != nil {
			log.Fatalf("폴더를 생성하는 중 오류 발생: %v", err)
		}
	}

	//err = ioutil.WriteFile(destPath+"/"+fileName+".go", []byte(goFileContent), 0644)
	err := ioutil.WriteFile(destPath, []byte(goFileContent), 0644)
	if err != nil {
		log.Fatalf("Go 파일을 저장하는 중 오류 발생: %v", err)
	}
	//log.Print(goFileContent)
}

// struct 변수에 들어가는 내용 정의
type StructProperty struct {
	Name                string // json으로 넘어오는 변수 이름에서 첫글자 대문자
	JsonName            string // json으로 넘어오는 변수 이름
	Type                string
	Description         string
	Items               string // type이 array일 때 사용 됨.
	ItemPackage         string // ref의 packageName. 동일 package에 있는지 다른데있는지 여부 확인을 위해 필요
	ItemPackageFileName string // ref의 package를 포함한 파일명 -> import 구문에서 사용
	ItemFileName        string // ref의 package를 제외한 순수 파일명 -> data type에서 사용
	Limit               string
	Example             string
	Priority            string
}

// file명에 package가 없는 경우 fileName만 return, 있으면 package와 fileName 분리하여 return
func extractPackageAndFileName(input string) (packageName, fileName string) {
	parts := strings.Split(input, ".")
	if len(parts) > 1 {
		packageName = parts[0]
		fileName = parts[1]
	} else {
		fileName = parts[0]
	}
	return packageName, fileName
}

func extractBasePath(swaggerData map[string]interface{}) (string, error) {
	// Swagger 스펙에서 basePath를 추출하는 로직을 작성하세요.
	// Swagger 스펙에 따라 basePath의 위치 및 형식이 다를 수 있습니다.
	// 이 예제에서는 "basePath" 키를 직접 추출하는 방식으로 작성하였습니다.
	basePath, ok := swaggerData["basePath"].(string)
	if !ok {
		return "", fmt.Errorf("basePath를 찾을 수 없습니다")
	}
	return basePath, nil
}

// struct 정의 추출
/*
common.ConnConfig:
    properties:
      configName:
        type: string
      credentialName:
        type: string
      driverName:
        type: string
      location:
        $ref: '#/definitions/common.GeoLocation'
      providerName:
        type: string
      regionName:
        type: string
    type: object
*/
func extractStructProperties(packageName string, definition map[interface{}]interface{}) ([]StructProperty, error) {
	//propertyList := []StructProperty{}
	var propertyList []StructProperty
	// package명 추출
	// file명 추출
	// properties의 type 에 따라 추출로직

	propertiesMap, ok := definition["properties"].(map[interface{}]interface{})
	if !ok {
		return propertyList, errors.New("properties")
	}
	log.Print("*** begin")
	for key, value := range propertiesMap {
		property := StructProperty{}

		keyStr, ok := key.(string)
		if !ok {
			log.Printf("키를 문자열로 형변환할 수 없습니다: %v\n", key)
			continue // 다음 요소로 이동
		}

		valueMap, ok := value.(map[interface{}]interface{})
		if !ok {
			log.Printf("value값을 맵으로 형변환할 수 없습니다: %v\n", value)
			continue // 다음 요소로 이동
		}

		log.Print("--- keyStr ---")
		log.Print(keyStr)
		property.Name = strings.Title(keyStr) // 첫글자 대문자로
		property.JsonName = keyStr

		log.Print(valueMap)
		_, typeExists := valueMap["type"]
		if !typeExists {
			//log.Printf("type 키가 없습니다.")
		}

		_, refExists := valueMap["$ref"]
		if !refExists {
			//log.Printf("ref 키가 없습니다.")
		}

		typeStr := ""
		if typeExists {
			typeStr = valueMap["type"].(string)
			log.Print("--- typeStr ---")
			log.Print(typeStr)

			if typeStr == "string" { // type이 기본형인지
				property.Type = typeStr

			} else if typeStr == "object" { // type이 object인지

			} else if typeStr == "array" { // type이 array인지
				//log.Print(valueMap)
				//items := valueMap["items"]
				itemMap, ok := valueMap["items"].(map[interface{}]interface{})
				if !ok {
					log.Printf("item값을 맵으로 형변환할 수 없습니다")
				}
				log.Print("--- itemsStr ---")
				log.Print(itemMap)
				itemType, typeExists := itemMap["type"]
				if !typeExists {
					log.Printf("type 키가 없습니다.")
					ref, refExists := itemMap["$ref"]
					if !refExists {
						log.Printf("ref 키가 없습니다.")
					} else {
						log.Print("--- refType ---")
						log.Print(ref)

						refStr := itemMap["$ref"].(string)
						refPackageName, err := extractPackageNameFromRef(refStr)
						if err != nil {
							continue
						}
						property.ItemPackage = refPackageName

						packageFileName, err := extractPackageFileNameFromRef(refStr)
						if err != nil {
							continue
						}
						//log.Printf("패키지명을 포함한 문자열: %s\n", packageFileName)
						property.ItemPackageFileName = packageFileName
						fileName, ok1 := extraceFileNameFromRef(refStr)
						if ok1 != nil {
							log.Print("fileName 추출 결과 ", ok1)
						}

						//log.Printf("fileName: %s\n", fileName)
						// 해당 struct의 package와 참조하는 struct의 package가 다르면 package.filename
						if packageName == refPackageName {
							property.ItemFileName = fileName
						} else {
							property.ItemFileName = packageFileName
						}

						// array이므로 []를 붙임
						property.Type = "[]" + fileName

					}
				} else {
					log.Print("--- itemType2 ---")
					log.Print(itemType)
					itemTypeStr := itemType.(string)

					// array이므로 []를 붙임
					property.Type = "[]" + itemTypeStr

				}
			}
		} else {
			if refExists {
				refStr := valueMap["$ref"].(string)
				log.Print("--- refStr ---")
				log.Print(refStr)

				packageFileName, err := extractPackageFileNameFromRef(refStr)
				if err != nil {
					continue
				}
				log.Printf("패키지명을 포함한 문자열: %s\n", packageFileName)
				property.ItemPackageFileName = packageFileName
				fileName, ok1 := extraceFileNameFromRef(refStr)
				if ok1 != nil {
					log.Print("fileName 추출 결과 ", ok1)
				}

				//log.Printf("fileName: %s\n", fileName)
				property.ItemFileName = fileName

				property.Type = fileName
			}
		}

		propertyList = append(propertyList, property)
		//log.Print("-- property")
		//log.Print(property)
	} // end of for

	// log.Print("*** propertyList")
	// log.Print(propertyList)
	log.Print("*** end")
	return propertyList, nil
}

// references에서 패키지를 포함한 파일명 추출
// ex) #/definitions/mcis.BenchmarkInfo -> mcis.BenchmarkInfo
func extractPackageNameFromRef(refStr string) (string, error) {
	parts := strings.Split(refStr, "/")
	// 마지막 요소 추출
	lastPart := ""
	if len(parts) > 0 {
		lastPart = parts[len(parts)-1]
	}

	packageName := ""
	dotParts := strings.Split(lastPart, ".")
	if len(dotParts) > 1 {
		// 마지막 요소에서 패키지명을 제외한 파일명 추출
		packageName = dotParts[0]
		//log.Printf("추출된 패키지: %s\n", packageName)
	}
	return packageName, nil
}

// references에서 패키지를 포함한 파일명 추출
// ex) #/definitions/mcis.BenchmarkInfo -> mcis.BenchmarkInfo
func extractPackageFileNameFromRef(refStr string) (string, error) {
	parts := strings.Split(refStr, "/")
	// 마지막 요소 추출
	lastPart := ""
	if len(parts) > 0 {
		lastPart = parts[len(parts)-1]
	}
	return lastPart, nil
}

// references에서 파일이름만 추출
// ex) #/definitions/mcis.BenchmarkInfo -> BenchmarkInfo
func extraceFileNameFromRef(refStr string) (string, error) {
	packageFileName, err := extractPackageFileNameFromRef(refStr)
	if err != nil {
		return "", err
	}

	fileName := ""
	// 패키지명과 파일명 분할
	dotParts := strings.Split(packageFileName, ".")
	if len(dotParts) > 1 {
		// 마지막 요소에서 패키지명을 제외한 파일명 추출
		fileName = dotParts[len(dotParts)-1]
		log.Printf("추출된 파일명: %s\n", fileName)
	} else {
		//log.Printf("패키지명을 포함한 문자열: %s\n", lastPart)
		fileName = packageFileName
	}

	return fileName, nil
}

// type Model struct {
// 	// 여기에 모델의 필드를 추가하세요 (properties에 정의된 필드와 일치해야 함)
// }

// func generateModels(swaggerData map[string]interface{}) (map[string]Model, error) {
// 	// Swagger 스펙에서 properties를 사용하여 모델 구조체를 생성하는 로직을 작성하세요.
// 	// Swagger 스펙에 따라 모델 구조체를 생성하는 방식이 다를 수 있습니다.
// 	// 이 예제에서는 모델 구조체를 빈 상태로 생성하였습니다.
// 	models := make(map[string]Model)
// 	// 여기에서 Swagger 스펙의 "definitions" 항목을 파싱하고 모델 구조체를 생성하세요.
// 	// models["모델명"] = Model{ ... }
// 	return models, nil
// }

// ConfigInfo는 common.ConfigInfo에 대한 Golang struct입니다.
type ConfigInfo struct {
	ID    string `yaml:"id"`
	Name  string `yaml:"name"`
	Value string `yaml:"value"`
}

func generateStructFromDefinition(definition map[interface{}]interface{}) string {
	// Golang struct를 생성하는 로직 작성
	var structDefinition string
	structDefinition += "type ConfigInfo struct {\n"
	for key, value := range definition["properties"].(map[interface{}]interface{}) {
		keyStr := key.(string)
		typeStr := value.(map[interface{}]interface{})["type"].(string)
		structDefinition += fmt.Sprintf("\t%s %s `yaml:\"%s\"`\n", keyStr, getTypeMapping(typeStr), keyStr)
	}
	structDefinition += "}\n"
	return structDefinition
}

func getTypeMapping(swaggerType string) string {
	log.Print("swaggerType ", swaggerType)
	// Swagger 타입을 Golang 타입으로 매핑
	switch swaggerType {
	case "string":
		return "string"
	case "boolean":
		return "boolean"
	case "integer":
		return "int"
	case "number":
		return "int"
	// 다른 Swagger 타입에 따라 추가 매핑
	case "object":
		return "object"
	case "array":
		return "[]"
	default:
		//return "interface{}"
		return swaggerType
	}
}

func openOrCreateLogFile(logFilePath string) (*os.File, error) {
	// 로그 파일 생성 또는 열기 (기존 로그를 덮어쓰지 않음)
	logFile, err := os.OpenFile(logFilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return nil, err
	}
	return logFile, nil
}

func generateGoFile(basePath, packageName, fileName string, definition map[interface{}]interface{}) {
	// 에러 로그 파일 생성 또는 열기 (기존 로그를 덮어쓰지 않음)
	logFilePath := "error.log"
	logFile, err := openOrCreateLogFile(logFilePath)
	if err != nil {
		log.Printf("에러 로그 파일을 열거나 생성하는 중 오류 발생: %v\n", err)
		return
	}
	defer logFile.Close()
	// 로그 출력을 파일로 설정
	log.SetOutput(logFile)

	// Go 파일 내용 작성
	goFileContent := fmt.Sprintf("package %s\n\n", packageName)
	goFileContent += "type " + strings.Title(fileName) + " struct {\n"

	valueMap, ok := definition["properties"].(map[interface{}]interface{})
	if !ok {
		log.Printf("값을 맵으로 형변환할 수 없습니다: definition properties")
		return
	}

	for key, value := range valueMap {
		keyStr, ok := key.(string)
		if !ok {
			log.Printf("키를 문자열로 형변환할 수 없습니다: %v\n", key)
			continue // 다음 요소로 이동
		}

		subMap, ok := value.(map[interface{}]interface{})
		if !ok {
			log.Printf("value값을 맵으로 형변환할 수 없습니다: %v\n", value)
			continue // 다음 요소로 이동
		}

		for subKey, subValue := range subMap {
			subKeyStr, ok := subKey.(string)
			if !ok {
				log.Printf("subKey를 문자열로 형변환할 수 없습니다: %v\n", subKeyStr)
				continue // 다음 요소로 이동
			}
			log.Print("--- subKey ---")
			log.Print(subKey)

			log.Print("--- subValue ---")
			log.Print(subValue)
			if subKey == "type" {
				typeStr := ""

				if subValue == "string" {
					typeStr = "string"
				} else if subValue == "object" {
					objMap, ok := subValue.(map[interface{}]interface{})
					if !ok {
						log.Printf("subValue값을 맵으로 형변환할 수 없습니다: %v\n", subValue)
						log.Printf("subKey %v\n", subKey)
						continue // 다음 요소로 이동
					}
					for objKey, objValue := range objMap {
						objKeyStr, ok := objKey.(string)
						if !ok {
							log.Printf("objValue를 문자열로 형변환할 수 없습니다: %v\n", objValue)
							log.Printf("objKeyStr %v\n", objKeyStr)
							continue // 다음 요소로 이동
						}
						log.Print("--- objKey ---")
						log.Print(objKey)

						log.Print("--- objValue ---")
						log.Print(objValue)

						typeStr = objValue.(map[interface{}]interface{})["type"].(string)
					}
				} else if subValue == "array" {
					arrMap, ok := subValue.(map[interface{}]interface{})
					if !ok {
						log.Printf("arrMap값을 맵으로 형변환할 수 없습니다: %v\n", arrMap)
						log.Printf("subKey %v\n", subKey)
						continue // 다음 요소로 이동
					}
					log.Print(arrMap)
					refStr := arrMap["$ref"].(string)
					//map[$ref:#/definitions/mcis.BenchmarkInfo]
					log.Print("--- refStr ---")
					log.Print(refStr)
				} else {

				}

				goFileContent += fmt.Sprintf("\t%s %s `json:\"%s\"`\n", strings.Title(keyStr), getTypeMapping(typeStr), keyStr)
			} else if subKey == "items" {
				typeStr := ""
				if subValue == "string" {
					typeStr = "string"
				} else {
					//map[$ref:#/definitions/mcir.TbSecurityGroupInfo]
					ref, ok := subValue.(map[interface{}]interface{})["$ref"].(string)
					if !ok {
						log.Printf("subValue값을 맵으로 형변환할 수 없습니다: %v\n", subValue)
						log.Printf("subKey %v\n", subKey)
						continue // 다음 요소로 이동
					}
					log.Print("---- ref----")
					log.Print(ref)

					parts := strings.Split(ref, ".")
					if len(parts) > 0 {
						fileName := parts[len(parts)-1]
						fmt.Printf("파일 이름: %s\n", fileName)
						typeStr = fileName
					} else {
						typeStr = ref
					}

				}
				goFileContent += fmt.Sprintf("\t%s %s `json:\"%s\"`\n", strings.Title(keyStr), getTypeMapping(typeStr), keyStr)
			}
		}
		//typeStr := value.(map[interface{}]interface{})["type"].(string)
		//goFileContent += fmt.Sprintf("\t%s %s `yaml:\"%s\"`\n", strings.Title(keyStr), getTypeMapping(typeStr), keyStr)
		//goFileContent += fmt.Sprintf("\t%s %s `json:\"%s\"`\n", strings.Title(keyStr), getTypeMapping(typeStr), keyStr)

		//log.Print("--- keyStr ---")
		//log.Print(keyStr)

		//log.Print("--- value ---")
		//log.Print(value)
		break
	}
	goFileContent += "}\n"

	// Go 파일 저장
	//err := ioutil.WriteFile(fileName, []byte(goFileContent), 0644)
	destPath := "." + basePath + "/" + packageName + "/" + fileName
	log.Print(destPath)

	// 파일 저장 폴더가 없으면 생성
	dirPath := filepath.Dir(destPath)
	if _, err := os.Stat(dirPath); os.IsNotExist(err) {
		if err := os.MkdirAll(dirPath, 0755); err != nil {
			log.Fatalf("폴더를 생성하는 중 오류 발생: %v", err)
		}
	}

	//err := ioutil.WriteFile(destPath, []byte(goFileContent), 0644)
	//if err != nil {
	//	log.Fatalf("Go 파일을 저장하는 중 오류 발생: %v", err)
	//}
	log.Print(goFileContent)
}
