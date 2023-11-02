// path 와 매핑되는 controller의 이름 = key가 되어
// 해당 key입력 시 main.go의 path를 return
// 필요한 param을 path에 적용하여 호출 url return
// leftmenu에서 script import

import { client } from "/assets/js/util/util";

export function callTest() {
  console.log("pathfinder callTest");
}

// key를 가지고 backend 호출하는 url을 가져옴.
// optionParam이 있는 경우 path에 대체할 값이 있으면 대체
// filterKey가 있으면 filterKey 설정
// controllerKeyName -> buffalo의 helperName으로 변경
// url 가져오는 방법
//  case 1 : RouteMap에 helperName을 그대로 가져옴
//  case 2 : 첫글자는 소문자, router 이름의 끝에 PATH를 붙여서 RouteMap에서 찾기
//  case 3 : 기존에 정의한 map(getWebToolUrl) 에서 찾기
//  router파일.go 에서 Name 지정 : ex) vpc.GET("/", VpcList).Name("vpcList")
//export function getURL(controllerKeyName, optionParamMap){
export function getURL(helperName, optionParamMap) {
  console.log("getUrl " + helperName);
  //var url = getWebToolUrl(controllerKeyName)

  var route = RouteMap[helperName];
  if (route == undefined) {
    // 첫글자 소문자로
    helperName = helperName.charAt(0).toLowerCase() + helperName.slice(1);
    route = RouteMap[helperName];
  }

  if (route == undefined) {
    helperName += "Path"; // 이름 뒤에 Path를 붙임
    route = RouteMap[helperName];
  }
  //console.log("route ", route);

  var url = "";
  // if (route == undefined) {
  //   url = getWebToolUrl(helperName);
  // } else {
    url = route.path;
  // }

  if (optionParamMap == undefined) return url;

  // optionParamMap이 있으면 추가 설정
  for (let key of optionParamMap.keys()) {
    //console.log("optionParamMap " + key + " : " + optionParamMap.get(key));

    if (key.indexOf("{") > -1 || key.indexOf(":")) {
      continue;
    }
    //var pathKey = ":" + key;
    //var pathValue = optionParamMap.get(key)
    //url = url.replace(pathKey, pathValue);
  }

  var hasOption = false;
  if (optionParamMap.has("option")) {
    url += "?option=" + optionParamMap.get("option");
  } else {
    url += "?option=";
  }

  if (optionParamMap.has("filterKey")) {
    url += "&filterKey=" + optionParamMap.get("filterKey");
    url += "&filterVal=" + optionParamMap.get("filterVal");
  }
  //console.log("setUrlByParam 전", url);
  url = setUrlByParam(url, optionParamMap);
  //console.log("setUrlByParam 후", url);
  //if (optionParamMap.has('filterKey') ){
  //    url+= "&filterKey=" + optionParamMap.get('filterKey')
  //    url+= "&filterVal=" + optionParamMap.get('filterVal')
  //}
  //console.log("setUrlByParam 전", url);
  //url = setUrlByParam(url, optionParamMap);
  //console.log("setUrlByParam 후", url);

  url = url + setQueryParam(optionParamMap);

  console.log("return url ", url);
  return url;
}

// map에 담긴 Key를 value로 바꿔 url을 return한다.
// url에는 main.go 에서 사용하는 path를 넣는다.
// pathParameter는 Key이름이 {key} 이거나 :key 임.
export function setUrlByParam(url, urlParamMap) {
  //resultVmCreateMap.set(resultVmKey, resultStatus)
  // var url = "/operation/manages/mcksmng/:clusteruID/:clusterName/del/:nodeID/:nodeName";
  var returnUrl = url;
  for (let key of urlParamMap.keys()) {
    console.log("urlParamMap " + key + " : " + urlParamMap.get(key));
    if (key.indexOf("{") > -1 || key.indexOf(":") > -1) {
      var urlParamValue = urlParamMap.get(key);
      returnUrl = returnUrl.replace(key, urlParamValue);
    }
  }
  return returnUrl;
}

// path 뒤에 ? 이후에 붙게되는 parameter string
// queryParameter는 Key이름이 {key} 이거나 :key 가 아님.
// option, filterKey, filterVal은 앞에서 이미 설정 함.
export function setQueryParam(queryParamMap) {
  var returnParam = "";
  console.log(queryParamMap);
  if (queryParamMap == undefined) return returnParam;

  for (let key of queryParamMap.keys()) {
    console.log("queryParamMap " + key + " : " + queryParamMap.get(key));
    if (key.indexOf("{") > -1 || key.indexOf(":") > -1) {
      continue;
    }

    if (key == "option") continue;
    if (key == "filterKey" || key == "filterVal") continue;

    var paramValue = queryParamMap.get(key);
    returnParam += "&" + key + "=" + paramValue;
  }
  return returnParam;
}

// conteroller의 methodName으로 main.go에 정의된 url값을 가져온다.
// 생성 : csp에 자원 생성 = create
// 등록 : csp에 생성 된 자원을 cb에 등록
// 해제 : cb에 등록 된 자원을 해제(csp에는 남음)
// 삭제 : csp에서 자원 삭제(cb에 해제 포함)
// 화면호출 : 관리화면= mngform, 등록화면 = regform
// TODO : 현재 MAP에 하드코딩 된 부분을 RouteMap의 Key로 대체하면 getWebToolUrl 호출부분 필요 없음
// export function getWebToolUrl(controllerKeyName) {
//   // ex ) monitoringGroup.GET("/operation/monitoring/mcismonitoring/mngform", controller.McisMonitoringMngForm)
//   let controllerMethodNameMap = new Map([
//     // USER

//     // Namespace
//     ["NamespaceMngForm", "/namespace/mngform"],

//     //
//     ["ProviderNameByConnection", "/settings/connection/id/:connectionName"],
//     ["ProviderList", "/settings/connection/provider"],
//     ["RegionList", "/settings/connection/region"],

//     // Connection
//     ["CloudConnectionMngForm", "/settings/connection/mngform"],
//     ["ConnectionListByProvider", "/settings/connection"],

//     // Health Check
//     ["HealthCheck", "/settings/healthcheck"],

//     // Resources /////////////////////////////////////

//     // VPC
//     ["VpcMngForm", "/settings/resources/vpc/mngform"],
//     ["VpcList", "/settings/resources/vpc"],
//     ["VpcListByProviderRegionZone", "/settings/resources/vpc/region/"],
//     ["VpcData", "/settings/resources/vpc/id/:vpcId"],

//     // SecurityGroup
//     ["SecurityGroupMngForm", "/settings/resources/securitygroup/mngform"],
//     [
//       "SecurityGroupListByProviderRegionZone",
//       "/settings/resources/securitygroup/region/",
//     ],

//     // SSH Key
//     ["SshKeyMngForm", "/settings/resources/sshkey/mngform"],
//     ["SshKeyListByProviderRegionZone", "/settings/resources/sshkey/region/"],

//     // VM Image
//     ["VmImageMngForm", "/settings/resources/vmimage/mngform"],
//     ["VmImageListByProviderRegionZone", "/settings/resources/vmimage/"],

//     // VM Spec
//     ["VmSpecMngForm", "/settings/resources/vmspec/mngform"],
//     ["VmSpecListByProviderRegionZone", "/settings/resources/vmspec/"],

//     // DataDisk
//     ["DataDiskMngForm", "/settings/resources/datadisk/mngform"],
//     ["DataDiskListByProviderRegionZone", "/settings/resources/datadisk/"],
//     ["DataDiskListByConnection", "/settings/resources/datadisk/region"],
//     [
//       "McisVmAvailableDataDiskList",
//       "/settings/resources/datadisk/availabledisk",
//     ],

//     // My Image
//     ["MyImageMngForm", "/settings/resources/myimage/mngform"],
//     ["MyImageListByProviderRegionZone", "/settings/resources/myimage/"],

//     // Operations /////////////////////////////////////

//     // MCIS
//     ["McisMngForm", "/operations/mcismng/mngform"],
//     ["McisRegForm", "/operations/mcismng/regform"],
//     ["MCISVmRegForm", "/operations/mcismng/regform/:mcisId/:mcisName"],
//     ["McisVmListRegProc", "/operations/mcismng/id/:mcisID/vmlist"],
//     [
//       "CreateVmSnapshot",
//       "/settings/resources/myimage/snapshot/mcis/:mcisID/vm/:vmID",
//     ],
//     ["McisList", "/operations/mcismng"],
//     ["McisData", "/operations/mcismng/id/:mcisID"],
//     ["McisStatusData", "/operations/mcismng/id/:mcisID?option=status"],
//     ["McisVmData", "/operations/mcismng/id/:mcisID/vm/:vmID"],
//     ["McisSubgroupIdList", "/operations/mcismng/id/:mcisID/subgroup"],
//     ["McisSubgroupData", "/operations/mcismng/id/:mcisID/subgroup/:subgroupID"],

