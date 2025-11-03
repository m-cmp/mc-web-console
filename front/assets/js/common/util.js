import { TabulatorFull as Tabulator } from "tabulator-tables";

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


// 화면이동 
export function changePage(target, urlParamMap) {
  var url = "";
  // target에 따라 url을 달리한다.

  // pathParam을 뒤에 붙인다.
  var keyIndex = 0;
  for (let key of urlParamMap.keys()) {
    console.log("urlParamMap " + key + " : " + urlParamMap.get(key));

    var urlParamValue = urlParamMap.get(key)

    if (keyIndex == 0) {
      url += "?" + key + "=" + urlParamValue;
    } else {
      url += "&" + key + "=" + urlParamValue;
    }

  }

  // 해당 화면으로 이동한다.
  location.href = url;
}




///////////////////////

export function isEmpty(str) {
  if (typeof str == "undefined" || str == null || str == "")
    return true;
  else
    return false;
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

// sw 설치화면으로 이동.
export function installSwtoVm(){
  // 
  window.location = "/webconsole/operations/manage/swcatalogs";
}

// 날자 포맷 변경
// ex) "2024-10-17T01:27:34.25956Z"; -> 2024-10-17 01:27:34
export function dateYYYYMMDDHH24MISS(dateString) {
  const date = new Date(dateString);

  // 각 값 가져오기
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // 형식에 맞춰서 문자열로 반환
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Show toast notification message
 * Toast 알림 메시지를 표시합니다.
 * 
 * @param {string} message - The message to display / 표시할 메시지
 * @param {string} [type='info'] - Toast type (success, error, warning, info) / Toast 타입
 * @param {number} [duration=5000] - Display duration in milliseconds / 표시 시간 (밀리초)
 * 
 * @example
 * showToast('Operation completed successfully', 'success');
 * showToast('An error occurred', 'error', 3000);
 */
export function showToast(message, type = 'info', duration = 5000) {
  // toast container가 없으면 생성
  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }

  // toast 타입에 따른 색상 및 아이콘 설정
  const typeConfig = {
    success: {
      bgClass: 'bg-success',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-check" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M5 12l5 5l10 -10" /></svg>',
      title: 'Success'
    },
    error: {
      bgClass: 'bg-danger',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-x" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>',
      title: 'Error'
    },
    warning: {
      bgClass: 'bg-warning',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-alert-triangle" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 9v4" /><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" /><path d="M12 16h.01" /></svg>',
      title: 'Warning'
    },
    info: {
      bgClass: 'bg-info',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-info-circle" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" /><path d="M12 9h.01" /><path d="M11 12h1v4h1" /></svg>',
      title: 'Info'
    }
  };

  const config = typeConfig[type] || typeConfig.info;
  const toastId = 'toast-' + Date.now();

  // toast HTML 생성
  const toastHTML = `
    <div id="${toastId}" class="toast align-items-center text-white ${config.bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          <div class="d-flex align-items-center">
            <div class="me-2">${config.icon}</div>
            <div>
              <strong>${config.title}</strong>
              <div class="text-white-50">${message}</div>
            </div>
          </div>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  // toast를 container에 추가
  toastContainer.insertAdjacentHTML('beforeend', toastHTML);

  // toast 객체 생성 및 표시
  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, {
    autohide: true,
    delay: duration
  });

  toast.show();

  // toast가 완전히 숨겨진 후 DOM에서 제거
  toastElement.addEventListener('hidden.bs.toast', function () {
    toastElement.remove();
  });
}