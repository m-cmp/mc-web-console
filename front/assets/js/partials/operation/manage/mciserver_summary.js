// console.log("mciserver_summary.js");

// //var callbackFunction;
// // 
// export function initMciServerSummary(callbackStatusChangedFunction, totalMciStatusObj) {
//     console.log("initMciServerSummary" , totalMciStatusObj)
//     if( totalMciStatusObj != undefined){
//         displayMciStatusArea(totalMciStatusObj.totalMciStatusMap);
//         displayVmStatusArea(totalMciStatusObj.totalVmStatusMap)
//     }
// //    callbackFunction = callbackStatusChangedFunction;
// }

// // mci 상태별 count 값을 표시
// export function displayMciStatusArea(totalMciStatusMap) {
//     console.log("displayMciStatusArea");
//     var sumMciCnt = 0;
//     var sumMciRunningCnt = 0;
//     var sumMciStopCnt = 0;
//     var sumMciTerminateCnt = 0;
//     totalMciStatusMap.forEach((value, key) => {
//       var statusRunning = value.get("running");
//       var statusStop = value.get("stop");
//       var statusTerminate = value.get("terminate");
//       sumMciRunningCnt += statusRunning;
//       sumMciStopCnt += statusStop;
//       sumMciTerminateCnt += statusTerminate;
//       console.log("totalMciStatusMap :: ", key, value);
//     });
//     sumMciCnt = sumMciRunningCnt + sumMciStopCnt + sumMciTerminateCnt;
  
//     $("#total_mci").text(sumMciCnt);
//     $("#mci_status_running").text(sumMciRunningCnt);
//     $("#mci_status_stopped").text(sumMciStopCnt);
//     $("#mci_status_terminated").text(sumMciTerminateCnt);
//     console.log("displayMciStatusArea ");
//     console.log("running status count ", $("#mci_status_running").text());
// }
  


//   // 화면 표시
// function displayVmStatusArea(totalVmStatusMap) {    
//     var sumVmCnt = 0;
//     var sumVmRunningCnt = 0;
//     var sumVmStopCnt = 0;
//     var sumVmTerminateCnt = 0;
//     totalVmStatusMap.forEach((value, key) => {
//       var statusRunning = value.get("running");
//       var statusStop = value.get("stop");
//       var statusTerminate = value.get("terminate");
//       sumVmRunningCnt += statusRunning;
//       sumVmStopCnt += statusStop;
//       sumVmTerminateCnt += statusTerminate;
//     });
//     sumVmCnt = sumVmRunningCnt + sumVmStopCnt + sumVmTerminateCnt;
//     $("#total_vm").text(sumVmCnt);
//     $("#vm_status_running").text(sumVmRunningCnt);
//     $("#vm_status_stopped").text(sumVmStopCnt);
//     $("#vm_status_terminated").text(sumVmTerminateCnt);
// }
  


  
