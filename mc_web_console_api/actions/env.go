package actions

import (
	"os"
	"strconv"
)

func init() {
	MCIAM_USE, _ = strconv.ParseBool(os.Getenv("MCIAM_USE"))
	CMIG_SECRET_KEY = []byte(os.Getenv("CMIG_SECRET_KEY"))
}

var MCIAM_USE = false                           // MC-IAM-MANAGER 사용여부, init 에서 재정의
var CMIG_SECRET_KEY = []byte("CMIG_SECRET_KEY") // C-MIG 사용시 singing secret Key
