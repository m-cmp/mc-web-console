var table;
$(()=> {
    console.log("subgrouplist_modal ")

    // search button
	$('#recommendSpecAssist .btn_search_spec').on('click', function () {
        console.log("#recommendSpecAssist .btn_search_spec clicked")        
		getVmSpecRecommend()        
    });

    // apply buuton
	// 자신의 값을 전달하기 위해 parent의 함수 호출
    $('#mcisSubgroupAssist .btn_apply').on('click', function () {
        applyAssistValidCheck();        
    });

    initTable();
});

// Table 초기값 설정
function initTable() {
    var tableObjParams = {};
    var columns = [
        { formatter: "rowSelection", titleFormatter: "rowSelection", vertAlign: "middle", hozAlign: "center", headerHozAlign: "center", headerSort: false, width: 60,},      
        // { title: "McisId", field: "id", visible: false },
        // { title: "VMId", field: "vm.0.id", visible: false },
        // { title: "Subgroup", field: "vm.0.subGroupId", visible: false },
        // { title: "Mcis", field: "name", vertAlign: "middle" },
        // { title: "VM", field: "vm.0.name", vertAlign: "middle" },
        { title: "McisId", field: "mcisId", visible: false },
        { title: "VMId", field: "vmId", visible: false },        
        { title: "Mcis", field: "mcisName", vertAlign: "middle" },
        { title: "Subgroup", field: "subGroupId", vertAlign: "middle" },
        { title: "VM", field: "vmName", vertAlign: "middle" },
    ];

    var isMultiSelect = false;
    table = mcpjs["util/util"].setTabulator("subGroupList", tableObjParams, columns, isMultiSelect);

    table.on("rowClick", function (e, row) {
    });

    // table.on("rowSelectionChanged", function (data, rows) {      
    // });

    mcpjs["util/util"].displayColumn(table);    
}

// popup을 띄울 때 전달 받는 param
export function setSubgroupListAssist(caller, vpcId){
    console.log("setSubgroupListAssist", caller)
    console.log("vpcId", vpcId)
	$("#parentsSubgroupListAssist").val(caller)	
    $("#parentsVpcId").val(vpcId)

    // vpc를 사용하는 mcis 목록 및 subgroup만 filter
    //var optionParam = "";
    //"POST : /operations/mcismng/mcis/resource?filterKey=vpc&filterVal=xxx" 
    // var url = "/operations/mcismng/mcis/resource?filterKey=vpc&filterVal=" + vpcId
    // axios.get(url).then(result => {
    //     console.log("getMcisVmsPop result : ", result);
    //     var mcisList = result.data.McisList;
    //     getMcisListCallbackSuccess("mcissubgroup", mcisList)
    // })
    
    var caller = "subgrouplist"
    var actionName="McisList";
    var optionParamMap = new Map();
    optionParamMap.set("vpc", vpcId);
    optionParamMap.set("filterKey", "vpc");
    optionParamMap.set("filterVal", vpcId);    

    mcpjs["util/pathfinder"].getCommonData(caller, actionName, optionParamMap, mcpjs["mcismng/subgrouplist_modal"].getMcisListCallbackSuccess );
}

// MCIS 목록 조회 후 화면에 Set
export function getMcisListCallbackSuccess(caller, result) {
    
    var mcisList = result.data.McisList;
    //console.log("caller:", caller);
    var subGroupArr = new Array();
    for (var mcisIndex in mcisList) {
        var aMcis = mcisList[mcisIndex];
        var vmList = aMcis.vm;
        for (var vmIndex in vmList) {
            var subGroup = vmList[vmIndex];
            var obj = { 
                mcisId: aMcis.id,
                mcisName: aMcis.name,
                subGroupId : subGroup.subGroupId,
                vmId : subGroup.id,
                vmName : subGroup.name,
            }
            subGroupArr.push(obj)
        }
    }
    console.log(subGroupArr);
    table.setData(subGroupArr);
}

