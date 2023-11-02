import { client } from "./util";
//폼의 Validation을 체크함.
//<input> tag에 "required" 옵션이 추가된 항목의 값이 공백인 경우 false  그렇지 않으면 true 리턴
export function chkFormValidate(formObj) {
  try {
    var objs = formObj.find("[required]");
    //alert(objs.length)

    // required 옵션이 체크된 필드 들의 값을 조회 함.(현재는 Text 필드만 가능)
    for (var i = 0; i < objs.length; i++) {
      if (objs.eq(i).val() == "") {
        mcpjs["util/util"].commonAlert("Please enter a value.");
        objs.eq(i).focus();
        return false;
      }
    }
    return true;
  } catch (e) {
    mcpjs["util/util"].commonAlert(e);
    return false;
  }
}

export function getOSType(image_id) {
  var url = CommonURL + "/ns/" + NAMESPACE + "/resources/image/" + image_id;
  console.log("api Info : ", ApiInfo);
  return axios
    .get(url, {
      headers: {
        Authorization: apiInfo,
      },
    })
    .then((result) => {
      var data = result.data;
      var osType = data.guestOS;
      console.log("Image Data : ", data);
      return osType;
    });
}
export function checkNS() {
  var url = CommonURL + "/ns";
  var apiInfo = ApiInfo;
  axios
    .get(url, {
      headers: {
        Authorization: apiInfo,
      },
    })
    .then((result) => {
      var data = result.data.ns;
      if (!data) {
        mcpjs["util/util"].commonAlert(
          "NameSpace가 등록되어 있지 않습니다.\n등록페이지로 이동합니다."
        );
        location.href = "/NS/reg";
        return;
      }
    });
}
export function getNameSpace() {
  var url = CommonURL + "/ns";
  var apiInfo = ApiInfo;
  axios
    .get(url, {
      headers: {
        Authorization: apiInfo,
      },
    })
    .then((result) => {
      var data = result.data.ns;
      var namespace = "";
      for (var i in data) {
        if (i == 0) {
          namespace = data[i].id;
        }
      }
      $("#namespace1").val(namespace);
    });
}
export function cancel_btn() {
  if (confirm("Cancel it?")) {
    history.back();
  } else {
    return;
  }
}
export function close_btn() {
  if (confirm("close it?")) {
    $("#transDiv").hide();
  } else {
    return;
  }
}
export function fnMove(target) {
  var offset = $("#" + target + "").offset();
  console.log("FnMove offset : ", offset);
  $("html, body").animate({ scrollTop: offset.top }, 400);
}

export function goFocus(target) {
  $("#" + target).trigger("focus");
  fnMove(target);
}

// MCIS 상태값 중 일부만 사용
// ex) Partial-Suspended-1(2/2)  : 가운데값만 사용
// todo : 일부정지인데 stop으로 표시하고 있는데....
export function getMcisStatusDisp(mcisFullStatus) {
  console.log("getMcisStatus " + mcisFullStatus);
  var statusArr = mcisFullStatus.split("-");
  var returnStatus = statusArr[0].toLowerCase();

  // const MCIS_STATUS_RUNNING = "running"
  // const MCIS_STATUS_INCLUDE = "include"
  // const MCIS_STATUS_SUSPENDED = "suspended"
  // const MCIS_STATUS_TERMINATED = "terminated"
  // const MCIS_STATUS_PARTIAL = "partial"
  // const MCIS_STATUS_ETC = "etc"
  // console.log("before status " + returnStatus)
  // if (returnStatus == MCIS_STATUS_RUNNING) {
  // 	returnStatus = "running"
  // } else if (returnStatus == MCIS_STATUS_INCLUDE) {
  // 	returnStatus = "stop"
  // } else if (returnStatus == MCIS_STATUS_SUSPENDED) {
  // 	returnStatus = "stop"
  // } else if (returnStatus == MCIS_STATUS_TERMINATED) {
  // 	returnStatus = "terminate"
  // } else if (returnStatus == MCIS_STATUS_PARTIAL) {
  // 	returnStatus = "stop"
  // } else if (returnStatus == MCIS_STATUS_ETC) {
  // 	returnStatus = "stop"
  // } else {
  // 	returnStatus = "stop"
  // }

  if (mcisFullStatus.toLowerCase().indexOf("running") > -1) {
    returnStatus = "running";
  } else if (mcisFullStatus.toLowerCase().indexOf("suspend") > -1) {
    returnStatus = "stop";
  } else if (mcisFullStatus.toLowerCase().indexOf("terminate") > -1) {
    returnStatus = "terminate";
    // TODO : partial도 있는데... 처리를 어떻게 하지??
  } else {
    returnStatus = "terminate";
  }
  console.log("after status " + returnStatus);
  return returnStatus;
}

