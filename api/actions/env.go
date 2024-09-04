package actions

import (
	"os"
	"strconv"
)

func init() {
	MCIAM_USE, _ = strconv.ParseBool(os.Getenv("MCIAM_USE"))
}

var MCIAM_USE = false // MC-IAM-MANAGER 사용여부, init 에서 재정의
