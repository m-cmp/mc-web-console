var lastCallTime = "0"; // 호출하면 호출시간을 return하여 해당시간 이후Data만 가져오도록
var messageArray = "";//받아온 Data
// var loc = window.location;
// var uri = "ws:";
// var ws;
// if (loc.protocol === "https:") {
//   uri = "wss:";
// }
// uri += "//" + loc.host;
// uri += "/ws/websocketdatalist"; // Gorilla websocket

// ws = new WebSocket(uri);

// // websocket open
// ws.onopen = (event) => {
//   console.log("Connected");
//   let sendData = { event: "open" };
//   // 현재날짜 -2시간 이후의 data만 가져온다.
//   ws.send(JSON.stringify(sendData));
//   console.log(event);
// };
// // websocket req :
// var interval = setInterval(function () {
//   getWebsocketDataList();
// }, 30000); // 30초마다

// // websocket message response
// ws.onmessage = (event) => {
//   console.log(event.data);
//   let recData = JSON.parse(event.data);
//   console.log("recData.event= " + recData.event);
//   console.log(recData);

//   switch (recData.event) {
//     case "res":
//       var out = document.getElementById("callTime");
//       lastCallTime = recData.callTime;
//       messageData = recData.message;
//       console.log(recData);
//       break;
//     default:
//       // var out = document.getElementById('callTime');
//       // out.innerHTML += recData;
//       $("#callTime").empty();
//       $("#callTime").append("<br> by res open");
//       console.log(recData);
//       break;
//   }
// };

// // websocket close : page 이동, 브라우저가 닫히는 경우 close로 해당 websocket를 닫아준다.
// window.addEventListener("beforeunload", function (e) {
//   let sendData = { event: "close" };
//   ws.send(JSON.stringify(sendData));
//   console.log("beforeunload");
//   console.log(sendData);
// });
// ws.onclose = function () {
//   console.log("Closed");
// };

// 웹소켓 data 조회
export function getWebsocketDataList() {
  try{
    var callTimeDate = new Date(lastCallTime);
    if ( callTimeDate instanceof Date){// 날짜형태면 unixtime으로 변경
      console.log("lastCallTime ", lastCallTime)
      console.log("callTimeDate is date type ", callTimeDate)
      var unixTime = Math.floor(callTimeDate.getTime() / 1000);
      console.log("unixTime ", unixTime)
      lastCallTime = unixTime
    }
  }catch(e){
    console.log(e)
  }
  let sendData = { event: "req", callTime: "" + lastCallTime };
  
  // sequence 를 받아 최종 sequence 보다 큰 것들만 가져온다.
  console.log("ws readyState " + ws.readyState + " : ", lastCallTime)
  try{
    ws.send(JSON.stringify(sendData));
  }catch (e) {
    console.log("getWebsocketDataList error", e)
  }
}

// // 반복 중단
// export function stopInterval() {
//   clearInterval(interval);
// }

export function setCallTime(lastCallTime) {
  var out = document.getElementById("callTime");
  out.innerHTML = lastCallTime;
}

// // 날짜(data)를 넘기면 yyyymmddhh24miss 형태로 반환
export function yyyymmddhh24miss(d) {
  function pad(n) { return n < 10 ? "0" + n : n }
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds())
}

var ws;
function connectWebSocket() {
  var loc = window.location;
  var uri = "ws:";
  
  if (loc.protocol === "https:") {
    uri = "wss:";
  }
  uri += "//" + loc.host;
  uri += "/ws/websocketdatalist"; // Gorilla websocket

  ws = new WebSocket(uri);

  ws.onopen = function(event) {
    console.log('WebSocket connected');
    console.log("ws onopen ", ws.readyState)
    console.log("lastCallTime ", lastCallTime)
    let sendData = { event: "open" };
    
    if (lastCallTime != "0"){      
      sendData = { event: "req", callTime: "" + lastCallTime };
    }
    // 현재날짜 -2시간 이후의 data만 가져온다.
    ws.send(JSON.stringify(sendData));
  };

  ws.onerror = function(error) {
    console.error('WebSocket error:', error);
  };

  ws.onclose = function(event) {
    console.log('WebSocket closed:', event);
    setTimeout(connectWebSocket, 30000); // reconnect after 30 seconds
  };

  ws.onmessage = (event) => {
    console.log(event.data);
    let recData = JSON.parse(event.data);
    console.log("recData.event= " + recData.event);
    console.log(recData);
  
    switch (recData.event) {
      case "res":        
        messageArray = recData.message;        
        // var tenDaysAgo = new Date()
        // tenDaysAgo.setDate(tenDaysAgo.getDate() - 10)// 10일 전을 기본값으로 함
        // var maxProcessTime = tenDaysAgo.valueOf();
        //var twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);// 2시간 전을 기본값으로
        //var maxProcessTime = twoHoursAgo.valueOf();

        var oldLastCallTime = lastCallTime;
        messageArray.forEach( (messageData, key) =>{
          //console.log("messageData map key ", key)
          //console.log("messageData map value ", valueObj)
          appendNotice(messageData)
        });
        var newLastCallTime = lastCallTime;
        messageArray = "";
        console.log("oldLastCallTime ", oldLastCallTime)
        console.log("newLastCallTime ", newLastCallTime)
        if( newLastCallTime > oldLastCallTime ){
          
          var badge = document.getElementById("badge");
          var out = document.getElementById("callTime"); 
          //badge.innerHTML = ++badgeIdx;
          badge.innerHTML = 1;
          badge.style.display = "inline-block";
          var badgeIdx = 0;
  

        }

        break;
      default:        
        $("#callTime").empty();
        $("#callTime").append("<br> by res open");
        console.log(recData);
        break;
    }//end of switch
  }//end of onMessage

  //var interval = setInterval(function () {
  //  getWebsocketDataList();
  //}, 30000); // 30초마다
}

// Notice 에 추가
// TODO : backend의 key는 nano인데 javascript의 nano와 차이가 있어 비교로직 보완 필요
function appendNotice(messageData){
  console.log(messageData)
  

  var processTime = messageData.processTime;  

  console.log("lastCallTime", lastCallTime);  
  console.log("processTime", processTime);

  if (lastCallTime == "0" || processTime > lastCallTime ) {
    var out = document.getElementById("callTime");
    var tr = document.createElement("tr");
    var th = document.createElement("th");
    var tdType = document.createElement("td");
    var tdDescription = document.createElement("td");
    tdDescription.setAttribute("id", "tdDescription");
    out.appendChild(tr);
    tr.appendChild(th);
    tr.appendChild(tdType);
    tr.appendChild(tdDescription);
    th.innerHTML = yyyymmddhh24miss(new Date(messageData.processTime))
    tdType.innerHTML = messageData.taskType;
    var splited = messageData.taskKey.split("||");
    var splitedIdx = splited.length - 1;
    tdDescription.innerHTML = splited[splitedIdx] + " " + messageData.lifeCycle + " " + messageData.status;
    console.log(tdDescription.innerHTML)

    

    if( processTime > lastCallTime){
      console.log("set new call Time " , lastCallTime)
      console.log("to processTime " , processTime)
      lastCallTime = processTime;      
    }
    
    // 처음 open시에는 badge표시 안함
    if (lastCallTime == "0") { 
      lastCallTime = processTime;
      return; 
    }    
        
  }
}
//connectWebSocket();