export function getMcisStatusIcon(mcisDispStatus) {
  var mcisStatusIcon = "";
  if (mcisDispStatus == "running") {
    mcisStatusIcon = "icon_running_db.png";
  } else if (mcisDispStatus == "include") {
    mcisStatusIcon = "icon_stop_db.png";
  } else if (mcisDispStatus == "suspended") {
    mcisStatusIcon = "icon_stop_db.png";
  } else if (mcisDispStatus == "terminate") {
    mcisStatusIcon = "icon_terminate_db.png";
  } else {
    mcisStatusIcon = "icon_stop_db.png";
  }
  return mcisStatusIcon;
}
// VM 상태를 UI에서 표현하는 방식으로 변경
export function getVmStatusDisp(vmFullStatus) {
  console.log("getVmStatusDisp " + vmFullStatus);
  var returnVmStatus = vmFullStatus.toLowerCase(); // 소문자로 변환

  const VM_STATUS_RUNNING = "running";
  const VM_STATUS_STOPPED = "stop";
  const VM_STATUS_RESUMING = "resuming";
  const VM_STATUS_INCLUDE = "include";
  const VM_STATUS_SUSPENDED = "suspended";
  const VM_STATUS_TERMINATED = "terminated";
  const VM_STATUS_FAILED = "failed";

  if (returnVmStatus == VM_STATUS_RUNNING) {
    returnVmStatus = "running";
  } else if (returnVmStatus == VM_STATUS_TERMINATED) {
    returnVmStatus = "terminate";
  } else if (returnVmStatus == VM_STATUS_FAILED) {
    returnVmStatus = "terminate";
  } else {
    returnVmStatus = "stop";
  }
  return returnVmStatus;
}

export function getVmStatus(vm_name, connection_name) {
  var url = "/vmstatus/" + vm_name + "?connection_name=" + connection_name;
  var apiInfo = ApiInfo;
  $.ajax({
    url: url,
    async: false,
    type: "GET",
    beforeSend: function (xhr) {
      xhr.setRequestHeader("Authorization", apiInfo);
      xhr.setRequestHeader("Content-type", "application/json");
    },
    success: function (res) {
      var vm_status = res.Status;
    },
  });
}

export function getVmStatusClass(vmDispStatus) {
  var vmStatusClass = "bgbox_g";
  if (vmDispStatus == "running") {
    vmStatusClass = "bgbox_b";
  } else if (vmDispStatus == "include") {
    vmStatusClass = "bgbox_g";
  } else if (vmDispStatus == "suspended") {
    vmStatusClass = "bgbox_g";
  } else if (vmDispStatus == "terminated") {
    vmStatusClass = "bgbox_r";
  } else {
    vmStatusClass = "bgbox_r";
  }
  return vmStatusClass;
}
export function getVmStatusIcon(vmDispStatus) {
  var vmStatusIcon = "icon_running_db.png";
  if (vmDispStatus == "running") {
    vmStatusIcon = "icon_running_db.png";
  } else if (vmDispStatus == "stop") {
    vmStatusIcon = "icon_stop_db.png";
  } else if (vmDispStatus == "suspended") {
    vmStatusIcon = "icon_stop_db.png";
  } else if (vmDispStatus == "terminate") {
    vmStatusIcon = "icon_terminate_db.png";
  } else {
    vmStatusIcon = "icon_stop_db.png";
  }
  return vmStatusIcon;
}