// deprecated
function displayMcisVmsListTable(mcisList) {
    if (!mcpjs['util/util'].isEmpty(mcisList) && mcisList.length > 0) {
        //totalMcisCnt = mcisList.length;
        var addMcis = "";
        for (var mcisIndex in mcisList) {
            var aMcis = mcisList[mcisIndex];
            if (aMcis.id != "") {
                addMcis += setMcisListTableRow(aMcis, mcisIndex);
            }
        } // end of mcis loop
        $("#subGroupList").empty();
        $("#subGroupList").append(addMcis);
    } else {
        var addMcis = "";
        addMcis += "<tr>";
        addMcis +=
            '<td class="overlay hidden" data-th="" colspan="4">No Data</td>';
        addMcis += "</tr>";
        $("#mcisList").empty();
        $("#mcisList").append(addMcis);
    }
}

// deprecated
function setMcisListTableRow(aMcisData, mcisIndex) {
    var html = "";
    try {
        console.log(aMcisData)
        var vmList = aMcisData.vm;
        for (var i = 0; i < vmList.length; i++) {
            html +=
                "<tr>" +
                '<td class="column-50px" class="overlay hidden" data-th="">' +
                '<input type="hidden" name="mcisId" id="mcisId_' +
                i +
                '" value="' +
                aMcisData.id +
                '"/>' +
                '<input type="hidden" name="subGroupId" id="subGroupId_' +
                i +
                '" value="' +
                vmList[i].subGroupId +
                '"/>' +
                '<input type="hidden" name="vms_info" id="vms_info_' +
                i +
                '" value="' +
                vmList[i].id +
                '"/>' +
                '<input type="checkbox" name="vmchk" value="' +
                vmList[i].id +
                '" id="raw_' +
                i +
                '" title="" /><label for="td_ch1"></label> <span class="ov off"></span></td>' +
                '<td class="btn_mtd ovm" data-th="name">' +
                aMcisData.name +
                "</td>" +
                '<td class="overlay hidden" data-th="subGroupId">' +
                vmList[i].subGroupId +
                "</td>" +
                '<td class="overlay hidden" data-th="vmName">' +
                vmList[i].name +
                "</td>" +
                "</tr>";
        }
    } catch (e) {
        console.log("list of mcis error");
        console.log(e);

        html = "<tr>";
        html +=
            '<td class="overlay hidden" data-th="" colspan="4">No Data</td>';
        html += "</tr>";
    }
    return html;
}

export function applyAssistValidCheck(caller) {
    
    console.log("applyAssistValidCheck");        
    var parentsName = $("#parentsSubgroupListAssist").val();

    var mcisId = "";
    var subGroupId = ""
    var vmIdList = ""
    var selectedRows = table.getSelectedData();
	if (selectedRows.length > 0) {
		console.log(selectedRows);
		mcisId = selectedRows[0].mcisId;
        subGroupId = selectedRows[0].subGroupId;
		vmIdList = selectedRows[0].vmId;
		
	} else {
		mcpjs["util/util"].commonAlert("Please Select a DataDisk !!");
        return;
	}


    // // 선택한 녀석의 VM LIST 정보를 VMS칸(tg_vms)에다가 입력
    // var subgrouplistValue = $("input[name='vms_info']").length;
    // var vmchk = $("input[name='vmchk']");
    // var subgrouplistData = new Array(subgrouplistValue);
    // var mcisId = "";
    // var subGroupId = ""
    // var vmIdList = ""
    // // var infoshow = "";

    // // check 된 항목 찾기 : 1개만 가능
    // var checkedCount = 0;    
    // for (var i = 0; i < subgrouplistValue; i++) {
    //     if( checkedCount > 1){
    //         mcpjs['util/util'].commonAlert("1개만 선택 가능")
    //         return
    //     }

    //     if (vmchk[i].checked ) {
    //         checkedCount++;
    //         mcisId = $("input[name='mcisId']")[i].value;
    //         subGroupId = $("input[name='subGroupId']")[i].value;
    //     }
    // }

    // for (var i = 0; i < subgrouplistValue; i++) {
    //     var tempSubGroupId = $("input[name='subGroupId']")[i].value;
    //     if( subGroupId == tempSubGroupId){
    //         vmIdList += $("input[name='vms_info']")[i].value;
    //         vmIdList += "\r\n";
    //     }
    // }

    
    // 값을 parent로 전달
    if( parentsName == "mcismng"){

    }else if ( parentsName == "nlbcreate"){
        mcpjs['nlb/nlbcreate'].setAssistSubGroup(mcisId, subGroupId, vmIdList)    
    }
    
}