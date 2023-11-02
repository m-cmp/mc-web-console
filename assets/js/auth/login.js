import { Modal, Button, Carousel, Popover, Tooltip } from "bootstrap";
import { client } from "/assets/js/util/util";
//import bootstrap from 'bootstrap';

$(document).ready(function () {
  console.log("document ready");

  //  기존에 로그인을 바로 시키기 위해 /regUser를 한번 호출 함.
  //  client.post("/regUser",{})
  //     .then(result =>{
  //          console.log(result);
  //      });
  // var nsUrl = "http://localhost:1234/"
  $("#sign_btn").on("click", function () {
    try {
      var csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        .getAttribute("content");
      var email = $("#userID").val();
      var password = $("#password").val();
      console.log("button click");
      if (!password || !email) {
        //const myModalAlternative = new bootstrap.Modal('#required', {})
        $("#required").modal("toggle");
        //myModalAlternative.modal()

        return;
      }

      var req = {
        email: email,
        password: password,
      };

      const frm = new FormData();
      frm.append("Email", email);
      frm.append("Password", password);

      console.log(req);
      var url = "/api/auth/signin/";

      console.log(csrfToken);

      //const myModalAlternative = new bootstrap.Modal('#popLogin', {})
      //myModalAlternative.showModal();
      //console.log( $("#popLogin") );

      //client.post(url, frm)
      client
        .post(url, frm, {
          headers: { "Content-Type": "form-data", "x-csrf-token": csrfToken },
        })
        //client.post(url, form, { headers: 'X-CSRF-TOKEN':csrfToken })
        .then((result) => {
          console.log("login result : ", result);
          if (result.status == 200) {
            getNameSpace();
            //console.log("get result Data : ", result.data.LoginInfo);
            //$("#popNamespaceList").modal("toggle");
            location.href = "/main";
          } else {
            //commonAlert("ID or PASSWORKD MISMATCH!!Check yourself!")
            mcpjs["util/util"].commonAlert(
              "ID or PASSWORKD MISMATCH!!Check yourself!"
            );
            //  location.reload(true);
          }
          //  }).catch(function(error){
        })
        .catch((error) => {
          console.log(error);
          //console.log(error.response.data);
          //console.log(error.response.status);
          //console.log('Error', error.message);
          console.log("***");
          if (error.response) {
            // 요청이 이루어졌으며 서버가 2xx의 범위를 벗어나는 상태 코드로 응답했습니다.
            console.log(error.response.data);
            console.log(error.response.status);
            console.log(error.response.headers);
          } else if (error.request) {
            // 요청이 이루어 졌으나 응답을 받지 못했습니다.
            // `error.request`는 브라우저의 XMLHttpRequest 인스턴스 또는
            // Node.js의 http.ClientRequest 인스턴스입니다.
            console.log(error.request);
          } else {
            // 오류를 발생시킨 요청을 설정하는 중에 문제가 발생했습니다.
            console.log("Error", error.message);
          }
          //console.log(error.config);
          console.log("login error : ", error);
          mcpjs["util/util"].commonAlert(error.message);
          // alert(error.message)
          //  location.reload(true);
        });
    } catch (e) {
      alert(e);
    }
  });

  // namespace 등록영역 보이기/숨기기
  $("#btnToggleNamespace").on("click", function () {
    try {
      //addNamespaceForm
      showHideByButton("btnToggleNamespace", "addNamespaceForm");
    } catch (e) {
      mcpjs["util/util"].commonAlert(e);
    }
  });

  // namespace clear 버튼: 입력내용 초기화
  $(".btn_clear").click(function () {
    clearNameSpaceCreateForm();
  });
});

export function clearNameSpaceCreateForm() {
  $("#addNamespace").val("");
  $("#addNamespaceDesc").val("");
}

// Toggle 기능 : 원래는 namespace와 connection driver에서 사용한 것 같으나 현재는 namespace만 사용. 그럼 굳이 function으로 할 필요있나?
// 버튼의 display를 ADD / HIDE, 대상 area를 보이고 숨기고
export function showHideByButton(origin, target) {
  var originObj = $("#" + origin);
  var targetObj = $("#" + target);
  if (originObj.html() == "ADD +") {
    originObj.html("HIDE -");
    targetObj.fadeIn();
  } else {
    originObj.html("ADD +");
    targetObj.fadeOut();
  }
}

// 엔터키가 눌렸을 때 실행할 내용
export function enterKeyForLogin() {
  console.log("enterKeyForLogin");
  if (window.event.keyCode == 13) {
    $("#sign_btn").trigger("click");
  }
}

// 유저의 namespace 목록 조회
export function getNameSpace() {
  //var url = "/ns";
  //var url = "/setting/namespaces/namespace/list";
  //var url = "/namespace/list";
  var url = "/api/namespace/";

  // token
  axios
    .get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((result) => {
      console.log("get NameSpace Data : ");
      console.log(result.data);
      //var data = result.data.ns;
      var data = result.data;
      var html = "";
      //var desc = data[0].description
      //console.log("result data id : ",desc.String)
      //최초 로그인시에는 호출되지 않도록 버그 수정
      if (!mcpjs["util/util"].isEmpty(data) && data.length > 0) {
        data
          .filter((list) => list.name !== "")
          .map(
            (item, index) =>
              (html +=
                "<div class=\"list\" onclick=\"mcpjs['auth/login'].selectNS('" +
                item.name +
                "');\">" +
                '<div class="stit">' +
                item.name +
                "</div>" +
                '<div class="stxt">' +
                item.description +
                " </div>" +
                "</div>")
          );
        console.log("show html :", html);
        $("#nsList").empty();
        $("#nsList").append(html);
        nsModal();
      }
    })
    .catch(function (error) {
      console.log(error);
      if (error.response) {
        // 서버가 2xx 외의 상태 코드를 리턴한 경우
        //error.response.headers / error.response.status / error.response.data
        alert(
          "There is a problem communicating with cb-tumblebug server\nCheck the cb-tumblebug server\nCall Url : " +
            url +
            "\nStatus Code : " +
            error.response.status
        );
      } else if (error.request) {
        // 응답을 못 받음
        alert(
          "No response was received from the cb-tumblebug server.\nCheck the cb-tumblebug server\nCall Url : " +
            url
        );
      } else {
        alert(
          "Error communicating with cb-tumblebug server.\n" + error.message
        );
      }
      //console.log(error.config);
    });
}