//     ["McisRegDynamicProc", "/operations/mcismng/proc/mcisdynamic"],
//     [
//       "McisVmRegDynamicProc",
//       "/operations/mcismng/id/:mcisID/proc/mcisvmdynamic",
//     ],

//     // MCKS
//     ["McksMngForm", "/operations/mcksmng/mngform"],
//     ["McksRegForm", "/operations/mcksmng/regform"],

//     // PMKS
//     ["PmksMngForm", "/operations/pmksmng/mngform"],
//     ["PmksRegForm", "/operations/pmksmng/regform"],
//     ["PmksClusterRegProc", "/operations/pmksmng/regform"],
//     ["PmksListOfNamespace", "/operations/pmksmng/listall"],

//     // MONITORING
//     ["McisMonitoringMngForm", "/operations/monitoring/mcismonitoring/mngform"],
//     ["VmMonitoringMetric", "/operations/monitoring/mcismonitoring"],

//     // POLICY
//     [
//       "MonitoringPolicyConfigMngForm",
//       "/operations/monitoringconfigpolicy/mngform",
//     ],
//     [
//       "MonitoringPolicyAlertMngForm",
//       "/operations/monitoringalertpolicy/mngform",
//     ],

//     // NLB
//     ["NlbMngForm", "/operations/service/nlb/mngform"],

//     // Dashboard
//     ["NsDashboardForm", "/operations/dashboard/mngform"],
//     ["GlobalDashboardForm", "/main"],

//     // ETC
//     ["AboutForm", "/operations/about/about"],

//     // Admin
//     ["RegionGroupMngForm", "/adminconfig/regiongroup/mngform"],
//     ["RegionGroupList", "/adminconfig/regiongroup"],
//     ["RegionGroupReg", "/adminconfig/regiongroup"],
//     ["RegionGroupDel", "/adminconfig/regiongroup"],
//     ["RegionGroupGet", "/adminconfig/regiongroup/id/:regionGroupId"],
//     ["CategoryList", "/adminconfig/menumng/category"],
//     ["RouteList", "/adminconfig/apitestmng"],
//   ]);

//   var webtoolUrl = controllerMethodNameMap.get(controllerKeyName);
//   //alert("webtool URL:"+webtoolUrl)
//   if (webtoolUrl == undefined) {
//     console.log("webtool url", webtoolUrl);
//     webtoolUrl = controllerKeyName;
//   }

//   return webtoolUrl;
// }

export var RouteMap = new Map();
// 제공하는 route 정보 조회
export function getRoutes() {
  var routeList;
  var url = "/route";
  axios
    .get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((result) => {
      //var data = result.data
      routeList = result.data.routes;
      console.log(routeList);
      routeList.forEach((obj) => {
        if (obj.pathName == "settingsResourcesVpcPath") {
          console.log(obj.pathName + "_" + obj.method);
        }
        RouteMap[obj.pathName + "_" + obj.method] = obj;
      });
    })
    .catch((error) => {
      console.log("getRoutes error ", error);
    });
}

// helper의 route정보
// backend 호출할까 하다가 Map에 담아놓고 사용하기로.
// - helperName은 localhost:3000만 호출했을 때 모든 route 정보가 나옴. 여기에 나오는 NAME이 helperName 임.
// - POST와 GET 은 동일한 이름을 가질 수 있으므로 이름 + METHOD 를 Key로 함.
export function getPathByHelper(helperName, sendMethod) {
  // 이미 routeList를 호출했다고
  if (sendMethod == undefined) sendMethod = "GET"; // 기본값은 GET
  return RouteMap[helperName + "_" + sendMethod].path;
  /*
    var route;
    var url = "/route/helper?helper=" + helperName;
    axios.get(url, {
        headers: {
            'Content-Type': "application/json"
        }
    }).then(result => {    
        //var data = result.data
        route = result.data;
        console.log(route);        
    }).catch(error => {
        console.log(error)
    });
    */
}
// router에 정의된 경로만 return하기 때문에 동적으로 적용되는 parameter는 별도 처리 필요
/*
export let RouteHelperMap = new Map();
export function getWebToolUrl(helperName){
    var routeUrl = RouteHelperMap.get(helperName);
    if (routeUrl == undefined) {
        console.log("routeUrl url", routeUrl);
        routeUrl = helperName
    }
    return routeUrl;
}
*/

// 라우터정보 로드 후 조회 function 수행하도록
// router가 로드될 때까지 3초 기다렸다가 실행. 라우터 정보를 html로 렌더링해서 가지고 있는게 나은지...
// application.html 에 router정보를 RouteMap에 넣도록 하여 해결 됨.
/*
export function checkRouteMapAndCall(executeFunction) {
    console.log("checkRouteMapAndCallGetVpcList()")

    var maxAttempts = 3;
    var currentAttempt = 0;

    var checkData = function() {
        if (typeof RouteMap === 'undefined' || $.isEmptyObject(RouteMap)) {
            // RouteMap이 없거나 데이터가 없는 경우
            if (currentAttempt < maxAttempts) {
                console.log(currentAttempt + " : " + maxAttempts)
                currentAttempt++;
                setTimeout(checkData, 1000); // 1초 후에 다시 확인
            } else {
                // 최대 시도 횟수에 도달한 경우
                console.log(currentAttempt + " :: " + maxAttempts)
                executeFunction(); // getVpcList() 호출
            }
        } else {
            // RouteMap에 데이터가 있는 경우
            console.log($.isEmptyObject(RouteMap))
            executeFunction();
        }
    };

    checkData(); // 최초 실행
}
*/

// main 화면인 경우에는 apitest로 보내고
// 그 외에는 helpArea를 보여준다.
// helpKey가 있는 경우에는 해당 key에 맞는 help 정보를 보여준다.
export function showHelp(helpKey) {
  var path = window.location.pathname;
  if (path == "/main") {
    location.href = "/main/apitestmng";
  } else {
    //$("#helpArea").modal()
    mcpjs["util/util"].changePage("AboutForm"); // About으로 이동
  }
}

// 공통으로 사용하는 data 조회 function : 목록(list), 단건(data) 동일
// optionParamMap.set("is_cb", "N");// db를 조회하는 경우 'N', cloud-barista를 직접호출하면 is_cb='Y'. 기본은 is_cb=Y
// filter 할 조건이 있으면 filterKey="connectionName", filterVal="conn-xxx" 등으로 optionParam에 추가하면 됨.
// optionParamMap.set("option", "id");// 결과를 id만 가져오는 경우는 option="id"를 추가 한다.
// buffalo의 helperName으로 router를 찾도록 변경함.
//export function getCommonData(caller, controllerKeyName, optionParamMap, callbackSuccessFunction, callbackFailFunction){
export function getCommonData(
  caller,
  helperName,
  optionParamMap,
  callbackSuccessFunction,
  callbackFailFunction
) {
  //var url = getURL(controllerKeyName, optionParamMap);
  var url = getURL(helperName, optionParamMap);

  axios
    .get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((result) => {
      console.log(result);
      if (
        callbackSuccessFunction == undefined ||
        callbackSuccessFunction == ""
      ) {
        var data = result.data;
        console.log("callbackSuccessFunction undefined get data : ", data);
      } else {
        callbackSuccessFunction(caller, result);
      }
    })
    .catch((error) => {
      console.warn(error);
      if (callbackFailFunction == undefined || callbackFailFunction == "") {
        mcpjs["util/util"].commonAlert(error);
      } else {
        callbackFailFunction(caller, error);
      }
    });
}

// connection 이 있으면 filter조건으로 connection을 추가한다.
export function getCommonDataByConnection(
  caller,
  controllerKeyName,
  optionParamMap,
  callbackSuccessFunction,
  callbackFailFunction
) {
  if (optionParamMap.has("connectionName")) {
    optionParamMap.set("filterKey", "connectionName");
    optionParamMap.set("filterVal", optionParamMap.get("connectionName"));
  }
  getCommonData(
    caller,
    controllerKeyName,
    optionParamMap,
    callbackSuccessFunction,
    callbackFailFunction
  );
}

