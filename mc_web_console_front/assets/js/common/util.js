// default workspace에서 sessionstorage를 사용하지 않을때, 아래에서 리턴값 재정의
// workspace
export function getCurrentWorkspace() {
    return webconsolejs["common/storage/sessionstorage"].getSessionCurrentWorkspace()
}
export function setCurrentWorkspace(v) {
    webconsolejs["common/storage/sessionstorage"].setSessionCurrentWorkspace(v)
}

export function getCurrentProject() {
    return webconsolejs["common/storage/sessionstorage"].getSessionCurrentProject()
}
export function setCurrentProject(v) {
    webconsolejs["common/storage/sessionstorage"].setSessionCurrentProject(v)
}

// workspace project List
export function getCurrentWorkspaceProjectList() {
    return webconsolejs["common/storage/sessionstorage"].getSessionWorkspaceProjectList()
}
export function setCurrentWorkspaceProjectList(v) {
    webconsolejs["common/storage/sessionstorage"].setSessionWorkspaceProjectList(v)
}

export function clearCurrentWorkspaceProject() {
    webconsolejs["common/storage/sessionstorage"].clearSessionCurrentWorkspaceProject()
}

function isEmpty(str) {
    if (typeof str == "undefined" || str == null || str == "")
        return true;
    else
        return false;
}

export function setTabulator(
    tableObjId,
    tableObjParamMap,
    columnsParams,
    isMultiSelect
  ) {
    var placeholder = "No Data";
    var pagination = "local";
    var paginationSize = 5;
    var paginationSizeSelector = [5, 10, 15, 20];
    var movableColumns = true;
    var columnHeaderVertAlign = "middle";
    var paginationCounter = "rows";
    var layout = "fitColumns";
  
    if (tableObjParamMap.hasOwnProperty("placeholder")) {
      placeholder = tableObjParamMap.placeholder;
    }
  
    if (tableObjParamMap.hasOwnProperty("pagination")) {
      pagination = tableObjParamMap.pagination;
    }
  
    if (tableObjParamMap.hasOwnProperty("paginationSize")) {
      paginationSize = tableObjParamMap.paginationSize;
    }
  
    if (tableObjParamMap.hasOwnProperty("paginationSizeSelector")) {
      paginationSizeSelector = tableObjParamMap.paginationSizeSelector;
    }
  
    if (tableObjParamMap.hasOwnProperty("movableColumns")) {
      movableColumns = tableObjParamMap.movableColumns;
    }
  
    if (tableObjParamMap.hasOwnProperty("columnHeaderVertAlign")) {
      columnHeaderVertAlign = tableObjParamMap.columnHeaderVertAlign;
    }
  
    if (tableObjParamMap.hasOwnProperty("paginationCounter")) {
      paginationCounter = tableObjParamMap.paginationCounter;
    }
  
    if (tableObjParamMap.hasOwnProperty("layout")) {
      layout = tableObjParamMap.layout;
    }
  
    var tabulatorTable = new Tabulator("#" + tableObjId, {
      //ajaxURL:"http://localhost:3000/operations/mcismng?option=status",
      placeholder,
      pagination,
      paginationSize,
      paginationSizeSelector,
      movableColumns,
      columnHeaderVertAlign,
      paginationCounter,
      layout,
      columns: columnsParams,
      selectable: isMultiSelect == false ? 1 : true,
    });
  
    return tabulatorTable;
}
// column show & hide
export function displayColumn(table) {
	$(".display-column").on("click", function () {
	  if ($(this).children("input:checkbox").is(":checked")) {
		$(this).children(".material-icons").text("visibility");
		table.showColumn($(this).data("column"));
	  } else {
		$(this).children(".material-icons").text("visibility_off");
		table.hideColumn($(this).data("column"));
	  }
	});
}

// mcis내 vm들의 provider별 connection count
export function calculateConnectionCount(vmList) {

// console.log("calculateConnectionCount")
// console.log(vmList)
console.log("asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd", vmList)
var vmCloudConnectionCountMap = new Map();

for (var vmIndex in vmList) {
	var aVm = vmList[vmIndex];
    console.log("qwe", aVm)
	var location = aVm.location;
    console.log("qwer", location)
	if (!isEmpty(location)) {
	var cloudType = location.cloudType;
	if (vmCloudConnectionCountMap.has(cloudType)) {
		vmCloudConnectionCountMap.set(
		cloudType,
		vmCloudConnectionCountMap.get(cloudType) + 1
		);
	} else {
		vmCloudConnectionCountMap.set(cloudType, 0);
	}
	}
}
console.log("vmCloudConnectionCountMapvmCloudConnectionCountMapvmCloudConnectionCountMap",vmCloudConnectionCountMap)
return vmCloudConnectionCountMap;
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