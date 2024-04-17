package actions

import (
	"log"

	"github.com/gobuffalo/buffalo"

	"mc_web_console_api/handler"

	"encoding/json"
	"strconv"
	"time"

	"github.com/gorilla/websocket"
)

var (
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
)

type pushMessage struct {
	pushpush string
}

// WebSocketDataList
//

func WebSocketDataList(c buffalo.Context) error {
	// Upgrade the incoming request to a WebSocket connection
	ws, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		log.Print("websocket upgrade:", err)
		return err
	}
	defer ws.Close()

	t := time.Now()
	ws.SetWriteDeadline(t.Add(time.Second * 1200))

	for {
		//messageType, message, err := ws.ReadMessage()
		_, message, err := ws.ReadMessage()
		if err != nil {
			log.Println("read:", err)
			break
		}
		var objmap map[string]interface{}
		_ = json.Unmarshal(message, &objmap)
		event := objmap["event"].(string) // event에 구분 : 요청은 open, req, close.   응답은 res로 한다.

		switch event {
		case "open": // 화면이 처음 열렸을 때
			log.Println("websocket open:")
			defaultTime := t.Add(time.Minute * -60) // 기본 조회시간은 현재시간 - 60분

			socketDataList := handler.GetWebsocketMessageByProcessTime(defaultTime.UnixNano(), c)
			log.Println(socketDataList)
			returnMessage := map[string]interface{}{
				"event":    "res",
				"message":  socketDataList,
				"callTime": time.Now().UnixNano(),
			}

			sendErr := ws.WriteJSON(returnMessage)
			if sendErr != nil {
				log.Println("ws send Err ", sendErr.Error())
			}
			// log.Println("is socket working : open finished")
		case "req": // 특정시간 이후 모두 조회. 조회할 시간이 parameter로 넘어온다. // key값이 unixTime으로 되어 있으므로  string -> int64 -> unixTime -> time
			// sendData["data"] = objmap["data"]
			log.Println("websocket req ", objmap)
			sCallTime := objmap["callTime"].(string)
			// log.Println("is socket working : req started")
			nCallTime, nErr := strconv.ParseInt(sCallTime, 10, 64)
			if nErr != nil {
				log.Println("sCallTime err  ", sCallTime)
				d2 := t.Add(time.Minute * -5)
				nCallTime = d2.UnixNano()
			}

			uCallTime := time.Unix(0, nCallTime)
			socketDataMap := handler.GetWebsocketMessageByProcessTime(uCallTime.UnixNano(), c)
			returnMessage := map[string]interface{}{
				"event":    "res",
				"message":  socketDataMap,
				"callTime": time.Now().UnixNano(),
			}

			sendErr := ws.WriteJSON(returnMessage)
			if sendErr != nil {
				log.Println("ws send Err ", sendErr.Error())
			}
			// log.Println("is socket working : req finished")
			// 마지막 조회
		case "close": // page 이동시
			log.Printf("ws.Close()")
			ws.Close()
			log.Printf("socket closed ")
		}

	}
	return err
}