// 공통으로 사용하는 Post 전송용 function
// bind 하는 param struct에서 해당 paramObj가 List인 경우 : Keywords []string `json:"paramObj"` 이런식으로 써야한다.
// bind 하는 param struct가 obj형태면 그대로 사용해도 됨.
export function postCommonData(
  caller,
  controllerKeyName,
  optionParamMap,
  paramObj,
  callbackSuccessFunction,
  callbackFailFunction
) {
  console.log(paramObj);
  // TODO : client를 axios로 바꿈. post 전송을 모두 postCommon으로 바꿀 것
  // var csrfToken = document
  //   .querySelector('meta[name="csrf-token"]')
  //   .getAttribute("content");  
  var url = getURL(controllerKeyName, optionParamMap);
  //console.log("csrfToken=", csrfToken)

  var data = {
    // headers: {
    //   "Content-type": "application/json",
    //   "x-csrf-token": csrfToken,
    // },
  }
  //axios
  client
    .post(url, paramObj)
    .then((result) => {
      console.log(result);
      var data = result.data;
      console.log(data);
      if (result.status == 200 || result.status == 201) {
        console.log(1);
        if (
          callbackSuccessFunction == undefined ||
          callbackSuccessFunction == ""
        ) {
          console.log(2);
          mcpjs["util/util"].commonAlert(result.statusText);
        } else {
          console.log(3);
          callbackSuccessFunction(caller, result);
        }
      } else {
        console.log(4);
        mcpjs["util/util"].commonAlert(result.statusText);
      }
    })
    .catch((error) => {
      console.log(5);
      console.log(error);
      if (callbackFailFunction == undefined || callbackFailFunction == "") {
        console.log(6);
        mcpjs["util/util"].commonAlert(error.message);
      } else {
        console.log(7);
        callbackFailFunction(caller, error);
      }
    });
}

// 공통으로 사용하는 Post 전송용 function
// 직접 bind가 되지 않는 object의 경우 매핑되는 json이름을 지정하여 호출한다.
export function postCommonDataWithTargetObjName(
  caller,
  controllerKeyName,
  optionParamMap,
  paramName,
  paramObj,
  callbackSuccessFunction,
  callbackFailFunction
) {
  var csrfToken = document
    .querySelector('meta[name="csrf-token"]')
    .getAttribute("content");    
  var url = getURL(controllerKeyName, optionParamMap);
  var data = {
    // headers: {
    //   "Content-type": "application/json",
    //   "x-csrf-token": csrfToken,
    // },
  }
  data[paramName] = paramObj;
  client
  //axios
    .post(url, data)
    .then((result) => {
      var data = result.data;
      console.log(data);
      if (data.status == 200 || data.status == 201) {
        if (
          callbackSuccessFunction == undefined ||
          callbackSuccessFunction == ""
        ) {
          mcpjs["util/util"].commonAlert(data.message);
        } else {
          callbackSuccessFunction(caller, result);
        }
      } else {
        mcpjs["util/util"].commonAlert(data.message);
      }
    })
    .catch((error) => {
      console.warn(error);
      if (callbackFailFunction == undefined || callbackFailFunction == "") {
        mcpjs["util/util"].commonAlert(error);
      } else {
        callbackFailFunction(caller, error);
      }
    });
}

// 공통으로 사용하는 Data 수정용 function
export function putCommonData(
  caller,
  controllerKeyName,
  optionParamMap,
  paramObj,
  callbackSuccessFunction,
  callbackFailFunction
) {
  var url = getURL(controllerKeyName, optionParamMap);
  client
    .put(url, paramObj
      // , {
      //    headers: {
      //     "Content-type": "application/json",
      //    },
      //  }
    )
    .then((result) => {
      var data = result.data;
      console.log(data);
      if (data.status == 200 || data.status == 201) {
        if (
          callbackSuccessFunction == undefined ||
          callbackSuccessFunction == ""
        ) {
          mcpjs["util/util"].commonAlert(data.message);
        } else {
          callbackSuccessFunction(caller, result);
        }
      } else {
        mcpjs["util/util"].commonAlert(data.message);
      }
    })
    .catch((error) => {
      console.warn(error);
      if (callbackFailFunction == undefined || callbackFailFunction == "") {
        mcpjs["util/util"].commonAlert(error);
      } else {
        callbackFailFunction(caller, error);
      }
    });
}

// 공통으로 사용하는 data 삭제 function
export function deleteCommonData(
  caller,
  controllerKeyName,
  optionParamMap,
  paramObj,
  callbackSuccessFunction,
  callbackFailFunction
) {

  // var csrfToken = document
  //   .querySelector('meta[name="csrf-token"]')
  //   .getAttribute("content");
  var url = getURL(controllerKeyName, optionParamMap);
  client
  //axios
    .delete(url, paramObj
      //{
      // headers: {
      //   "Content-Type": "application/json",
      //   "x-csrf-token": csrfToken,
      // },
      //}
    )
    .then((result) => {
      var statusCode = result.data.status;
      var message = result.data.message;
      if (statusCode == 200 || statusCode == 201) {
        if (
          callbackSuccessFunction == undefined ||
          callbackSuccessFunction == ""
        ) {
          mcpjs["util/util"].commonAlert(message);
        } else {
          callbackSuccessFunction(caller, result);
        }
      } else {
        mcpjs["util/util"].commonAlert(message + "(" + statusCode + ")");
      }
    })
    .catch((error) => {
      console.warn(error);
      if (callbackFailFunction == undefined || callbackFailFunction == "") {
        mcpjs["util/util"].commonAlert(error);
      } else {
        callbackFailFunction(caller, error);
      }
    });
}

//////////////// api -> local server -> target api  호출 ///////////////
// 한 화면에서 서로다른 형태로 호출이 가능하므로 caller(호출자) 를 callback에 같이 넘겨서 구분할 수 있게 함.
// isCallback = false 이고 targetObjId 가 있는 경우 해당 obj set
export function getCommonNameSpaceList(
  caller,
  isCallback,
  targetObjId,
  optionParam
) {
  var url = "/settings/namespace/list";

  if (optionParam != "") {
    url += "?option=" + optionParam;
  }

  axios
    .get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((result) => {
      console.log(result);
      console.log("get NameSpace Data : ", result.data);
      // var data = result.data.ns;
      var data = result.data;

      if (!isCallback && targetObjId != undefined) {
        setLeftMenuNamespaceList(targetObjId, data);
      } else {
        getNameSpaceListCallbackSuccess(caller, data);
      }
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      var errorMessage = error.response.data.error;
      var statusCode = error.response.status;
      //mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage)
      if (!isCallback && targetObjId != undefined) {
        setLeftMenuNamespaceList(targetObjId, data);
      } else {
        getNameSpaceListCallbackFail(caller, error);
      }
    });
}

// namespaceList를 좌측메뉴에 set.
// common.js나 util.js로 넘길까?
// 요거 수정한다.
// namespaceList를 로그인할때 걍 셋팅하게 만들까?
export function setLeftMenuNamespaceList(targetObjId, namespaceList) {
  var url = "/namespace/get/shared/ns";
  axios.get(url).then((result) => {
    var data = result.data;
    console.log(data);
    var namespaceList = result.data;
    console.log("setLeftMenuNamespaceList targetObj=" + targetObjId);
    if (!mcpjs["util/util"].isEmpty(namespaceList) && namespaceList.length) {
      for (var itemIndex in namespaceList) {
        var ns = namespaceList[itemIndex].Namespace;
        console.log("ns : ", ns);

        $("#" + targetObjId).append(
          "<li><a href=\"javascript:void(0);\" onclick=\"mcpjs['util/common'].setCurrentNameSpace('TobBox', '" +
            ns.id +
            '\' )" data-toggle="modal" data-target="#NameSpace">' +
            ns.name +
            "</a></li>"
        );
      }
    }
  });
}

// caller 구분자, sortType : 오름.내림, isCallback
export function getCommonCloudProviderList(
  caller,
  sortType,
  isCallback,
  targetObjId
) {
  console.log("getCommonCloudProviderList call");
  var url = "/settings/connection/provider/";
  axios
    .get(url, {
      headers: {
        // 'Authorization': apiInfo
      },
    })
    .then((result) => {
      console.log(result.data);
      var data = result.data;
      if (caller == "vpcselectbox") {
        mcpjs["util/util"].getProviderListForSelectbox(targetObjId);
      } else if (caller == "mciscreate") {
        mcpjs["mcismng/mciscreate"].getCloudProviderListCallbackSuccess(
          caller,
          data,
          sortType
        );
      } else {
        mcpjs["util/util"].getProviderListForSelectbox(targetObjId);
      }
    });

  console.log("caller", caller);
  console.log("sortType", sortType);
  console.log("isCallback", isCallback);
  console.log("targetObjId", targetObjId);
}

