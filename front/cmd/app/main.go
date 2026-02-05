package main

import (
	"log"

	"front/actions"
)

// main is the starting point for the Echo application.
func main() {
	e := actions.App()
	addr := actions.FRONT_ADDR + ":" + actions.FRONT_PORT
	if err := e.Start(addr); err != nil {
		log.Fatal(err)
	}
}
