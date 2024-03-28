package handler

import (
	//"mc_web_console_api/echomodel"
	//tbmcis "mc_web_console_api/echomodel/tumblebug/mcis"
	"encoding/gob"
	"log"
	"time"

	"github.com/gobuffalo/buffalo"

	modelsocket "mc_web_console_api/echomodel/websocket"
)

func init() {
	gob.Register(map[int64]modelsocket.WebSocketMessage{})
}

// WebSocket에 전달할 Message Set
func SetWebsocketMessage(taskType string, taskKey string, lifeCycle string, status string, c buffalo.Context) {
	socketDataMap := map[int64]modelsocket.WebSocketMessage{}
	if socketDataStore := c.Session().Get("socketdata"); socketDataStore != nil { // 존재하지 않으면 TB 조회
		socketDataMap = socketDataStore.(map[int64]modelsocket.WebSocketMessage)

	} else {
		log.Println("SetWebsocketMessageBySend is not Ok ")
	}

	websocketMessage := modelsocket.WebSocketMessage{}

	websocketMessage.TaskType = taskType
	websocketMessage.TaskKey = taskKey
	websocketMessage.LifeCycle = lifeCycle
	websocketMessage.Status = status
	websocketMessage.ProcessTime = time.Now()

	nanoTime := time.Now().UnixNano()
	socketDataMap[nanoTime] = websocketMessage
	c.Session().Set("socketdata", socketDataMap)
	log.Println("SetWebsocketMessage. setsocketdata" + taskKey + " :  " + lifeCycle + " " + status)
	log.Println("SetWebsocketMessage. socketDataMap", socketDataMap)
}

// TaskKey에 해당하는 값 조회 : 요청, 완료 값이 return
func GetWebsocketMessageByTaskKey(taskType string, taskKey string, c buffalo.Context) map[int64]modelsocket.WebSocketMessage {
	returnSocketDataMap := map[int64]modelsocket.WebSocketMessage{}
	// returnWebsocketMessage := modelsocket.WebSocketMessage{}

	if socketDataStore := c.Session().Get("socketdata"); socketDataStore != nil { // 존재하지 않으면 TB 조회
		socketDataMap := socketDataStore.(map[int64]modelsocket.WebSocketMessage)
		for key, val := range socketDataMap {
			log.Println("show socketData with key : getsocketdata ", key, val)
			if val.TaskKey == taskKey {
				returnSocketDataMap[key] = val
				log.Println("show socketData with key by send : getsocketdata ", key, val)
			}
		}
		// }
	} else {
		log.Println("socketDataStore is not Ok1 ")
	}
	return returnSocketDataMap
}

// 전송 상태에 따른 값 목록 조회. sendMessage==false 이면 전송 전 data목록만 :: 시간을 param으로 하므로 필요 없을 것. deprecated.
// func GetWebsocketMessageBySend(send bool, c buffalo.Context) map[int64]modelsocket.WebSocketMessage {
func GetWebsocketMessageBySend(send bool, c buffalo.Context) []modelsocket.WebSocketMessage {
	socketResultList := []modelsocket.WebSocketMessage{}
	if socketDataStore := c.Session().Get("socketdata"); socketDataStore != nil { // 존재하지 않으면 TB 조회
		socketDataMap := socketDataStore.(map[int64]modelsocket.WebSocketMessage)
		for key, val := range socketDataMap {
			log.Println("show socketData with key : getsocketdata ", key, val)
			socketMessage := socketDataMap[key]
			socketResultList = append(socketResultList, socketMessage)
		}
	} else {
		log.Println("socketDataStore is not Ok2 ")
	}

	return socketResultList
}

// 특정 시점 이후의 data만 추출 :
// func GetWebsocketMessageByProcessTime(beginTime time.Time, c buffalo.Context) map[int64]modelsocket.WebSocketMessage {
func GetWebsocketMessageByProcessTime(beginTime int64, c buffalo.Context) []modelsocket.WebSocketMessage {
	socketResultList := []modelsocket.WebSocketMessage{}

	if socketDataStore := c.Session().Get("socketdata"); socketDataStore != nil {
		log.Println("GetWebsocketMessageByProcessTime socketdata is not nil")
		log.Println("socketDataStore ", socketDataStore)
		socketDataMap := socketDataStore.(map[int64]modelsocket.WebSocketMessage)
		log.Println("socketDataMap ", socketDataMap)
		for key, val := range socketDataMap {
			log.Println("show socketData with key : getsocketdata ", key, val)
			websocketMessage := socketDataMap[key]
			processTime := websocketMessage.ProcessTime.UnixNano()
			log.Println(" key  ", key)
			log.Println(" beginTime ", beginTime)
			log.Println(" processTime", processTime)
			log.Println(" key > beginTime ", processTime > beginTime)
			if processTime > beginTime {
				//websocketMessageMap[key] = websocketMessage
				log.Println("show socketData with key by ProcessTime : getsocketdata ", key, val)
				socketResultList = append(socketResultList, websocketMessage)
			}
		}
	} else {
		log.Println("socketDataStore is not Ok3 ")
		socketDataMap := map[int64]modelsocket.WebSocketMessage{}
		c.Session().Set("socketdata", socketDataMap)
	}

	return socketResultList
}