// 좌측메뉴 선택 표시
// 경로를 split하여 첫번째 : Operation / Setting, 두번째 선택, 세번째 선택하도록
// //http://localhost:1234/settings/connection/cloudconnectionconfig/mngform
// //http://localhost:1234/setting/resources/network/mngform
// 이 때
// menu 2 의 id 는 menu_level2_connections, menu_level2_resources
// menu 3 의 id 는 menu_level3_cloudconnectionconfig, menu_level3_network
//
// 이 함수 필요함!
export function lnb_on() {
  var $ul_sub = $(".mininav-content");

  $(".mininav-toggle").on("click", function () {
    if ($(this).hasClass("collapsed")) {
      $(".mininav-toggle").not(".collapsed").addClass("collapsed");
      $ul_sub.slideUp(300);
      $ul_sub.removeClass("show");
      $(this).siblings("ul").slideDown(300);
      $(this).siblings("ul").addClass("show");
      $(this).removeClass("collapsed");
    } else {
      $(this).addClass("collapsed");
      $(this).siblings("ul").slideUp(300);
      $(this).siblings("ul").removeClass("show");
    }
  });

  var breadcrumb = $(".location").text().split(">");
  if (breadcrumb.length > 2) {
    var $first_depth = $(
      ".nav-label:contains(" + breadcrumb[2].trim() + ")"
    ).parent();
    $first_depth.siblings("ul").addClass("show");
    $first_depth.removeClass("collapsed");
    $first_depth.addClass("active");
    var $second_depth = $(".nav-link:contains(" + breadcrumb[3].trim() + ")");
    $second_depth.addClass("active");
  }
}

// export function lnb_on() {

// 	var $ul_sub = $('.menu > li ul')

// 	$("[id^='menu_level2_']").children("a").on("click", function() {
// 		if ($(this).parent().hasClass("active")) {
// 			$ul_sub.slideUp(300)
// 			$(this).parent().removeClass("active")
// 		} else {
// 			$ul_sub.slideUp(300)
// 			$("[id^='menu_level2_']").removeClass("active")
// 			$(this).next("ul").slideDown(300)
// 			$(this).parent().addClass("active")
// 		}
// 	})

// 	$("[id^='menu_level3_']").children("a").on("click", function() {
// 		if ($(this).parent().hasClass("on")) {
// 			$(this).parent().removeClass("on")
// 		} else {
// 			$("[id^='menu_level3_']").removeClass("on")
// 			$(this).parent().addClass("on")
// 		}
// 	})

// }