// caller 구분자, sortType : 오름.내림, isCallback
export function getCommonCloudConnectionList(
  caller,
  sortType,
  isCallback,
  targetObjId
) {
  var url = "/settings/connection";
  axios
    .get(url, {})
    .then((result) => {
      console.log("get CloudConnection Data : ", result.data);
      var data = result.data.ConnectionConfig;

      if (!isCallback && targetObjId != undefined) {
      } else {
        mcpjs["mcismng/mcismng"].getCloudConnectionListCallbackSuccess(
          caller,
          data,
          sortType
        );
      }
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      // var errorMessage = error.response.data.error;
      // getCloudConnectionListCallbackFail(caller, error);
    });
}

export function getCommonCredentialList(caller, optionParam) {
  var url = "/settings/connection/credential";

  if (optionParam != "") {
    url += "?option=" + optionParam;
  }
  axios
    .get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((result) => {
      console.log("get Credential Data : ", result.data);
      var data = result.data.Credential;
      getCredentialListCallbackSuccess(caller, data);
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      var errorMessage = error.response.data.error;
      getCredentialListCallbackFail(caller, error);
    });
}

export function getCommonRegionList(caller, optionParam) {
  var url = "/settings/connection/region";

  if (optionParam != "") {
    url += "?option=" + optionParam;
  }

  axios
    .get(url, {})
    .then((result) => {
      console.log("get Region Data : ", result.data);
      var data = result.data.Region;
      getRegionListCallbackSuccess(caller, data);
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      // var errorMessage = error.response.data.error;
      //mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage)
      getRegionListCallbackFail(caller, error);
    });
}

export function getCommonDriverList(caller, optionParam) {
  var url = "/settings/connection/driver";

  if (optionParam != "") {
    url += "?option=" + optionParam;
  }

  axios
    .get(url, {
      // headers:{
      //     'Authorization': "{{ .apiInfo}}",
      //     'Content-Type' : "application/json"
      // }
    })
    .then((result) => {
      console.log("get Driver Data : ", result.data);
      var data = result.data.Driver;
      getDriverListCallbackSuccess(caller, data);
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      // var errorMessage = error.response.data.error;
      // var statusCode = error.response.status;
      //mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage)
      getDriverListCallbackFail(caller, error);
    });
}

export function getCommonNetworkList(
  caller,
  optionParam,
  filterKey,
  filterVal
) {
  console.log("vnet : ");

  var url = "/settings/resources/network/list";

  if (optionParam != "" && optionParam != undefined) {
    url += "?option=" + optionParam;
  } else {
    url += "?option=";
  }
  if (filterKey != "" && filterKey != undefined) {
    url += "&filterKey=" + filterKey;
    url += "&filterVal=" + filterVal;
  }

  axios
    .get(url, {
      headers: {
        // 'Authorization': apiInfo
      },
    })
    .then((result) => {
      var data = result.data.VNetList;
      console.log("vNetwork Info : ", result);
      console.log("vNetwork data : ", data);
      //setTotalNetworkList(data)
      getNetworkListCallbackSuccess(caller, data);
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      // var errorMessage = error.response.data.error;
      // var statusCode = error.response.status;
      //mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage)
      getNetworkListCallbackFail(caller, error);
    });
}

export function getCommonSecurityGroupList(
  caller,
  sortType,
  optionParam,
  filterKey,
  filterVal
) {
  var url = "/settings/resources/securitygroup";

  if (optionParam != "" && optionParam != undefined) {
    url += "?option=" + optionParam;
  } else {
    url += "?option=";
  }
  if (filterKey != "" && filterKey != undefined) {
    url += "&filterKey=" + filterKey;
    url += "&filterVal=" + filterVal;
  }

  axios
    .get(url, {
      headers: {
        // 'Authorization': "{{ .apiInfo}}",
        "Content-Type": "application/json",
      },
    })
    .then((result) => {
      console.log("get SG Data : ", result.data);
      var data = result.data.SecurityGroupList; // exception case : if null
      //setTotalSecurityGroupList(data)
      console.log("Data : ", data);
      if (caller == "securitygroupmng") {
        console.log("return get Data securitygroupmng");
        mcpjs[
          "securitygroup/securitygroupmng"
        ].getSecurityGroupListCallbackSuccess(data, sortType);
      } else if (caller == "mcissimpleconfigure") {
        console.log("return get Data");
        setSecurityGroupListAtSimpleConfigure(data);
      } else if (caller == "mainsecuritygroup") {
        console.log("return get Data");
        getSecurityGroupListCallbackSuccess(caller, data);
      } else {
        getSecurityGroupListCallbackSuccess(caller, data);
      }
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      if (caller == "securitygroupmng") {
        console.log("return get Data securitygroupmng");
        mcpjs[
          "securitygroup/securitygroupmng"
        ].getSecurityGroupListCallbackFail(error);
      } else {
        getSecurityGroupListCallbackFail(error);
      }
    });
}

export function getCommonSshKeyList(caller, optionParam, filterKey, filterVal) {
  var url = "/settings/resources/sshkey/list";

  if (optionParam != "" && optionParam != undefined) {
    url += "?option=" + optionParam;
  } else {
    url += "?option=";
  }
  if (filterKey != "" && filterKey != undefined) {
    url += "&filterKey=" + filterKey;
    url += "&filterVal=" + filterVal;
  }

  axios
    .get(url, {
      headers: {
        // 'Authorization': "{{ .apiInfo}}",
        "Content-Type": "application/json",
      },
    })
    .then((result) => {
      console.log("get SSH Data : ", result.data);
      var data = result.data.SshKeyList; // exception case : if null
      //setTotalSshkeyList(data)
      getSshKeyListCallbackSuccess(caller, data);
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      var errorMessage = error.response.data.error;
      var statusCode = error.response.status;
      //mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage);
      getSshKeyListCallbackFail(caller, error);
    });
}

// connection 정보가 바뀔 때 해당 connection에 등록 된 vmi(virtual machine image) 목록 조회.
// 공통으로 사용해야하므로 호출후 결과만 리턴... 그러나, ajax로 호출이라 결과 받기 전에 return되므로 해결방안 필요
export function getCommonVirtualMachineImageList(
  caller,
  sortType,
  optionParam,
  filterKey,
  filterVal
) {
  var sortType = sortType;
  var url = "/settings/resources" + "/vmimage";

  if (optionParam != "" && optionParam != undefined) {
    url += "?option=" + optionParam;
  } else {
    url += "?option=";
  }
  if (filterKey != "" && filterKey != undefined) {
    url += "&filterKey=" + filterKey;
    url += "&filterVal=" + filterVal;
  }

  axios
    .get(url, {
      headers: {
        // 'Authorization': "{{ .apiInfo}}",
        "Content-Type": "application/json",
      },
    })
    .then((result) => {
      console.log("get Image List : ", result.data);

      var data = result.data.VirtualMachineImageList;
      //setTotalImageList(data)
      // Data가져온 뒤 set할 method 호출
      if (caller == "vmimagemng") {
        console.log("return get Data");
        mcpjs["vmimage/vmimagemng"].setVirtualMachineImageListAtServerImage(
          data,
          sortType
        );
      } else if (caller == "mcissimpleconfigure") {
        console.log("return get Data");
        setVirtualMachineImageListAtSimpleConfigure(data, sortType);
      } else if (caller == "mainimage") {
        console.log("return get Data");
        getImageListCallbackSuccess(caller, data);
      } else if (caller == "vmcreate") {
        console.log("return get Data");
        getImageListCallbackSuccess(caller, data);
      } else if (caller == "mciscreate") {
        console.log("return get Data");
        getImageListCallbackSuccess(caller, data);
      }
      // }).catch(function(error){
      //     console.log("list error : ",error);
      // });
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      if (caller == "vmimagemng") {
        console.log("return get Data");
        mcpjs["vmimage/vmimagemng"].getImageListCallbackFail(error);
      } else {
        getImageListCallbackFail(error);
      }
    });
}

