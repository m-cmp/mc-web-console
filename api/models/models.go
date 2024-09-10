package models

import (
	"log"

	"github.com/gobuffalo/pop/v6"
)

// DB is a connection to your database to be used
// throughout your application.
var DB *pop.Connection

func init() {
	var err error
	DB, err = pop.Connect("development")
	if err != nil {
		log.Fatal(err)
	}
	pop.Debug = true
}