export function initJavascriptForCss() {
  //body scrollbar
  //mcpjs['util/jquery.scrollbar'].jQuery('.scrollbar-dynamic').scrollbar()
  //mcpjs['util/jquery'].jQuery('.scrollbar-dynamic').scrollbar();
  //jQuery('.scrollbar-dynamic').mcpjs['util/jquery.scrollbar'].scrollbar();

  // jQuery('.scrollbar-dynamic').scrollbar();
  //$('.scrollbar-dynamic').scrollbar();

  //Server List scrollbar
  //jQuery('.ds_cont .listbox.scrollbar-inner').scrollbar();

  //selectbox
  //jQuery('.selectbox').niceSelect();
  //menu_level3_cloudconnectionconfig
  /* lnb s */

  var $menu_li = $(".menu > li"),
    $ul_sub = $(".menu > li ul"),
    $lnb = $("#lnb"),
    $mobileCate = $("#mobileCate"),
    $container = $("#container"),
    $menubg = $("#lnb.on .bg"),
    $topmenu = $container.find(".topmenu"),
    $btn_menu = $("#btn_menu"),
    $btn_top = $("#btn_top");
  console.log(" $menu_li ");
  console.log($menu_li);

  //mobile on(open)
  $("#btn_menu").on("click", function () {
    console.log("mobile left");
    $("#lnb").animate({ right: 0 }, 300);
    $("#lnb").addClass("on");
    $("html, body").addClass("body_hidden");
  });
  //mobile topmenu copy
  $lnb.find(".bottom").append($topmenu.clone());

  //mobile off(close)
  $("#m_close, #lnb .bg").click(function () {
    $menubg.stop(true, true).fadeOut(300);
    $lnb.animate({ right: -350 }, 300);
    $lnb.removeClass("on");
    $("html, body").removeClass("body_hidden");
  });

  //left Name Space mouse over
  $("#lnb .topbox .txt_2").each(function () {
    var $btn = $(this);
    var list = $btn.find(".infobox");
    var menuTime;
    $btn
      .mouseenter(function () {
        list.fadeIn(300);
        clearTimeout(menuTime);
      })
      .mouseleave(function () {
        clearTimeout(menuTime);
        menuTime = setTimeout(mTime, 200);
      });
    function mTime() {
      list.stop().fadeOut(200);
    }
  });
  /* lnb e */

  //header menu mouse over
  $("#lnb .topmenu > ul > li").each(function () {
    var $btn = $(this);
    var list = $btn.find(".infobox");
    var menuTime;
    $btn
      .mouseenter(function () {
        list.fadeIn(300);
        clearTimeout(menuTime);
      })
      .mouseleave(function () {
        clearTimeout(menuTime);
        menuTime = setTimeout(mTime, 200);
      });
    function mTime() {
      list.stop().fadeOut(200);
    }
  });

  //header menu click(toggle)
  $(".header .topmenu > ul > li").each(function () {
    var $btn = $(this);
    var list = $btn.find(".infobox");
    var badge = $btn.find(".badge");
    $btn.click(function () {
      list.fadeToggle(300, function () {
        badge.innerHTML = "0";
        badge.hide();
      });
    });
  });

  //Action menu mouse over
  $(".dashboard .top_info > ul > li").each(function () {
    var $btn = $(this);
    var list = $btn.find(".infobox");
    var menuTime;
    $btn
      .mouseenter(function () {
        list.fadeIn(300);
        clearTimeout(menuTime);
      })
      .mouseleave(function () {
        clearTimeout(menuTime);
        menuTime = setTimeout(mTime, 200);
      });
    function mTime() {
      list.stop().fadeOut(200);
    }
  });

  //common table on/off
  $(".dashboard .status_list tbody tr").each(function () {
    var $td_list = $(this),
      $status = $(".detail_box"),
      $detail = $(".server_info");
    $td_list.off("click").click(function () {
      console.log("common td list click add on");
      $td_list.addClass("on");
      $td_list.siblings().removeClass("on");
      $status.addClass("view");
      $status.siblings().removeClass("on");
      $(".dashboard.register_cont").removeClass("active");
      $(".dashboard.edit_box").removeClass("view");
      $td_list.off("click").click(function () {
        if ($(this).hasClass("on")) {
          $td_list.removeClass("on");
          $status.removeClass("view");
          $detail.removeClass("active");
        } else {
          $td_list.addClass("on");
          $td_list.siblings().removeClass("on");
          $status.addClass("view");
          $status.siblings().removeClass("view");
          $(".dashboard.register_cont").removeClass("active");
          $(".dashboard.edit_box").removeClass("view");
        }
      });
    });
  });

  //RuleSet(s) mouse over
  $(".bubble_box .box").each(function () {
    var $list = $(this);
    var bubble = $list.find(".bb_info");
    var menuTime;
    $list
      .mouseenter(function () {
        bubble.fadeIn(300);
        clearTimeout(menuTime);
      })
      .mouseleave(function () {
        clearTimeout(menuTime);
        menuTime = setTimeout(mTime, 100);
      });
    function mTime() {
      bubble.stop().fadeOut(100);
    }
  });

  //Manage MCIS Server List on/off
  $(".dashboard .ds_cont .area_cont .listbox li.sel_cr").each(function () {
    console.log("sel_cr");
    var $sel_list = $(this),
      $detail = $(".server_info");
    $sel_list.off("click").click(function () {
      $sel_list.addClass("active");
      $sel_list.siblings().removeClass("active");
      $detail.addClass("active");
      $detail.siblings().removeClass("active");
      $sel_list.off("click").click(function () {
        if ($(this).hasClass("active")) {
          $sel_list.removeClass("active");
          $detail.removeClass("active");
        } else {
          $sel_list.addClass("active");
          $sel_list.siblings().removeClass("active");
          $detail.addClass("active");
          $detail.siblings().removeClass("active");
        }
      });
    });
  });

  //Monitoring MCIS Server List on/off
  $(".ds_cont_mbox .mtbox .g_list .listbox li.sel_cr").each(function () {
    var $sel_list = $(this),
      $detail_view = $(".monitoring_view");
    $sel_list.off("click").click(function () {
      console.log("sel_list click add active");
      $sel_list.addClass("active");
      $sel_list.siblings().removeClass("active");
      $detail_view.addClass("active");
      $detail_view.siblings().removeClass("active");
      $sel_list.off("click").click(function () {
        if ($(this).hasClass("active")) {
          console.log("sel_list click remove active");
          $sel_list.removeClass("active");
          $detail_view.removeClass("active");
        } else {
          console.log("sel_list click remove active, add sibling");
          $sel_list.addClass("active");
          $sel_list.siblings().removeClass("active");
          $detail_view.addClass("active");
          $detail_view.siblings().removeClass("active");
        }
      });
    });
  });

  $(".dashboard.dashboard_cont .ds_cont .dbinfo").each(function () {
    var $list = $(this);
    $list.on("click", function () {
      if ($(this).hasClass("active")) {
        $list.removeClass("active");
      } else {
        $list.addClass("active");
        $list.siblings().removeClass("active");
      }
    });
  });

  // btn_top
  $("#footer .btn_top").click(function () {
    $("html,body,#wrap").stop().animate({
      scrollTop: 0,
    });
  });

  $(".pop_setting_chbox input:checkbox").on("click", function () {
    if ($(this).prop("checked")) {
      $(this).parent().addClass("selected");
    } else {
      $(this).parent().removeClass("selected");
    }
  });

  // mobile table
  $(".dataTable tr span.ov").each(function () {
    $(this).on("click", function () {
      $(this).parent().parent().find(".btn_mtd").toggleClass("over");
      $(this).parent().parent().find(".overlay").toggleClass("hidden");
    });
  });
}

