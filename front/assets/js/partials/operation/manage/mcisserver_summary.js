console.log("mcisserver_summary.js");

//var callbackFunction;
// 
export function initMcisServerSummary(callbackStatusChangedFunction, totalMcisStatusObj) {
    console.log("initMcisServerSummary" , totalMcisStatusObj)
    if( totalMcisStatusObj != undefined){
        displayMcisStatusArea(totalMcisStatusObj.totalMcisStatusMap);
        displayVmStatusArea(totalMcisStatusObj.totalVmStatusMap)
    }
//    callbackFunction = callbackStatusChangedFunction;
}

// mcis 상태별 count 값을 표시
export function displayMcisStatusArea(totalMcisStatusMap) {
    console.log("displayMcisStatusArea");
    var sumMcisCnt = 0;
    var sumMcisRunningCnt = 0;
    var sumMcisStopCnt = 0;
    var sumMcisTerminateCnt = 0;
    totalMcisStatusMap.forEach((value, key) => {
      var statusRunning = value.get("running");
      var statusStop = value.get("stop");
      var statusTerminate = value.get("terminate");
      sumMcisRunningCnt += statusRunning;
      sumMcisStopCnt += statusStop;
      sumMcisTerminateCnt += statusTerminate;
      console.log("totalMcisStatusMap :: ", key, value);
    });
    sumMcisCnt = sumMcisRunningCnt + sumMcisStopCnt + sumMcisTerminateCnt;
  
    $("#total_mcis").text(sumMcisCnt);
    $("#mcis_status_running").text(sumMcisRunningCnt);
    $("#mcis_status_stopped").text(sumMcisStopCnt);
    $("#mcis_status_terminated").text(sumMcisTerminateCnt);
    console.log("displayMcisStatusArea ");
    console.log("running status count ", $("#mcis_status_running").text());
}
  


  // 화면 표시
function displayVmStatusArea(totalVmStatusMap) {    
    var sumVmCnt = 0;
    var sumVmRunningCnt = 0;
    var sumVmStopCnt = 0;
    var sumVmTerminateCnt = 0;
    totalVmStatusMap.forEach((value, key) => {
      var statusRunning = value.get("running");
      var statusStop = value.get("stop");
      var statusTerminate = value.get("terminate");
      sumVmRunningCnt += statusRunning;
      sumVmStopCnt += statusStop;
      sumVmTerminateCnt += statusTerminate;
    });
    sumVmCnt = sumVmRunningCnt + sumVmStopCnt + sumVmTerminateCnt;
    $("#total_vm").text(sumVmCnt);
    $("#vm_status_running").text(sumVmRunningCnt);
    $("#vm_status_stopped").text(sumVmStopCnt);
    $("#vm_status_terminated").text(sumVmTerminateCnt);
}
  


  
