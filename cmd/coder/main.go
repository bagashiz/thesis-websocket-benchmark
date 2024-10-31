package main

import (
	"context"
	"log"
	"net"
	"net/http"

	"github.com/coder/websocket"
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

func echo(w http.ResponseWriter, r *http.Request) {
	conn, err := websocket.Accept(w, r, nil)
	if err != nil {
		log.Printf("upgrade: %v\n", err)
		return
	}
	defer func() {
		err := conn.CloseNow()
		if err != nil {
			log.Printf("close: %v\n", err)
		}
	}()

	for {
		ctx := context.Background()
		msgTyp, msg, err := conn.Read(ctx)
		if err != nil {
			log.Printf("read: %v\n", err)
			return
		}

		log.Printf("recv: %s", msg)

		err = conn.Write(ctx, msgTyp, msg)
		if err != nil {
			log.Printf("send: %v\n", err)
			return
		}
	}
}