// namespace 목록에서 한 개 선택. 해당값을 임시로 저장하고 confirm 창 띄우기
// 실제 set은  setDefaultNameSpace function에서  ajax호출로
// set과 select 혼돈하지 말 것.
export function setCurrentNameSpace(caller, nameSpaceID) {
  // 변경할 namespaceId를 임시로
  console.log("setCurrentNameSpace " + caller + ", " + nameSpaceID);
  if (caller == "TobBox") {
    $("#topboxDefaultNameSpaceID").val(nameSpaceID);
    mcpjs["util/util"].commonConfirmOpen("ChangeNameSpace");
  } else if (caller == "LNBPopup") {
    console.log(
      "setCurrentNameSpace " + caller + ", " + nameSpaceID + " set!!"
    );
    // Modal 내 namespace 값을 hidden으로 set
    $("#tempSelectedNameSpaceID").val(nameSpaceID);
    // 선택했고 OK버튼이 나타난다. OK버튼 클릭시 저장 됨
    console.log("선택했음. Set을 해야 실제로 저장 됨");
  } else if (caller == "Main") {
    console.log(
      "setCurrentNameSpace " + caller + ", " + nameSpaceID + " set!!"
    );
    // Modal 내 namespace 값을 hidden으로 set
    $("#tempSelectedNameSpaceID").val(nameSpaceID);
    console.log("선택했음. Set을 해야 실제로 저장 됨");
  }
}

// namespace 선택 후 OK 버튼 클릭시(modal, main)에서
export function nameSpaceSet(caller) {
  var nameSpaceID = $("#tempSelectedNameSpaceID").val();
  console.log("nameSpaceSet OK " + nameSpaceID);
  setDefaultNameSpace(caller, nameSpaceID);
}