export function getCommonVirtualMachineSpecList(
  caller,
  sortType,
  optionParam,
  filterKey,
  filterVal
) {
  console.log("CommonSpecCaller : " + caller);
  console.log("CommonSpecSortType : " + sortType);
  console.log("filterKey : " + filterKey);
  console.log("filterVal : " + filterVal);
  // var url = CommonURL + "/ns/" + NAMESPACE + "/resources/image";
  var url = "/settings/resources" + "/vmspec";

  if (optionParam != "" && optionParam != undefined) {
    url += "?option=" + optionParam;
  } else {
    url += "?option=";
  }
  if (filterKey != "" && filterKey != undefined) {
    url += "&filterKey=" + filterKey;
    url += "&filterVal=" + filterVal;
  }

  console.log("url: ", url);

  axios
    .get(url, {
      headers: {
        // 'Authorization': "{{ .apiInfo}}",
        "Content-Type": "application/json",
      },
    })
    .then((result) => {
      console.log("get Spec List : ", result.data);

      var data = result.data.VmSpecList;
      //setTotalVmSpecList(data)
      if (caller == "virtualmachinespecmng") {
        console.log("return get Data");
        mcpjs["vmspec/vmspecmng"].virtualMachineSpecListCallbackSuccess(
          caller,
          data,
          sortType
        );
        // setVirtualMachineSpecListAtServerSpec(data, sortType);
      } else {
        mcpjs["vmspec/vmspecmng"].getSpecListCallbackSuccess(caller, data);
      }
      // } else if (caller == "mainspec") {
      //     console.log("return get Data")
      //     getSpecListCallbackSuccess(caller, data)
      // } else if (caller == "vmcreate") {
      //     console.log("return get Data")
      //     getSpecListCallbackSuccess(caller, data)
      // } else if (caller == "addedspec") {
      //     getSpecListCallbackSuccess(caller, data)
      // }
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      mcpjs["vmspec/vmspecmng"].getSpecListCallbackFail(error);
    });
}

// /lookupSpecs
export function getCommonLookupSpecList(caller, providerId, regionName) {
  var url = "/settings/resources/vmspec/lookupvmspecs";
  axios
    .get(url, {
      headers: {
        // 'Authorization': "{{ .apiInfo}}",
        "Content-Type": "application/json",
      },
      params: {
        providerId,
        regionName,
      },
    })
    .then((result) => {
      console.log("get Image List : ", result.data);

      var data = result.data.CspVmSpecList;

      // Data가져온 뒤 set할 method 호출
      if (caller == "vmspecmng") {
        console.log("return get Data");
        mcpjs["vmspec/vmspeclookup_modal"].lookupSpecListCallbackSuccess(
          caller,
          data
        );
      }
      // }).catch(function(error){
      //     console.log("list error : ",error);
      // });
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      mcpjs["vmspec/vmspeclookup_modal"].lookupSpecListCallbackSuccess(error);
    });
}

// 등록된 VM 들을 keyword로 조회
export function getCommonSearchVmImageList(
  keywordList,
  caller,
  callbackSuccessFunction
) {
  // console.log("keywordObjId = " + keywordObjId)
  // var keywords = $("#" + keywordObjId).val().split(" ");
  // console.log("keywords = " + keywords)
  // var keywordList = new Array();
  // for (var i = 0; i < keywords.length; i++) {
  //     keywordList.push(keywords[i]);
  // }

  var url = "/settings/resources/vmimage/searchimage";
  client
    .post(url, {
      // headers:{
      //     'Authorization': apiInfo
      // }
      keywords: keywordList,
    })
    .then((result) => {
      console.log("result", result);

      if (
        result.data.VirtualMachineImageList == null ||
        result.data.VirtualMachineImageList == undefined ||
        result.data.VirtualMachineImageList == "null"
      ) {
        mcpjs["util/util"].commonAlert("There is no result");
      } else {
        callbackSuccessFunction(caller, result.data.VirtualMachineImageList);
      }
    });
}

// /lookupSpecs
export function getCommonLookupSpec(caller, connectionName, cspSpecName) {
  var url = "/settings/resources/vmspec/lookupvmspec";
  axios
    .get(url, {
      headers: {
        "Content-Type": "application/json",
      },
      params: {
        connectionName: connectionName,
        cspSpecName: cspSpecName,
      },
    })
    .then((result) => {
      console.log("get Image List : ", result.data);

      var data = result.data.CspVmSpecList;

      // Data가져온 뒤 set할 method 호출
      if (caller == "vmspecmng") {
        console.log("return get Data");
        mcpjs["vmspec/vmspeclookup_modal"].lookupSpecListCallbackSuccess(
          caller,
          data
        );
      }
      // }).catch(function(error){
      //     console.log("list error : ",error);
      // });
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      mcpjs["vmspec/vmspeclookup_modal"].lookupSpecListCallbackSuccess(error);
    });
}