// namespace 선택modal
export function nsModal() {
  console.log("nsModal called");
  $(".popboxNS .cloudlist .list").each(function () {
    console.log("ns modal foreach ~ing");
    $(this).on("click", function () {
      var $list = $(this);
      var $ok = $(".btn_ok"); // --class 말고 id로
      //var $ok = $("#select_ns_ok_btn");
      $ok.fadeIn();
      $list.addClass("selected");
      $list.siblings().removeClass("selected");
      $list.off("click").on("click", function () {
        if ($(this).hasClass("selected")) {
          $ok.stop().fadeOut();
          $list.removeClass("selected");
        } else {
          $ok.stop().fadeIn();
          $list.addClass("selected");
          $list.siblings().removeClass("selected");
        }
      });
    });
  });
}

export function configModal() {
  console.log("configModal called");
  $(".popbox .cloudlist .list").each(function () {
    $(this).click(function () {
      var $list = $(this);
      var $popboxNS = $(".popboxNS");
      var $arr = $("#popLogin .arr");
      var $ok = $(".btn_ok");
      $popboxNS.fadeIn();
      $arr.fadeIn();
      $list.addClass("selected");
      $list.siblings().removeClass("selected");
      $list.off("click").click(function () {
        if ($(this).hasClass("selected")) {
          $popboxNS.stop().fadeOut();
          $arr.stop().fadeOut();
          $ok.stop().fadeOut();
          $list.removeClass("selected");
        } else {
          $popboxNS.stop().fadeIn();
          $arr.stop().fadeIn();
          $list.addClass("selected");
          $list.siblings().removeClass("selected");
        }
      });
    });
  });
}

// namepace 생성
//function createNS(){
export function createNameSpace() {
  var addNamespaceValue = $("#addNamespace").val();
  var addNamespaceDescValue = $("#addNamespaceDesc").val();

  //var url = "/setting/namespaces/namespace/reg/proc";
  var url = "/namespace/create";
  var obj = {
    name: addNamespaceValue,
    description: addNamespaceDescValue,
  };
  console.log(obj);
  if (addNamespaceValue) {
    client
      .post(url, obj, {
        headers: {
          "Content-type": "application/json",
        },
      })
      .then((result) => {
        console.log(result);
        if (result.status == 200 || result.status == 201) {
          var namespaceList = result.data.nsList;
          //getUserNamespace(namespaceList)

          //mcpjs["util/util"].commonAlert("Success Create NameSpace")

          getNameSpace(); // 생성 후 namespace목록 조회
          $("#btnToggleNamespace").click();
          // $("#namespace").val('')
          // $("#nsDesc").val('')
          clearNameSpaceCreateForm();
        } else {
          mcpjs["util/util"].commonAlert("Fail Create NameSpace");
        }
      })
      .catch(function (error) {
        if (error.response) {
          // 서버가 2xx 외의 상태 코드를 리턴한 경우
          //error.response.headers / error.response.status / error.response.data
          mcpjs["util/util"].commonAlert(
            "There is a problem communicating with cb-tumblebug server\nCheck the cb-tumblebug server\nCall Url : " +
              url +
              "\nStatus Code : " +
              error.response.status
          );
        } else if (error.request) {
          // 응답을 못 받음
          mcpjs["util/util"].commonAlert(
            "No response was received from the cb-tumblebug server.\nCheck the cb-tumblebug server\nCall Url : " +
              url
          );
        } else {
          mcpjs["util/util"].commonAlert(
            "Error communicating with cb-tumblebug server.\n" + error.message
          );
        }
        //console.log(error.config);
      });
  } else {
    mcpjs["util/util"].commonAlert("Input NameSpace");
    $("#addNamespace").focus();
    return;
  }
}

export function selectNS(ns) {
  console.log("select namespace : ", ns);
  $("#sel_ns").val(ns);
}

export function clickOK() {
  var select_ns = $("#sel_ns").val();
  console.log("slect ns is : ", select_ns);
  setNS(select_ns);
}

export function setNS(nsid) {
  if (nsid) {
    var csrfToken = document
      .querySelector('meta[name="csrf-token"]')
      .getAttribute("content");
    var reqUrl = "/namespace/" + nsid;

    console.log(reqUrl);
    client
      .post(reqUrl, {
        headers: {
          "Content-Type": "multipart/form-data",
          "x-csrf-token": csrfToken,
        },
      })
      .then((result) => {
        var data = result.data;
        console.log(data);

        var mcisList = data.McisList;
        if (mcisList) {
          location.href = "/operations/dashboards/dashboardnamespace/mngform";
        } else {
          location.href = "/main";
        }
        //location.href = "/Dashboard/NS"
        //location.href = "/main"
      })
      .catch(function (error) {
        if (error.response) {
          console.log(error.response);
        } else if (error.request) {
          console.log(error.request);
        } else {
          console.log(error.message);
        }
      });
  } else {
    alert("NameSpace가 등록되어 있지 않습니다.\n등록페이지로 이동합니다.");
  }
}
