import { VPC_MAP } from "../util/util";

var table
var checked_array = []

$(function () {
    // mcpjs['util/pathfinder'].setLeftMenu(); // 전체 적용으로 바꿈
    initTable()
});

function initTable() {
    var tableObjParams = {}

    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
        {title:"category_name", field:"category_name",headerHozAlign: "center", vertAlign: "middle", hozAlign: "center"},
        {title:"parent_category_id", field:"parent_category_id",headerHozAlign: "center", vertAlign: "middle", hozAlign: "center"},
        {title:"description", field:"description",headerHozAlign: "center", vertAlign: "middle", hozAlign: "center"},
        {title:"sort", field:"sort",headerHozAlign: "center", vertAlign: "middle", hozAlign: "center"},
        {title:"created_at", field:"created_at",headerHozAlign: "center", vertAlign: "middle", hozAlign: "center", visible: false},
        {title:"updated_at", field:"updated_at",headerHozAlign: "center", vertAlign: "middle", hozAlign: "center", visible: false},
        {title:"use_yn", field:"use_yn",headerHozAlign: "center", vertAlign: "middle", hozAlign: "center", visible: false},
    ]

    table = mcpjs["util/util"].setTabulator("CategoryListTable", tableObjParams, columns)

    table.on("rowClick", function(e, row){
        mcpjs['util/common'].displayStateChange("category", "INFO", row)
    });

    table.on("rowSelectionChanged", function(data, rows){
       checked_array = data
    });

    // column show & hide 기능
    mcpjs['util/util'].displayColumn(table)

    var optionParamMap = new Map();
    mcpjs['util/pathfinder'].getCommonData("adminmng", "CategoryList", optionParamMap, mcpjs['adminconfig/categorymng'].getCategoryListCallbackSuccess)


    mcpjs['util/util'].displayColumn(table)
}

export function editcategory(){
    if (checked_array.length>1){mcpjs["util/util"].commonAlert("You can only edit one at a time.");return;}
    if (checked_array.length===0){mcpjs["util/util"].commonAlert("Please select at least one.");return;}
    console.log(checked_array[0])
    mcpjs['util/common'].displayStateChange("category", "EDIT", checked_array[0])
}

export function deletecategory(){
    if (checked_array.length<1){mcpjs["util/util"].commonAlert("Please select at least one to delete.");return;}

    mcpjs["util/util"].commonAlert("Delete category not implement.")
}

// Category 목록 조회 후 화면에 Set
export function getCategoryListCallbackSuccess(caller, result) {
    table.setData(result.data.categoryList)
}

// CSV로 Export, 파일 이름은 [namespace]-MCIS.csv (ex. namespace가 workation이면 WORKATION-MCIS.csv)
export function mcisTotalListExport() {
    var namespace = $("#topboxDefaultNameSpaceName").text()
    table.download("csv", namespace.toUpperCase() + "-MCIS.csv", {delimiter:","})
}