// 현재 선택 된
export function putFetchSpecs() {
  var url = "/settings/resources/vmspec/fetchvmspec";
  axios
    .put(url, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((result) => {
      console.log(result);
      if (result.data.status == 200 || result.data.status == 201) {
        mcpjs["util/util"].commonAlert("Spec Fetched");
        // Region 갱신
        getRegionList();
      } else {
        mcpjs["util/util"].commonAlert("Fail to Spec Fetched");
      }
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      var errorMessage = error.response.data.error;
      var statusCode = error.response.status;
      mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
    });
}

export function getCommonFilterSpecsByRange(caller, searchObj) {
  var url = "/settings/resources/vmspec/filterspecsbyrange";

  // 똑같은데... 얘는 param을 못받음
  // client.post(url, {
  //     headers: {
  //                 'Content-type': 'application/json',
  //             },
  //     searchObj
  client
    .post(url, searchObj, {
      headers: {
        "Content-type": "application/json",
        // 'Authorization': apiInfo,
      },
    })
    .then((result) => {
      console.log(result);
      // if(result.data.status == 200 || result.data.status == 201){
      //     var data = result.data.VmSpec
      //     // mcpjs["util/util"].commonAlert("Spec Searched");
      // }else{
      //     // mcpjs["util/util"].commonAlert("Fail to Spec Searched");
      // }
      var data = result.data.VmSpecList;
      console.log("caller " + caller);
      if (caller == "virtualmachinespecmng") {
        console.log("return get Data");
        virtualMachineSpecListCallbackSuccess(caller, data, sortType);
        // setVirtualMachineSpecListAtServerSpec(data, sortType);
      } else if (caller == "vmassistpopup") {
        filterSpecsByRangeCallbackSuccess(caller, data);
      }
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      var errorMessage = error.response.data.error;
      var statusCode = error.response.status;
      mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
    });
}

// /lookupImages
export function getCommonLookupImageList(caller, providerId, regionName) {
  //var url = "/settings/resources/vmimage/lookupvmimagelist"
  console.log("====provider : regionName====");
  console.log(providerId, " : ", regionName);
  var url = "/settings/resources/vmimage/lookupimages";
  axios
    .get(url, {
      headers: {
        // 'Authorization': "{{ .apiInfo}}",
        "Content-Type": "application/json",
      },
      params: {
        providerId,
        regionName,
      },
    })
    .then((result) => {
      console.log("get Image List : ", result.data);

      var data = result.data.VirtualMachineImageList;

      // Data가져온 뒤 set할 method 호출
      if (caller == "vmimagemng") {
        console.log("return get Data");
        mcpjs["vmimage/vmimagemng"].lookupVmImageListCallbackSuccess(
          caller,
          data
        );
      }
      // }).catch(function(error){
      //     console.log("list error : ",error);
      // });
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      mcpjs["vmimage/vmimagemng"].lookupVmImageListCallbackFail(error);
    });
}

// /lookupImages
export function getCommonLookupImage(caller, connectionName, cspImageID) {
  //var url = "/settings/resources/vmimage/lookupvmimagelist"
  var url = "/settings/resources/vmimage/lookupimages";
  axios
    .get(url, {
      headers: {
        // 'Authorization': "{{ .apiInfo}}",
        "Content-Type": "application/json",
      },
      params: {
        connectionName: connectionName,
        cspImageID: cspImageID,
      },
    })
    .then((result) => {
      console.log("get Image List : ", result.data);

      var data = result.data.VirtualMachineImageList;

      // Data가져온 뒤 set할 method 호출
      if (caller == "vmimagemng") {
        console.log("return get Data");
        lookupVmImageListCallbackSuccess(caller, data);
      }
      // }).catch(function(error){
      //     console.log("list error : ",error);
      // });
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      lookupVmImageListCallbackFail(error);
    });
}

//
///ns/{nsId}/resources/fetchImages
export function putCommonFetchImages(caller, connectionName) {
  var url = "/settings/resources/vmimage/fetchimages";
  axios
    .put(url, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((result) => {
      console.log(result);
      if (result.data.status == 200 || result.data.status == 201) {
        mcpjs["util/util"].commonAlert("Image Fetched");
      } else {
        mcpjs["util/util"].commonAlert("Fail to Image Fetched");
      }
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      var errorMessage = error.response.data.error;
      var statusCode = error.response.status;
      mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
    });
}

// MCIS 목록 조회
// optionParam = id, simple ...
export function getCommonMcisList(
  caller,
  optionParam,
  callbackSuccessFunction,
  callbackFailFunction
) {
  var url = getURL("McisList");
  //var url = "/operations/mcismng"

  if (optionParam != "") {
    url += "?option=" + optionParam;
  }
  axios
    .get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((result) => {
      console.log("get Mcis List : ", result.data);

      var data = result.data.McisList;
      console.log("get data : ", data);
      callbackSuccessFunction(caller, data);
    })
    .catch((error) => {
      console.warn(error);
      if (callbackFailFunction == undefined || callbackFailFunction == "") {
        mcpjs["util/util"].commonAlert(error);
      } else {
        callbackFailFunction(caller, error);
      }
    });
}
// export function getCommonMcisList(caller, isCallback, targetObjId, optionParam) {// old
//     var url = "/operations/mcismng"

//     if (optionParam != "") {
//         url += "?option=" + optionParam
//     }
//     axios.get(url, {
//         headers: {
//             'Content-Type': "application/json"
//         }
//     }).then(result => {
//         console.log("get Mcis List : ", result.data);

//         var data = result.data.McisList;
//         console.log("caller : ",caller);
//         // if ( caller == "mainmcis") {
//         if (caller == "nlbreg"){
//             mcpjs['nlb/nlbmng'].getMcisListCallbackSuccess(caller, data)
//         }else{
//             console.log("return get Data");
//             mcpjs['mcismng/mcismng'].getMcisListCallbackSuccess(caller, data)
//         }
//         // }
//     }).catch(error => {
//         console.warn(error);
//         console.log(error.response)
//         mcpjs['mcismng/mcismng'].getMcisListCallbackFail(error)
//     });
// }

// MCIS 상세정보 조회
// path에 {mcisId} 가 있으므로 replace
export function getCommonMcisData(
  caller,
  mcisID,
  callbackSuccessFunction,
  callbackFailFunction
) {
  var urlParamMap = new Map();
  //urlParamMap.set(":mcisID", mcisID)
  urlParamMap.set("{mcisId}", mcisID);
  //var url = mcpjs['util/pathfinder'].setUrlByParam(mcpjs['util/pathfinder'].getWebToolUrl('McisData'), urlParamMap)
  //var url = mcpjs['util/pathfinder'].setUrlByParam(mcpjs['util/pathfinder'].getURL('McisData', urlParamMap), urlParamMap)
  var url = mcpjs["util/pathfinder"].getURL("McisGet");
  url = mcpjs["util/pathfinder"].setUrlByParam(url, urlParamMap);
  console.log("mcis get url : ", url);
  axios
    .get(url, {})
    .then((result) => {
      console.log(result);
      if (result.data.status == 200 || result.data.status == 201) {
        callbackSuccessFunction(caller, result.data.McisInfo, mcisID);
      } else {
        mcpjs["util/util"].commonErrorAlert(
          result.data.status,
          "MCIS Data Search Failed"
        );
      }
    })
    .catch((error) => {
      console.warn(error);
      if (callbackFailFunction == undefined || callbackFailFunction == "") {
        mcpjs["util/util"].commonAlert(error);
      } else {
        callbackFailFunction(caller, error);
      }
    });
}
// export function getCommonMcisData(caller, mcisID) {// old
//     //var orgUrl = "/operation/manages/mcismng/:mcisID";
//     // McisData
//     var urlParamMap = new Map();
//     urlParamMap.set(":mcisID", mcisID)
//     var url = mcpjs['util/pathfinder'].setUrlByParam(mcpjs['util/pathfinder'].getWebToolUrl('McisData'), urlParamMap)
//     console.log("mcis get url : ", url);
//     axios.get(url, {

//     }).then(result => {
//         console.log(result);
//         if (result.data.status == 200 || result.data.status == 201) {
//             mcpjs['mcismng/mcismng'].getCommonMcisDataCallbackSuccess(caller, result.data.McisInfo, mcisID)
//         } else {
//             //getMcisDataCallbackFail(caller, data)
//            mcpjs['util/util'].commonErrorAlert(result.data.status, "MCIS Data Search Failed");
//         }
//     }).catch(error => {
//         console.warn(error);
//         console.log(error.response)
//         var errorMessage = error.response.data.error;
//         var statusCode = error.response.status;
//        mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage);
//     });
// }

// MCIS 상세정보 조회
export function getCommonMcisStatusData(
  caller,
  mcisID,
  callbackSuccessFunction,
  callbackFailFunction
) {
  var urlParamMap = new Map();
  urlParamMap.set(":mcisID", mcisID);
  var url = mcpjs["util/pathfinder"].setUrlByParam(
    mcpjs["util/pathfinder"].getWebToolUrl("McisStatusData"),
    urlParamMap
  );
  console.log("mcisstatus get url : ", url);
  axios
    .get(url, {})
    .then((result) => {
      console.log(result);
      if (result.data.status == 200 || result.data.status == 201) {
        callbackSuccessFunction(caller, result.data.McisStatusInfo, mcisID);
      } else {
        mcpjs["util/util"].commonErrorAlert(
          result.data.status,
          "MCIS Status Data Search Failed"
        );
      }
    })
    .catch((error) => {
      console.warn(error);
      if (callbackFailFunction == undefined || callbackFailFunction == "") {
        mcpjs["util/util"].commonAlert(error);
      } else {
        callbackFailFunction(caller, error);
      }
    });
}

export function getCommonMcksList(caller, optionParam) {
  var url = "/operations/mcksmng";

  if (optionParam != undefined) {
    url += "?option=" + optionParam;
  }

  axios
    .get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((result) => {
      console.log("get Mcks List : ", result.data);

      var data = result.data.McksList;

      console.log("return get Data");
      mcpjs["mcksmng/mcksmng"].getMcksListCallbackSuccess(caller, data);
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      getMcksListCallbackFail(error);
    });
}

export function getCommonVmSecurityGroupInfo(caller, securityGroupId) {
  var url = "/settings/resources/securitygroup/id/" + securityGroupId;

  axios
    .get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((result) => {
      console.log("get SecurityGroup List : ", result.data);

      var data = result.data.SecurityGroupInfo;

      // if ( caller == "mainmcis") {
      console.log("return get Data");
      getSecurityGroupCallbackSuccess(caller, data);
      // }
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      getSecurityGroupCallbackFail(error);
    });
}

export function getCommonVmImageInfo(caller, vmImageId) {

  var actionName = "VmImageGet";
  var optionParamMap = new Map();
  optionParamMap.set("{vmImageId}", vmImageId);
  mcpjs["util/pathfinder"].getCommonData( caller, actionName, optionParamMap, mcpjs["mcismng/mcismng"].getCommonVmImageInfoCallbackSuccess );
  
  // //var url = CommonURL+"/ns/"+NAMESPACE+"/resources/image/"+imageId
  // // var apiInfo = ApiInfo
  // var url = "/settings/resources/vmimage/id/" + imageId;
  // axios
  //   .get(url, {
  //     // headers:{
  //     //     'Authorization': apiInfo
  //     // }
  //   })
  //   .then((result) => {
  //     console.log(result);
  //     mcpjs["mcismng/mcismng"].getCommonVmImageInfoCallbackSuccess(
  //       caller,
  //       result.data.VirtualMachineImageInfo
  //     );
  //   });
}

// Namespace에 등록된 VM 들을 keyword로 조회
export function getCommonNamespaceVmImageList(
  keywordList,
  caller,
  callbackSuccessFunction
) {
  // console.log("keywordObjId = " + keywordObjId)
  // var keywords = $("#" + keywordObjId).val().split(" ");
  // console.log("keywords = " + keywords)
  // var keywordList = new Array();
  // for (var i = 0; i < keywords.length; i++) {
  //     keywordList.push(keywords[i]);
  // }

  var url = getURL("SearchVirtualMachineImageList");
  //var url = "/settings/resources/vmimage/namespace/";
  client
    .post(url, {
      // headers:{
      //     'Authorization': apiInfo
      // }
      keywords: keywordList,
    })
    .then((result) => {
      console.log("result", result);

      if (
        result.data.VirtualMachineImageList == null ||
        result.data.VirtualMachineImageList == undefined ||
        result.data.VirtualMachineImageList == "null"
      ) {
        mcpjs["util/util"].commonAlert("There is no result");
      } else {
        //getCommonNamespaceVmImageListCallbackSuccess(caller, result.data.VirtualMachineImageList);
        callbackSuccessFunction(caller, result);
      }
    });
}

// namespace의 spec을 조건에 filter하여 가져옴
// spec load 를 하면 system-purpose-common-ns 에 들어감.
export function getCommonFilterVmSpecListByRange(
  specFilterObj,
  caller,
  callbackSuccessFunction
) {
  console.log(specFilterObj);
  var url = "/settings/resources/vmspec/filterspecsbyrange";
  client
    .post(url, specFilterObj)
    .then((result) => {
      console.log(result);

      if (
        result.data.VmSpecList == null ||
        result.data.VmSpecList == undefined ||
        result.data.VmSpecList == "null"
      ) {
        mcpjs["util/util"].commonAlert("There is no result");
      } else {
        callbackSuccessFunction(caller, result.data.VmSpecList);
      }
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      mcpjs["util/util"].commonAlert(error);
    });
}

// MCIS에 명령어 날리기
export function postRemoteCommandMcis(mcisID, commandWord) {
  var orgUrl = "/operations/manages/mcismng/cmd/mcis/:mcisID";
  var urlParamMap = new Map();
  urlParamMap.set(":mcisID", mcisID);
  var url = setUrlByParam(orgUrl, urlParamMap);

  console.log(" command = " + commandWord);
  client
    .post(url, {
      // headers: {
      //     'Content-Type': "application/json"
      // },
      command: commandWord,
    })
    .then((result) => {
      console.log(result);
      if (result.data.status == 200 || result.data.status == 201) {
        mcpjs["util/util"].commonAlert(
          "Success to Send the Command " + result.data.message
        );
      } else {
        mcpjs["util/util"].commonAlert(
          "Fail to Send the Command " + result.data.message
        );
      }
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      var errorMessage = error.response.data.error;
      var statusCode = error.response.status;
      mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
    });
}

// VM에 명령어 날리기
export function postRemoteCommandVmOfMcis(mcisID, vmID, commandWord) {
  //RemoteCommandVmOfMcis
  var orgUrl = "/operations/manages/mcismng/cmd/mcis/:mcisID/vm/:vmID";
  var urlParamMap = new Map();
  urlParamMap.set(":mcisID", mcisID);
  urlParamMap.set(":vmID", vmID);
  var url = setUrlByParam(orgUrl, urlParamMap);

  console.log(" command = " + commandWord);
  client
    .post(url, {
      // headers: {
      //     'Content-Type': "application/json"
      // },
      command: commandWord,
    })
    .then((result) => {
      console.log(result);
      if (result.data.status == 200 || result.data.status == 201) {
        mcpjs["util/util"].commonAlert(
          "Success to Send the Command " + result.data.message
        );
      } else {
        mcpjs["util/util"].commonAlert(
          "Fail to Send the Command " + result.data.message
        );
      }
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      var errorMessage = error.response.data.error;
      var statusCode = error.response.status;
      mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
    });
}

// dragonfly monitoring agent 설치 및 동작여부
export function checkDragonFlyMonitoringAgent(mcisID, vmID) {
  return true;
}
// form 화면에서 조회에 문제가 있는 경우 표시
// 모든 form 화면 시작할 때(onLoad 시) 체크하도록
// Header.html 에 정의
export function checkLoadStatus() {
  var returnMessage = $("#returnMessage").val();
  var returnStatusCode = $("#returnStatusCode").val();
  if (returnStatusCode != 200 && returnStatusCode != 201) {
    mcpjs["util/util"].commonErrorAlert(returnStatusCode, returnMessage);
  }
}

export function getCommonNetworkListByProviderRegionZone(
  caller,
  providerId,
  regionName,
  zoneName
) {
  console.log("vnet : ");

  // mcon에 등록된 vnet목록에서 connection을 찾아
  var url =
    "/settings/resources/vnet/region/?is_cb=N&providerId=" +
    providerId +
    "&regionName=" +
    regionName +
    "&zoneName=" +
    zoneName;

  axios
    .get(url, {
      headers: {
        // 'Authorization': apiInfo
      },
    })
    .then((result) => {
      var data = result.data.VNetList;
      console.log("vNetwork Info : ", result);
      console.log("vNetwork data : ", data);
      //setTotalNetworkList(data)
      if (caller == "mciscreatesimple") {
        mcpjs["mcismng/mciscreate"].getNetworkListCallbackSuccess(caller, data);
      } else {
        getNetworkListCallbackSuccess(caller, data);
      }
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      // var errorMessage = error.response.data.error;
      // var statusCode = error.response.status;
      //mcpjs['util/util'].commonErrorAlert(statusCode, errorMessage)
      getNetworkListCallbackFail(caller, error);
    });
}

// 공통으로 Data 가져와서 DataSet을 Return하는 function
// caller : 결과 사용하는 곳에서 호출 구별용.
// actionName : path를 가져오는 keyName
// urlParamMap : url에 포함되는 parameter들. mcis/{mcisId} 등
// optionParam : 특정 return 형태. id 목록만 가져오는 경우 option=id, 기본은 목록
// filterKeyValMap : filter 하기위한 조건이 추가로 있는 경우 connectionName=xxx
// providerRegionZoneMap : 각 provider, region, zone 이 있는 경우 filter조건으로 사용
// callbackSuccessFunction : 성공시 return할 function.  ex) mcpjs['mcismng/mciscreate].getXX 형태로 넣기
// callbackFailFuction : 실패시 return할 function. undefined면 commomAlert로 error 표시
export function getCommonResourceList(
  caller,
  actionName,
  callbackSuccessFunction,
  callbackFailFunction,
  urlParamMap,
  optionParam,
  filterKeyValMap,
  mconParamMap
) {
  console.log("actionName", actionName);
  console.log("urlParamMap", urlParamMap);
  console.log("optionParam", optionParam);
  console.log("filterKeyValMap", filterKeyValMap);
  console.log("mconParamMap", mconParamMap);

  var url = getURL(actionName, urlParamMap);

  // var url = mcpjs['util/pathfinder'].getWebToolUrl(actionName);

  // // path paremeter : 경로에 parameter가 있는 경우 replace
  // url = setUrlByParam(url, urlParamMap)

  // url = url + "?option=";// ID 목록만인지 전체 목록인지 구분
  // if (optionParam != undefined && optionParam != ""){
  //     url = url + "" + optionParam
  // }

  // // query parameter
  // // - 정의된 query param
  // url = url + setQueryParam(filterKeyValMap)

  // // - connection 대체 query param
  // url = url + setQueryParam(mconParamMap)
  //console.log(mconParamMap)

  axios
    .get(url, {
      headers: {},
    })
    .then((result) => {
      var data = result.data;
      console.log("get data : ", data);
      callbackSuccessFunction(caller, data);
    })
    .catch((error) => {
      console.warn(error);
      if (callbackFailFunction == undefined || callbackFailFunction == "") {
        mcpjs["util/util"].commonAlert(error);
      } else {
        callbackFailFunction(caller, error);
      }
    });
}

// 모든 PMKS 목록 조회
export function getCommonAllPmksList(caller) {
  var url = getWebToolUrl("PmksListOfNamespace");
  axios
    .get(url, {
      headers: {
        //'Content-Type': "application/json"
      },
    })
    .then((result) => {
      //        console.log("get Cluster List : ", result.data);
      console.log(result);
      mcpjs["pmksmng/pmksmng"].getCommonAllPmksListSuccess(
        caller,
        result.data.PmksList
      );
    })
    .catch((error) => {
      console.log(error);
      mcpjs["util/util"].commonAlert("Search Failed", error.message);
    });
}

// 사용가능한 disk type 조회
export function getCommonLookupDiskInfo(
  caller,
  providerId,
  regionName,
  callbackSuccessFunction,
  callbackFailFunction
) {
  var controllerKeyName = "AvailableDataDiskTypeList";
  var optionParamMap = new Map();
  optionParamMap.set("providerId", providerId);
  optionParamMap.set("regionName", regionName);

  if (callbackFailFunction == undefined) {
    getCommonData(
      caller,
      controllerKeyName,
      optionParamMap,
      callbackSuccessFunction
    );
  } else {
    getCommonData(
      caller,
      controllerKeyName,
      optionParamMap,
      callbackSuccessFunction,
      callbackFailFunction
    );
  }

  // var url = "/settings/resources/datadisk/lookup"
  // url += "?providerId=" + providerId + "&regionName=" + regionName
  // console.log("disk get url: ", url);

  // axios.get(url, {
  //     headers: {
  //         //'Content-Type': "application/json"
  //     }
  // }).then(result => {
  //     console.log("get LookupDisk  : ", result.data);

  //     var data = result.data.DiskInfoList;
  //     callbackSuccessFunction(caller, data)

  // }).catch(error => {
  //     console.log(error);
  // });
}

// 추천 vm spec 목록
export function getCommonRecommendVmSpecList(
  caller,
  paramObj,
  callbackSuccessFunction,
  callbackFailFunction
) {
  var url = "/operations/mcismng/recommendvmspec";

  client
    .post(url, paramObj, {
      headers: {
        "Content-type": "application/json",
      },
    })
    .then((result) => {
      console.log("result spec : ", result);
      var statusCode = result.data.status;
      if (statusCode == 200 || statusCode == 201) {
        console.log("recommend vm result: ", result.data);
        callbackSuccessFunction(caller, result.data.VmSpecList);
      } else {
        var message = result.data.message;
        mcpjs["util/util"].commonAlert(
          "Fail Create Spec : " + message + "(" + statusCode + ")"
        );
      }
    })
    .catch((error) => {
      console.warn(error);
      console.log(error.response);
      var errorMessage = error.response.data.error;
      var statusCode = error.response.status;
      if (callbackFailFunction) {
        callbackFailFunction(caller, error);
      } else {
        mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
      }
    });
}

// Mcis의 subgroupId 목록
export function getCommonMcisSubgroupIdList(
  caller,
  mcisId,
  callbackSuccessFunction,
  callbackFailFunction
) {
  console.log("getVmList()");
  var mcisId = $("#mcis_id").val();

  // /operation/manages/mcis/:mcisID
  var urlParamMap = new Map();
  urlParamMap.set(":mcisID", mcisId);

  var url = mcpjs["util/pathfinder"].setUrlByParam(
    mcpjs["util/pathfinder"].getWebToolUrl("McisSubgroupIdList"),
    urlParamMap
  );

  axios
    .get(url, {})
    .then((result) => {
      console.log("getMcisSubgroupIdList data : ", result);
      var statusCode = result.data.status;
      if (statusCode == 200 || statusCode == 201) {
        console.log("recommend vm result: ", result.data);
        callbackSuccessFunction(caller, result.data.SubgroupIdList.output);
      } else {
        var message = result.data.message;
        mcpjs["util/util"].commonAlert(
          "Fail To get SubgroupList : " + message + "(" + statusCode + ")"
        );
      }
    })
    .catch((error) => {
      console.log(error);
      var errorMessage = error.response.data.error;
      var statusCode = error.response.status;
      if (callbackFailFunction) {
        callbackFailFunction(caller, error);
      } else {
        mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
      }
    });
}

// vm의 monitoring metric 조회
export function getCommonVmMonitoringMetric(
  mcisID,
  vmID,
  metric,
  periodType,
  statisticsCriteria,
  duration,
  callbackSuccessFunction,
  callbackFailFunction
) {
  console.log("====== Start GetMetric ====== ");
  var color = "";
  var metric_size = "";

  var url = getURL("McisMonitoringDurationMetric");
  //var url = "/operations/monitoring/mcismonitoring/"
  console.log("Request URL : ", url);
  client
    .post(url, {
      headers: {},
      McisID: mcisID,
      VmID: vmID,
      Metric: metric,
      PeriodType: periodType,
      StatisticsCriteria: statisticsCriteria,
      Duration: duration,
    })
    .then((result) => {
      console.log(result);
      var statusCode = result.data.status;
      var message = result.data.message;

      if (statusCode != 200 && statusCode != 201) {
        mcpjs["util/utl"].commonAlert(message + "(" + statusCode + ")");
        return;
      } else {
        var data = result.data.VMMonitoringInfo;
        callbackSuccessFunction(data);
      }
    })
    .catch((error) => {
      console.warn(error);

      console.log(error.response);
      var errorMessage = error.response.data.error;
      var statusCode = error.response.status;
      if (callbackFailFunction == undefined || callbackFailFunction == "") {
        mcpjs["util/util"].commonErrorAlert(statusCode, errorMessage);
      } else {
        callbackFailFunction(error);
      }
    });
}

// 좌측메뉴
export function setLeftMenu() {
  //mcpjs['util/pathfinder'].getCommonData("vpcmng", "VpcList", optionParamMap, mcpjs['network/vnetmng'].getVpcListCallbackSuccess)
  //var url = "/api/adminconfig/menumng/menutree";
  var url = getURL("MenuTree");
  axios
    .get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((result) => {
      var data = result.data;
      //console.log("get data : ", data);
      var menuTree = result.data.menutree;

      var depth1Arr = new Array();
      var depth2Arr = new Array();
      //var depth3Arr = new Array()
      // 대분류
      for (var i in menuTree) {
        var html = "";
        var menuItem = menuTree[i];
        //console.log(menuItem)
        if (menuItem.level == 0) {
          var depth1Id = "dep1_" + menuItem.category_id;
          html += "<div>";
          html +=
            '<p class="mainnav__caption mt-2 mb-2 px-3">' +
            menuItem.category_name +
            "</p>";
          html +=
            '<ul class="mainnav__menu nav flex-column" id="' +
            depth1Id +
            '"></ul>';
          html += "</div>";
          depth1Arr.push(depth1Id);
          $("#menu_left").append(html);
        }
        //console.log(html)
      }

      //console.log(depth1Arr)
      // 중분류
      for (var j in depth1Arr) {
        //console.log("j = ", j)

        for (var i in menuTree) {
          //console.log("menuTree = ", i)
          var html = "";
          var menuItem = menuTree[i];
          var depth2Id = "dep2_" + j + "_" + menuItem.category_id; // parentIndex + category_id
          //console.log(depth1Arr[j])
          //console.log(menuItem)
          if (menuItem.level != 1) continue;

          if (
            menuItem.parent_category_id == depth1Arr[j].replace("dep1_", "")
          ) {
            html += '<li class="nav-item has-sub">';
            html +=
              '<a href="javascript:void(0);" class="mininav-toggle nav-link collapsed">';
            html +=
              '<span class="material-icons-outlined md-20">' +
              "dashboard" +
              "</span>";
            html +=
              '<span class="nav-label">' + menuItem.category_name + "</span>";
            html += "</a>";
            html +=
              '<ul class="mininav-content nav collapse" id="' +
              depth2Id +
              '"></ul>';
            $("#" + depth1Arr[j]).append(html);
            html += "</li>";
            depth2Arr.push(depth2Id);
          }
          //console.log(html)
        }
      }
      console.log(depth2Arr);
      // 소분류 : 하위 + 링크 : parent_category 아레에
      for (var k in depth2Arr) {
        //console.log("aaa ", depth2Arr[k])

        for (var i in menuTree) {
          var html = "";
          var menuItem = menuTree[i];
          var depth3Id = "dep3_" + k + "_" + menuItem.category_id;

          if (menuItem.level != 2) continue;
          if (depth2Arr[k].indexOf(menuItem.parent_category_id) > -1) {
            html += '<li class="nav-item">';
            html +=
              "	<a href=\"javascript:void(0);\" onclick=\"mcpjs['util/util'].changePage('" +
              menuItem.id +
              '\')" class="nav-link">' +
              menuItem.name +
              "</a>";
            html += "</li>";
            $("#" + depth2Arr[k]).append(html);
            //console.log("html = ", html)
          }
        }
      }

      // left menu 애니메이션 다시 적용
      // application.html에 한 번 적용되어 있어서 기존 메뉴는 애니메이션이 제대로 동작하지 않음
      // TO DO : setLeftMenu에서만 호출하도록 변경 필요
      mcpjs["util/common"].lnb_on();
    })
    .catch((error) => {
      console.warn(error);
      mcpjs["util/util"].commonAlert(error);
    });
}
