package main

import (
	"log"
	"million_board/handlers"
	"net/http"
)

func MUST_LOAD() {
	if false {
		log.Panic("the server failed to start!")
	}

	log.Printf("server started!")
}

func register_handlers() {
	http.HandleFunc("/register", handlers.HandleRegister)
	http.HandleFunc("/login", handlers.HandleLogin)
	http.HandleFunc("/verify", handlers.VerifyToken)
}

func main() {
	MUST_LOAD()
	register_handlers()

	log.Panicf("server failed: %v\n", http.ListenAndServe(":7777", nil))
}
