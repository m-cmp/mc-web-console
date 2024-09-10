package self

import (
	"fmt"
	"os"

	"gopkg.in/yaml.v2"
)

type Company struct {
	Id          string `json:"id"`
	Name        string `json:"name"`
	Icon        string `json:"icon"`
	Logo        string `json:"logo"`
	Alias       string `json:"alias"`
	Description string `json:"description"`
}

type CompaniesReturn map[string][]Company

func GetCompanyInfo() (*CompaniesReturn, error) {
	filePath := "../conf/metainfo.yaml"
	file, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("error : Failed read file : %s", err.Error())
	}

	var data CompaniesReturn

	err = yaml.Unmarshal(file, &data)
	if err != nil {
		return nil, fmt.Errorf("error : Failed to parse metainfo.yaml %s", err.Error())
	}

	// companies := data["companies"]

	return &data, nil
}