// store에 defaultnamespace 변경. namespace가 등록되어 있지 않으면 ns 설정 page로 이동
export function setDefaultNameSpace(caller, nsId) {
  console.log("setNameSpace : " + nsId);
  if (nsId) {
    //reqUrl = "/SET/NS/"+nsid;
    //var url = "/setting/namespaces/namespace/set/" + nsid;
    //var url = "/namespace/" + nsid;
    //var url = "/api/namespace/" + nsid;
    //console.log(url);

    var obj = {};    
    var controllerKeyName = "SetDefaultNamespace";
    var optionParamMap = new Map();
    optionParamMap.set("{nsId}", nsId);
    mcpjs["util/pathfinder"].postCommonData(
      caller,
      controllerKeyName,
      optionParamMap,
      obj,
      mcpjs["util/common"].setDefaultNamespaceCallbackSuccess
    );

    // client
    //   .post(url, {
    //     // headers:{
    //     //     'Authorization': apiInfo
    //     // }
    //   })
    //   .then((result) => {
    //     var data = result.data;

    //     console.log(data);
    //     // 성공했으면 해당 namespace 선택 또는 조회
    //     console.log(" defaultNameSpaceID : " + data.DefaultNameSpaceID);
    //     $("#topboxDefaultNameSpaceID").val(data.DefaultNameSpaceID);
    //     $("#topboxDefaultNameSpaceName").text(data.DefaultNameSpaceName);

    //     if (callerLocation == "Main") {
    //       // $('#loadingContainer').show();// page 이동 전 loading bar를 보여준다.
    //       // location.href = "/operation/dashboards/dashboardnamespace/mngform"
    //       var targetUrl = "/operations/dashboards/dashboardnamespace/mngform";
    //       mcpjs["util/util"].changePage(targetUrl);
    //     } else if (callerLocation == "NameSpace") {
    //       // commonAlert(data.DefaultNameSpaceID + "가 기본 NameSpace로 변경되었습니다.")
    //       mcpjs["util/util"].commonAlert("기본 NameSpace로 변경되었습니다");
    //       location.reload(); // TODO : 호출한 곳에서 reload를 할 것인지 redirect를 할 것인지
    //     } else {
    //       location.reload(); // TODO : 호출한 곳에서 reload를 할 것인지 redirect를 할 것인지
    //     }
    //     //
    //     // }).catch(function(error){
    //     // 	console.log("setNameSpace error : ",error);
    //     // });
    //   })
    //   .catch((error) => {
    //     console.warn(error);
    //     console.log(error.response);
    //   });
  } else {
    mcpjs["util/util"].commonAlert(
      "NameSpace가 선택되어 있지 않습니다.\n등록되어 있지 않은 경우 등록하세요."
    );
    //location.href ="/NS/reg";
  }
}

export function setDefaultNamespaceCallbackSuccess(caller, result){
  console.log(result)
  var data = result.data;
  console.log(" defaultNameSpaceID : " + data.DefaultNameSpaceID);
        $("#topboxDefaultNameSpaceID").val(data.DefaultNameSpaceID);
        $("#topboxDefaultNameSpaceName").text(data.DefaultNameSpaceName);

        if (caller == "Main") {
          // $('#loadingContainer').show();// page 이동 전 loading bar를 보여준다.
          // location.href = "/operation/dashboards/dashboardnamespace/mngform"
          //var targetUrl = "/operations/dashboards/dashboardnamespace/mngform";
          var targetUrl = "NsDashboardMngForm";
          mcpjs["util/util"].changePage(targetUrl);
        } else if (caller == "NameSpace") {
          // commonAlert(data.DefaultNameSpaceID + "가 기본 NameSpace로 변경되었습니다.")
          mcpjs["util/util"].commonAlert("기본 NameSpace로 변경되었습니다");
          location.reload(); // TODO : 호출한 곳에서 reload를 할 것인지 redirect를 할 것인지
        } else {
          location.reload(); // TODO : 호출한 곳에서 reload를 할 것인지 redirect를 할 것인지
        }
}

// this.value -> 특정 obj 에 넣을 때 사용
export function copyValue(targetValue, targetObjId) {
  $("#" + targetObjId).val(targetValue);
}

