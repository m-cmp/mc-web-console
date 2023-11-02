import { VPC_MAP } from "../util/util";

var table
var checked_array = []

$(function () {
    initTable()
});

function initTable() {
    var tableObjParams = {}

    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
        {title:"id", field:"id",headerHozAlign: "center", vertAlign: "middle", hozAlign: "center"},
        {title:"name", field:"name",headerHozAlign: "center", vertAlign: "middle", hozAlign: "center"},
        {title:"description", field:"description",headerHozAlign: "center", vertAlign: "middle", hozAlign: "center"},
        {title:"sort", field:"sort",headerHozAlign: "center", vertAlign: "middle", hozAlign: "center"},
        {title:"category_id", field:"category_id",headerHozAlign: "center", vertAlign: "middle", hozAlign: "center"},
        {title:"created_at", field:"created_at",headerHozAlign: "center", vertAlign: "middle", hozAlign: "center", visible: false},
        {title:"updated_at", field:"updated_at",headerHozAlign: "center", vertAlign: "middle", hozAlign: "center", visible: false},
        {title:"alias", field:"alias",headerHozAlign: "center", vertAlign: "middle", hozAlign: "center",visible: false},
        {title:"visible", field:"visible",headerHozAlign: "center", vertAlign: "middle", hozAlign: "center"},
    ]

    table = mcpjs["util/util"].setTabulator("MenuListTable", tableObjParams, columns)

    table.on("rowClick", function(e, row){
        mcpjs['util/common'].displayStateChange("menu", "INFO", row)
    });

    table.on("rowSelectionChanged", function(data, rows){
       checked_array = data
    });

    // column show & hide 기능
    mcpjs['util/util'].displayColumn(table)

    var optionParamMap = new Map();
    mcpjs['util/pathfinder'].getCommonData("adminmng", "MenuList", optionParamMap, mcpjs['adminconfig/menumng'].getMenuListCallbackSuccess)
}

// 메뉴 삭제
export function deleteMenu(){
    // if (checked_array.length<1){mcpjs["util/util"].commonAlert("Please select at least one to delete.");return;}
    
    // checked_array.forEach(function(checked_element) {
    //     var optionParamMap = new Map();
    //     mcpjs["util/pathfinder"].deleteCommonData('menumng','DelMenu',optionParamMap,checked_element,saveMenuCallbackSuccess)
    // });

    var selectedRows = table.getSelectedRows();
    if( selectedRows.length == 0){
        mcpjs["util/util"].commonAlert("Please select at least one to delete.");
        return;
    }
    selectedRows.forEach(function (row) {
        var menuObj = {
            'id':           row.getCell("id").getValue(),
            'name':         row.getCell("id").getValue(),            
        }
        var optionParamMap = new Map();
        mcpjs["util/pathfinder"].deleteCommonData('menumng','DelMenu',optionParamMap,menuObj,saveMenuCallbackSuccess)
    });
}

// 메뉴 생성
export function regMenu(){
    var menuObj = {
        'id':           $('#create-id').val(),
        'name':         $('#create-name').val(),
        'description':  $('#create-description').val(),
        'sort':         parseInt($('#create-sort').val()),
        'category_id':  $('#create-category_id').val(),
        'alias':        $('#create-alias').val(),
        'visible':      $("#create-visible").is(":checked") ? true : false,
        
    }

    var optionParamMap = new Map();
    mcpjs["util/pathfinder"].postCommonData('menuMng','RegMenu',optionParamMap,menuObj,saveMenuCallbackSuccess)
}

export function editMenu(){
    var menuObj = {
        'id':           $('#edit-id').val(),
        'name':         $('#edit-name').val(),
        'description':  $('#edit-description').val(),
        'sort':         parseInt($('#edit-sort').val()),
        'category_id':  $('#edit-category_id').val(),
        'alias':        $('#edit-alias').val(),
        'visible':      $("#edit-visible").is(":checked") ? true : false,
    }

    var optionParamMap = new Map();
    mcpjs["util/pathfinder"].putCommonData('menuMng','UpdateMenu',optionParamMap,menuObj,saveMenuCallbackSuccess)
}

// 성공 시 처리
function saveMenuCallbackSuccess(caller, result){
    mcpjs["util/util"].commonAlert("save menu success")
}

// fail은 공통으로 처리
function saveMenuCallbackFail(caller, result){
    mcpjs["util/util"].commonAlert("save menu fail")
}

// 체크 후 Edit버튼 눌렀을 때 Edit form 보이기.
// 수정은 한번에 1개만 가능.
// 현재 창이 열려 있으면 
export function showMenuEditForm(){
    if (checked_array.length>1){mcpjs["util/util"].commonAlert("You can only edit one at a time.");return;}
    if (checked_array.length===0){mcpjs["util/util"].commonAlert("Please select at least one.");return;}
    console.log(checked_array[0])
    mcpjs['util/common'].displayStateChange("menu", "EDIT", checked_array[0])
    console.log(($("#edit-visible").val()))
    console.log(($("#edit-visible").val() === "true"))
    $("#edit-visible").prop("checked", ($("#edit-visible").val() === "true"));// TODO : displayStateChange에 들어갈 수 있는지 검토할 것.  
}

// menu 목록 조회 후 화면에 Set
export function getMenuListCallbackSuccess(caller, result) {
    console.log(result)
    table.setData(result.data.menuList)
}

// // CSV로 Export, 파일 이름은 [namespace]-MCIS.csv (ex. namespace가 workation이면 WORKATION-MCIS.csv)
// export function mcisTotalListExport() {
//     var namespace = $("#topboxDefaultNameSpaceName").text()
//     table.download("csv", namespace.toUpperCase() + "-MCIS.csv", {delimiter:","})
// }
