var table
var checked_array = []

$(function () {

    // 임시 데이터 input
    $('.setDatabtn').on('click', function() {
        const arr=[{
            schedName:'testname',
            schedDesc:'testDescriasdjasjasjasjdas',
            schedStatus:'testRun',
            schedCron:'* * */5 * *',
            schedAction:'start',
            schedLastact:'2018-05-13 00:00',
            schedValidity:'2022-06-15 00:00'
        },
        {
            schedName:'testname2',
            schedDesc:'testDescriasdjasjasjasjdas',
            schedStatus:'testRun',
            schedCron:'* * */5 * *',
            schedAction:'start',
            schedLastact:'2018-05-13 00:00',
            schedValidity:'2022-06-15 00:00'
        }
    ]
        
        table.setData(arr)
    });

    var tableObjParams = {}

    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
        {title:"Scheduler ID", field:"schedDesc", visible: false},
        {title:"Scheduler Desc", field:"schedDesc", visible: false},
        {title:"Scheduler Name", field:"schedName", vertAlign: "middle"},
        {title:"status", field:"schedStatus", vertAlign: "middle"}, // notStarted, running, stop, expired, error
        {title:"CRON", field:"schedCron", vertAlign: "middle"}, // 호버이벤트로 human redable 추가 예정
        {title:"Action", field:"schedAction", vertAlign: "middle"},
        {title:"last activate", field:"schedLastact", vertAlign: "middle"}, // log 뷰어 연결 예정 + 실행 예정일 예정 -> 팝업창으로 구현
        {title:"Validity DATE", field:"schedValidity", vertAlign: "middle"}, // startDate - endDate
    ]
    
    table = mcpjs["util/util"].setTabulator("schedList", tableObjParams, columns)

    table.on("rowSelectionChanged", function(data, rows){
		checked_array = data
	 });

});

export function manageScheduler(type) {

    if (checked_array.length > 1) {
        mcpjs['util/util'].commonAlert("Please Select One Scheduler at a time")
        return;
    }

    if (checked_array.length == 0) {
        mcpjs['util/util'].commonAlert("Please Select Scheduler!!")
        return;
    }

    if (checked_array.length == 1) {
        console.log(checked_array)
        schedulermngExist(checked_array[0])
        mcpjs['util/util'].commonAlert("Scheduler loaded");
        return;
    }
    
}

function schedulermngExist(checked_array){
    $("#taskname").val(checked_array["schedName"])
}


function statusFormatter(cell) {
    var mcisDispStatus = mcpjs['util/common'].getMcisStatusDisp(cell.getData().status);// 화면 표시용 status
    var mcisStatusCell = '<img title="' + cell.getData().status + '" src="/assets/images/contents/icon_' + mcisDispStatus + '.png" class="icon" alt="">'
  
    return mcisStatusCell
  }

function providerFormatter(cell) {
  var vmCloudConnectionMap = mcpjs['util/util'].calculateConnectionCount(cell.getData().vm);
  var mcisProviderCell = ""
  vmCloudConnectionMap.forEach((value, key) => {
      mcisProviderCell += '<img class="provider_icon" src="/assets/images/contents/img_logo_' + key + '.png" alt="' + key + '"/>'
  })

  return mcisProviderCell
}

export function mcisTotalListExport() {
    var namespace = $("#topboxDefaultNameSpaceName").text()
    table.download("csv", namespace.toUpperCase() + "-MCIS.csv", {delimiter:","})
} 