// taskType : mcis/vm/mcks ...
// lifecycle : create, suspend, resume. ....
// taskKey :
// status : requested, processing, failed, completed
// eccossion에 socketdata 에 추가. key는 timestamp인데 unixNanoTime(int64) 사용
func StoreWebsocketMessage(taskType string, taskKey string, lifeCycle string, requestStatus string, c buffalo.Context) {
	websocketMessage := modelsocket.WebSocketMessage{}

	websocketMessage.TaskType = taskType
	websocketMessage.TaskKey = taskKey
	websocketMessage.LifeCycle = lifeCycle
	websocketMessage.Status = requestStatus
	websocketMessage.ProcessTime = time.Now()

	log.Println("StoreWebsocketMessage... begin " + taskKey + " :  " + lifeCycle + " " + requestStatus)
	socketDataMap := map[int64]modelsocket.WebSocketMessage{}
	session := c.Session()

	if socketDataStore := session.Get("socketdata"); socketDataStore == nil {
		log.Println("StoreWebsocketMessage... socketDataStore is nil")
	} else {
		log.Println("StoreWebsocketMessage... socketDataStore is not nil")
		socketDataMap = socketDataStore.(map[int64]modelsocket.WebSocketMessage)
		log.Println("StoreWebsocketMessage... socketDataStore is not nil 222")
	}
	nanoTime := time.Now().UnixNano()
	socketDataMap[nanoTime] = websocketMessage
	session.Set("socketdata", socketDataMap)
	err := session.Save()
	if err != nil {
		log.Println("session save err", err)
	}

	log.Println("StoreWebsocketMessage... setsocketdata" + taskKey + " :  " + lifeCycle + " " + requestStatus)
	log.Println("StoreWebsocketMessage... socketDataMap", socketDataMap)
}

func StoreWebsocketMessageDetail(taskType string, taskKey string, lifeCycle string, requestStatus string, desc string, c buffalo.Context) {
	socketDataMap := map[int64]modelsocket.WebSocketMessage{}
	if socketDataStore := c.Session().Get("socketdata"); socketDataStore == nil {
		log.Println("StoreWebsocketMessageDetail... socketDataStore is nil")
		socketDataMap = socketDataStore.(map[int64]modelsocket.WebSocketMessage) // 없으면 생성
		log.Println("StoreWebsocketMessageDetail... socketDataStore is nil 222")
	}

	websocketMessage := modelsocket.WebSocketMessage{}

	websocketMessage.TaskType = taskType
	websocketMessage.TaskKey = taskKey
	websocketMessage.LifeCycle = lifeCycle
	websocketMessage.Status = requestStatus + ", " + desc
	websocketMessage.ProcessTime = time.Now()

	nanoTime := time.Now().UnixNano()
	socketDataMap[nanoTime] = websocketMessage
	c.Session().Set("socketdata", socketDataMap)

	log.Println("StoreWebsocketMessageDetail : setsocketdata" + taskKey + " :  " + lifeCycle + " " + requestStatus)
	log.Println("StoreWebsocketMessageDetail : socketDataMap", socketDataMap)
}

// 일정 시간이 지난 data는 제거. : 0이면 기본값(24), 0보다 크면 음수로 바꾸어 계산.
func ClearWebsocketMessage(expireHour int, c buffalo.Context) {

	if expireHour == 0 {
		expireHour = 24
	} else if expireHour > 0 {
		expireHour = -1 * expireHour
	}
	t := time.Now()
	d2 := t.Add(time.Hour * time.Duration(expireHour)) // expire 시간이 지난 것들은 삭제

	renewSocketDataMap := GetWebsocketMessageByProcessTime(d2.UnixNano(), c)
	//renewSocketDataMap := GetWebsocketMessageByProcessTime(d2, c)

	c.Session().Set("socketdata", renewSocketDataMap)

	log.Println("renew setsocketdata before :", d2)
}
