
var tableMap;
$(function () {
    setCategoryTableMeta();
    //setMenuTableMeta();
    
    getCategoryList()
});

// table 설정정보
function setCategoryTableMeta(){
    tableMap = new Map();
    // category table
    var tableObjParams = {}
    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
        {title:"ParentCategory", field:"parent_category_id", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", maxWidth: 135},
        {title:"ID", field:"id", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", maxWidth: 135},
        {title:"CategoryName", field:"category_name", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", maxWidth: 135},
        {title:"Description", field:"description", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", maxWidth: 135},
        {title:"Sort", field:"sort", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", maxWidth: 60},
    ]
    var table = mcpjs["util/util"].setTabulator("categoryList", tableObjParams, columns)
    table.on("rowClick", function(e, row){
        console.log(row)
        clickListOfCategory(row.getCell("id").getValue())
    });
    mcpjs['util/util'].displayColumn(table)
    tableMap.set("categoryList",table);

    // menu table
    tableObjParams = {}
    columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
        {title:"CategoryID", field:"category_id", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", maxWidth: 135},
        {title:"MenuID", field:"menu_id", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", maxWidth: 135},
        {title:"MenuName", field:"menu_name", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", maxWidth: 135},
        {title:"Alias", field:"alias", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", maxWidth: 135},
        {title:"Description", field:"description", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", maxWidth: 135},
        {title:"Visible", field:"visable", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", maxWidth: 135},
        {title:"Path", field:"path", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", maxWidth: 135},
        {title:"Sort", field:"sort", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", maxWidth: 60},
    ]
    var table2 = mcpjs["util/util"].setTabulator("menuList", tableObjParams, columns)
    table2.on("rowClick", function(e, row){
        console.log(row)
        clickListOfMenu(row.getCell("menu_id").getValue())
    });
    mcpjs['util/util'].displayColumn(table2)
    //tableMap["menuList"] = table2;
    tableMap.set("menuList",table2);
}

// CategoryList
function getCategoryList(){    
    var optionParamMap = new Map();
    mcpjs['util/pathfinder'].getCommonData("adminmng", "CategoryList", optionParamMap, mcpjs['adminconfig/menumng'].getCategoryListCallbackSuccess)
}

function getMenuList(categoryId){    
    var optionParamMap = new Map();
    optionParamMap.set("categoryId", categoryId)
    mcpjs['util/pathfinder'].getCommonData("adminmng", "MenuList", optionParamMap, mcpjs['adminconfig/menumng'].getMenuListCallbackSuccess)
}



export function setTableFilter(tableId, keyword) {
    var field = $("#" + tableId + "List_field").val()
    tableMap.get(tableId).setFilter(field, "like", keyword)
}

export function clearTableFilter(tableId) {
    $("#" + tableId + "List_filter_keyword").val("")
    tableMap.get(tableId).clearFilter()
}

// Category 목록 조회 후 화면에 Set
export function getCategoryListCallbackSuccess(caller, result) {
    console.log(result.data);
    var categoryList = result.data.categoryList;

    console.log("tableMap " , tableMap)
    //table.setData(categoryList)
    tableMap.get("categoryList").setData(categoryList)
    // console.log("caller = " + caller)
}

// 조회 실패시.
export function getCategoryListCallbackFail(caller, error) {
    console.log("getCategoryListCallbackFail", error)    
}

export function getMenuListCallbackSuccess(caller, error){
    console.log("getMenuListCallbackSuccess", error)
}

export function getMenuListCallbackFail(caller, error) {
    console.log("getMenuListCallbackFail", error)
}

// Table Row click
export function clickListOfCategory(categoryId) {
    console.log("click view categoryId :", categoryId)    

    getMenuList(categoryId)

}

////////////////
