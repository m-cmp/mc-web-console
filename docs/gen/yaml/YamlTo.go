package main

import (
	"flag"
	"fmt"
	"io/ioutil"
	"log"

	"gopkg.in/yaml.v2"
)

type Info struct {
	Contact     ContactInfo `yaml:"contact"`
	Description string      `yaml:"description"`
	License     LicenseInfo `yaml:"license"`
	Title       string      `yaml:"title"`
	Version     string      `yaml:"version"`
}

type ContactInfo struct {
	Email string `yaml:"email"`
	Name  string `yaml:"name"`
	URL   string `yaml:"url"`
}

type LicenseInfo struct {
	Name string `yaml:"name"`
	URL  string `yaml:"url"`
}

type Path struct {
	Get    GetInfo    `yaml:"get"`
	Post   PostInfo   `yaml:"post"`
	Put    PutInfo    `yaml:"put"`
	Delete DeleteInfo `yaml:"delete"`
}

type GetInfo struct {
	Consumes    []string                `yaml:"consumes"`
	Description string                  `yaml:"description"`
	Parameters  []ParameterInfo         `yaml:"parameters"`
	Produces    []string                `yaml:"produces"`
	Responses   map[string]ResponseInfo `yaml:"responses"`
	Summary     string                  `yaml:"summary"`
	Tags        []string                `yaml:"tags"`
}

type PostInfo struct {
	Consumes    []string                `yaml:"consumes"`
	Description string                  `yaml:"description"`
	Parameters  []ParameterInfo         `yaml:"parameters"`
	Produces    []string                `yaml:"produces"`
	Responses   map[string]ResponseInfo `yaml:"responses"`
	Summary     string                  `yaml:"summary"`
	Tags        []string                `yaml:"tags"`
}

type PutInfo struct {
	Consumes    []string                `yaml:"consumes"`
	Description string                  `yaml:"description"`
	Parameters  []ParameterInfo         `yaml:"parameters"`
	Produces    []string                `yaml:"produces"`
	Responses   map[string]ResponseInfo `yaml:"responses"`
	Summary     string                  `yaml:"summary"`
	Tags        []string                `yaml:"tags"`
}

type DeleteInfo struct {
	Consumes    []string                `yaml:"consumes"`
	Description string                  `yaml:"description"`
	Parameters  []ParameterInfo         `yaml:"parameters"`
	Produces    []string                `yaml:"produces"`
	Responses   map[string]ResponseInfo `yaml:"responses"`
	Summary     string                  `yaml:"summary"`
	Tags        []string                `yaml:"tags"`
}

type ParameterInfo struct {
	Default     string `yaml:"default"`
	Description string `yaml:"description"`
	In          string `yaml:"in"`
	Name        string `yaml:"name"`
	Required    bool   `yaml:"required"`
	Type        string `yaml:"type"`
}

type ResponseInfo struct {
	Description string `yaml:"description"`
	Schema      struct {
		Ref string `yaml:"$ref"`
	} `yaml:"schema"`
}

type SwaggerData struct {
	Host  string          `yaml:"host"`
	Info  Info            `yaml:"info"`
	Paths map[string]Path `yaml:"paths"`
}

func main() {
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

	var swaggerData SwaggerData

	// YAML 데이터를 구조체로 언마샬
	err = yaml.Unmarshal(yamlData, &swaggerData)
	if err != nil {
		fmt.Println("YAML 파싱 오류:", err)
		return
	}
	//log.Print(swaggerData)
	// JSON 데이터로 변환
	// jsonData, err := json.Marshal(swaggerData)
	// if err != nil {
	// 	fmt.Println("JSON 변환 오류:", err)
	// 	return
	// }

	// // 필요한 객체에 JSON 데이터 언마샬
	// // 예를 들어, paths 정보만 추출하려면:
	// var paths Path
	// err = json.Unmarshal(jsonData, &paths)
	// if err != nil {
	// 	fmt.Println("JSON 언마샬 오류:", err)
	// 	return
	// }

	// // paths 객체를 사용하여 원하는 작업 수행
	// // fmt.Println(paths)
	// // fmt.Println(paths.Post)
	// fmt.Println(paths.Delete.Parameters)

	log.Print(swaggerData.Host)
	log.Print(swaggerData.Info)
	log.Print(len(swaggerData.Paths))
	//log.Print(swaggerData.Paths)

	for pathKey, pathVal := range swaggerData.Paths {
		//log.Print(pathKey)
		//log.Print(pathVal)
		if pathKey == "/ns/{nsId}/resources/vNet/{vNetId}" {
			log.Print("GET len ", len(pathVal.Get.Responses))
			if len(pathVal.Get.Responses) > 0 {
				//log.Print(pathVal.Get)
				log.Print("pathVal.Get")
				response := pathVal.Get.Responses["200"]
				log.Print(response)
				if response.Schema.Ref != "" {
					// return type 설정
				}

				// parameters
				// required 여부
				for paramName, paramVal := range pathVal.Get.Parameters {
					log.Print("paramName := ", paramName)
					if paramVal.In != "" {
						paramIn := paramVal.In
						if paramIn == "path" {
							// 호출하는 url에 param이 들어가야 하므로 replace구문 필요
							// param이 여러개일 때, function에서 어떤것으로 전달 할 것인가? struct로 받을 것인지,
							// replace param
						}
					}
				}
				// Parameters  []ParameterInfo         `yaml:"parameters"`

				// 처리 후 continue
				continue
			}
			if len(pathVal.Post.Responses) > 0 {
				//log.Print(pathVal.Post)
				log.Print("pathVal.Post")
				// 처리 후 continue
				continue
			}
			if len(pathVal.Put.Responses) > 0 {
				//log.Print(pathVal.Put)
				log.Print("pathVal.Put")
				// 처리 후 continue
				continue
			}
			if len(pathVal.Delete.Responses) > 0 {
				//log.Print(pathVal.Delete)
				log.Print("pathVal.Delete")
				// 처리 후 continue
				continue
			}
		}

		//break
	}
}
