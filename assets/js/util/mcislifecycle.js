import { client } from "/assets/js/util/util";
// MCIS 제어 : 선택한 MCIS내 vm들의 상태 변경
// Dashboard 와 MCIS Manage 에서 같이 쓰므로
// callAAA -> mcisLifeCycle 호출 -> callBackAAA로 결과값전달

// todo : 삭제 예정
// 아래 MCIS 라이프 사이클 핸들링이 필요한 경우 postCommonData 가져다 쓰면됨!!

export function mcisLifeCycle(mcisID, type, callbackSuccess) {
  //var url = "/operations/mcismng/proc/mcislifecycle";
  //console.log("life cycle3 url : ", url);
  var message = "MCIS " + type + " complete!.";
  var namespaceID = $("#topboxDefaultNameSpaceName").text();

  var obj = {
    McisID: mcisID,
    Action: type,
    Force: "false",
  };
  false;

  var caller = "mcisLifeCycle";
  var controllerKeyName = "McisLifeCycle";
  var optionParamMap = new Map();  
  optionParamMap.set("{mcisId}", mcisID);
  mcpjs["util/pathfinder"].postCommonData(
    caller,
    controllerKeyName,
    optionParamMap,
    obj,
    callbackSuccess
  );

  //   client
  //     .post(url, {
  //       NamespaceID: namespaceID,
  //       McisID: mcisID,
  //       QueryParams: ["action=" + type, "force=false"],
  //     })
  //     .then((result) => {
  //       console.log("mcisLifeCycle result : ", result);
  //       var status = result.status;
  //       var data = result.data;
  //       mcpjs["mcismng/mcismng"].callbackMcisLifeCycle(status, data, type);
  //       // console.log("life cycle result : ",result)
  //       // console.log("result Message : ",data.message)
  //       // if(status == 200 || status == 201){

  //       //     alert(message);
  //       //     location.reload();
  //       //     //show_mcis(mcis_url,"");
  //       // }else{
  //       //     alert(status)
  //       //     return;
  //       // }
  //       // }).catch(function(error){
  //       //     // console.log(" display error : ",error);
  //       //     console.log(error.response.data);
  //       //     console.log(error.response.status);
  //       //     // console.log(error.response.headers);
  //       //     var status = error.response.status;
  //       //     var data =  error.response.data

  //       //     callbackMcisLifeCycle(status, data, type)
  //       // });
  //     })
  //     .catch((error) => {
  //       console.warn(error);
  //       console.log(error.response);
  //       // var errorMessage = error.response.data.error;
  //       //mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage)
  //       var errorMessage = error.response.data.error;
  //       var statusCode = error.response.status;
  //       mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
  //     });
}

////////////// MCIS Handling end ////////////////
