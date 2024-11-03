package main

import (
	"log"
	"net"
	"net/http"

	"github.com/gorilla/websocket"
)

const (
	host = "localhost"
	port = "8080"
)

func main() {
	addr := net.JoinHostPort(host, port)
	http.HandleFunc("/echo", echo)

	log.Println("Listening on", addr)
	log.Fatal(http.ListenAndServe(addr, nil))
}

var upgrader = websocket.Upgrader{}

func echo(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("upgrade: %v\n", err)
		return
	}
	defer func() {
		err := conn.Close()
		if err != nil {
			log.Printf("close: %v\n", err)
		}
	}()

	for {
		msgTyp, msg, err := conn.ReadMessage()
		if err != nil {
			log.Printf("read: %v\n", err)
			return
		}

		log.Printf("recv: type: %d, size: %d\n", msgTyp, len(msg))

		err = conn.WriteMessage(msgTyp, msg)
		if err != nil {
			log.Printf("send: %v\n", err)
			return
		}
	}
}
