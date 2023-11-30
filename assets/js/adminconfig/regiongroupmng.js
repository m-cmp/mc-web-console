
var table;
$(function () {
    // table 초기 세팅	
    initTable();
    
    getRegionGroupList()
});

// table 설정
function initTable() {
    var tableObjParams = {}
    var columns = [
        {formatter:"rowSelection", titleFormatter:"rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort:false, width:60},
        {title:"Id", field:"region_group_id", visible: false},
        {title:"RegionId", field:"region_id", visible: false},
        {title:"RegionGroup", field:"region_group_name", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", maxWidth: 135},
        {title:"Provider", field:"provider_id", formatter: providerFormatter, vertAlign: "middle", headerSort:false, maxWidth: 100},
        {title:"Region", field:"region_name", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center"},
        {title:"CSPRegion", field:"csp_region_name", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", maxWidth: 135},
    ]
    table = mcpjs["util/util"].setTabulator("regionGroupList", tableObjParams, columns)
    table.on("rowClick", function(e, row){
        console.log(row)
        clickListOfRegionGroup(row.getCell("region_group_id").getValue(), row.getCell("region_id").getValue())
    });
    mcpjs['util/util'].displayColumn(table)
}

// RegionGroup으로 묶은 Region 목록
function getRegionGroupList(){    
    var optionParamMap = new Map();
    mcpjs['util/pathfinder'].getCommonData("adminmng", "RegionGroupList", optionParamMap, mcpjs['adminconfig/regiongroupmng'].getRegionGroupListCallbackSuccess)
}


export function setTableFilter(keyword) {
    var field = $("#regionGroupList_field").val()
    table.setFilter(field, "like", keyword)
}

export function clearTableFilter() {
    $("#regionGroupList_filter_keyword").val("")
    table.clearFilter()
}


function providerFormatter(cell) {
    console.log("providerFormatter ", cell.getData().provider_id)
    var providerId = cell.getData().provider_id.toLowerCase();;

    //var vmCloudConnectionMap = mcpjs['util/util'].calculateConnectionCount(cell.getData().vm);
    var providerCell = ""
    providerCell += '<img class="provider_icon" src="/assets/images/contents/img_logo_' + providerId + '.png" alt="' + providerId + '"/>'
    //vmCloudConnectionMap.forEach((value, key) => {
    //    mcisProviderCell += '<img class="provider_icon" src="/assets/images/contents/img_logo_' + key + '.png" alt="' + key + '"/>'
    //})
    return providerCell
}



// MCIS 목록 조회 후 화면에 Set
export function getRegionGroupListCallbackSuccess(caller, result) {
    //console.log("caller", caller);
    console.log(result.data);
    var regionGroupList = result.data.regionGroupList;
    //console.log("getRegionGroupListCallbackSuccess ", regionGroupList)
    table.setData(regionGroupList)
    // console.log("caller = " + caller)
}

// 조회 실패시.
export function getRegionGroupListCallbackFail(caller, error) {
    console.log("getRegionGroupListCallbackFail", error)
    // List table에 no data 표시? 또는 조회 오류를 표시?
    var html = "";
    html += '<tr>'
    html += '<td class="overlay hidden" data-th="" colspan="4">No Data</td>'
    html += '</tr>'
    $("#regionGroupList").empty();
    $("#regionGroupList").append(html);
}

// Table Row click
export function clickListOfRegionGroup(regionGroupId, regionId) {    
    console.log("click view RegionGroup id :", regionGroupId)    
    console.log("click view regionId :", regionId)    

    var caller = "regionGroupDetail";
    var actionName="RegionGroupGet"
    var optionParamMap = new Map();
    //providerId := c.Params().Get("provider") //id
	//regionGroupId := c.Params().Get("regionGroupId")
	//regionGroupName := c.Params().Get("regionGroupName") //name
    optionParamMap.set("regionGroupId", regionGroupId)
    optionParamMap.set("regionId", regionId)
    
    //
    mcpjs['util/pathfinder'].getCommonData(caller, actionName, optionParamMap, mcpjs['adminconfig/regiongroupmng'].getRegionGroupCallbackSuccess)

}

// RegionGroup 정보조회완료
export function getRegionGroupCallbackSuccess(caller, result){
    console.log("caller", caller)
    console.log("result", result)

    // ID uuid.UUID `json:"region_group_id" db:"id"`

	// RegionGroupName string `json:"region_group_name" db:"region_group_name"`

	// // 사용하는 참조 : fk 설정이 해당 테이블에 되어있어야 함. transaction으로 호출해야 relation이 적용 됨. 그냥 query로 호출하면 null.
	// ProviderID   string `json:"provider_id" db:"provider_id"`
	// ProviderName string `json:"provider_name" db:"provider_name"` // raw query로 호출하여 return하기위해 추가
	// //Provider   *CloudProvider `json:"cloud_providers,omitempty" belongs_to:"cloud_providers"`

	// RegionID      uuid.UUID `json:"region_id" db:"region_id"`
	// RegionName    string    `json:"region_name" db:"region_name"`         // raw query로 호출하여 return하기위해 추가
	// CspRegionName string    `json:"csp_region_name" db:"csp_region_name"` // raw query로 호출하여 return하기위해 추가
    var data = result.data.regionGroup;
    console.log(data);
    showRegionGroupInfo(data);
}
////////////////

// 상세영역 보이기 안보이기
// VPC 상세내역 표시 : TODO : Edit도 있을 것이므로 function명 적절한 것으로 변경 및 보완 필요
export function displayRegionGroupInfo(targetAction) {
    console.log("displayRegionGroupInfo ", targetAction);
    if (targetAction == "REG") {
         $('#regionGroupCreateBox').toggleClass("active");
         $('#regionGroupInfoBox').removeClass("view");
         $('#regionGroupListTable').removeClass("on");
         //var offset = $("#regionGroupCreateBox").offset();
         // var offset = $("#" + target+"").offset();
         //$("#TopWrap").animate({ scrollTop: offset.top }, 300);
 
         // form 초기화
         $("#regName").val('')
         $("#regDescription").val('')
         //mcpjs['util/common'].goFocus('regionGroupCreateBox');
     } else if (targetAction == "REG_SUCCESS") {
         $('#regionGroupCreateBox').removeClass("active");
         $('#regionGroupEditBox').removeClass("view");
         $('#regionGroupInfoBox').removeClass("view");
         $('#regionGroupListTable').addClass("on");
 
         //var offset = $("#regionGroupCreateBox").offset();
          
         // form 초기화
         $("#regName").val('')
         $("#regDescription").val('')
         getVpcList("name");
     } else if (targetAction == "EDIT") { 
         $('#regionGroupEditBox').toggleClass("view");
         $('#regionGroupInfoBox').removeClass("view");
         $('#regionGroupListTable').removeClass("on");
     } else if (targetAction == "DEL") {
         $('#regionGroupCreateBox').removeClass("active");
         $('#regionGroupInfoBox').addClass("view");
         $('#regionGroupListTable').removeClass("on");
 
         //var offset = $("#regionGroupInfoBox").offset();
         //$("#TopWrap").animate({ scrollTop: offset.top }, 300);
 
     } else if (targetAction == "DEL_SUCCESS") {
         $('#regionGroupCreateBox').removeClass("active");
         $('#regionGroupEditBox').removeClass("view");
         $('#regionGroupInfoBox').removeClass("view");
         $('#regionGroupListTable').addClass("on");
 
         //var offset = $("#regionGroupInfoBox").offset();
         //$("#TopWrap").animate({ scrollTop: offset.top }, 0);
 
         getRegionGroupList();
     } else if (targetAction == "CLOSE") {
         $('#regionGroupCreateBox').removeClass("active");
         $('#regionGroupInfoBox').removeClass("view");
         $('#regionGroupListTable').addClass("on");
 
         //var offset = $("#regionGroupInfoBox").offset();
         //$("#TopWrap").animate({ scrollTop: offset.top }, 0);
     }
 }

export function showRegionGroupInfo(data) {

        var dtlCspRegionName = data.csp_region_name;
        var dtlProviderId = data.provider_id;
        var dtlProviderName = data.provider_name;
        
        var dtlRegionGroupId = data.region_group_id;
        var dtlRegionGroupName = data.region_group_name;
        var dtlRegionId = data.region_id;
        var dtlRegionName = data.region_name;


        $('#dtlRegionGroupName').empty();
        $('#dtlDescription').empty();
        $('#dtlProvider').empty();
        $('#dtlRegionName').empty();

        $('#dtlRegionGroupName').val(dtlRegionGroupName);
        $('#dtlDescription').val();
        $('#dtlProvider').val(dtlProviderName);
        $('#dtlRegionName').val(dtlCspRegionName);

}