// 이름 Validation : 소문자, 숫자, 하이프(-)만 가능   [a-z]([-a-z0-9]*[a-z0-9])?
export function validateCloudbaristaKeyName(elementValue, maxLength) {
  var returnStr =
    "first letter = small letter \n middle letter = small letter, number, hyphen(-) only \n last letter = small letter";
  //var charsPattern = /^[a-zA-Z0-9-]*$/;
  //var charsPattern = /^[a-z0-9-]*$/;
  //var charsPattern = /^[a-z]([-a-z0-9]*[a-z0-9])$/;
  //var regex = new RegExp('^[0-9]*\\.[0-9]{'+b+'}$') ;

  // min = 3 이므로 4자이상. maxlength + 1 이하 ex( 3, 12) 면 4자~13자 까지 허용
  var regex = new RegExp("^[a-z]([-a-z0-9]*[a-z0-9])$");
  console.log("validation " + elementValue + " : " + maxLength);
  if (maxLength == undefined) {
    if (!regex.test(elementValue)) {
      return false;
    }
  }
  var str_length = elementValue.length; // 전체길이
  try {
    if (maxLength > 0) {
      if (Number(str_length) > Number(maxLength)) {
        console.log(returnStr);
        return false;
      }

      console.log(
        " maxlength is defined " + maxLength + " : " + elementValue.length
      );
      // regex = new RegExp('^[a-z]([-a-z0-9]*[a-z0-9]){' + maxLength+'}$') ;
      //regex = new RegExp('^[a-z]([-a-z0-9]*[a-z0-9]){ 5,' + maxLength+'}$') ;

      regex = new RegExp(
        "^[a-z]([-a-z0-9]*[a-z0-9]){3," + maxLength + "}$",
        "g"
      );

      if (!regex.test(elementValue)) {
        console.log("return val " + elementValue);
        return false;
      }
    }
  } catch (e) {
    return false;
    // console.log(e);
  }
  console.log("validate return");
  return true;
  //return charsPattern.test(elementValue);
}

// 해당 table 의 limit를 초과하면 scroll이 생기도록
// width는 colgroup이 없는 채로 ht, td 에 width class를 추가한다.
export function setTableHeightForScroll(tableId, limitHeight) {
  console.log("set table height");
  var tableHeight = $("#" + tableId).height();
  if (tableHeight > limitHeight) {
    $("#" + tableId).css({ height: limitHeight + "px" });
  }
}

// 비어있으면 false, 안비어있으면 true
export function checkEmptyString(stringVal) {
  if (stringVal == null || stringVal == undefined || stringVal == 0) {
    return false;
  }
  return true;
}

// plus 버튼을 추가하는 script : +버튼을 삭제 후 추가하려 했으나, onload 이벤트정의에서 동작하지 않음...
export function getPlusVm() {
  var append = "";
  append = append + '<li id="plusVmIcon">';
  append = append + '<div class="server server_add">';
  append = append + "</div>";
  append = append + "</li>";
  return append;
}

// CRUD displayStateChange for user action
// target : 대상 ID
// action : REG(등록) / INFO(상세) / EDIT(변경)
export function displayStateChange(target, action, row) {
  $("#" + target + "-CreateBox").removeClass("view");
  $("#" + target + "-InfoBox").removeClass("view");
  $("#" + target + "-EditBox").removeClass("view");

  if (action == "REG") {
    $("#" + target + "-CreateBox").toggleClass("active");
  } else if (action == "INFO") {
    var $current_row = $(row.getElement());
    if ($current_row.hasClass("on")) {
      // 이미 info box가 열려있으면
      $current_row.removeClass("on");
      $("#" + target + "-InfoBox").removeClass("view"); // 닫는다
    } else {
      $current_row.addClass("on");
      $current_row.siblings().removeClass("on");
      if (!$("#" + target + "-InfoBox").hasClass("view")) {
        // 이전에 다른 row를 클릭해서 info box가 이미 열려있는지 확인
        $("#" + target + "-InfoBox").addClass("view");
      }
      $("#" + target + "-CreateBox").removeClass("active");
      $("#" + target + "-EditBox").removeClass("view");
    }

    $("#dtl-stxt").text(row.getData().id);
    for (var key in row.getData()) {
      $("#dtl-" + key).val(row.getData()[key]);
    }
  } else if (action == "EDIT") {
    console.log(row);
    $("#" + target + "-EditBox").toggleClass("view");
    $("#" + target + "-InfoBox").removeClass("view");
    $("#" + target + "-CreateBox").removeClass("active");
    console.log(row["id"]);

    // set Data
    $("#edit-stxt").text(row["id"]);
    for (var key in row) {
      $("#edit-" + key).val(row[key]);
    }

    //
  }
}
