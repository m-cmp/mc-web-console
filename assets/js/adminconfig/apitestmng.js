import { client } from "/assets/js/util/util";

const dataList = document.getElementById("dataList").innerText.split(",");
const $search = document.querySelector("#search");
const $testBtn = document.querySelector("#testbtn");
const $autoComplete = document.querySelector(".autocomplete");

var CSRFTK = "";
var serverLocation = "";

let nowIndex = 0;
$(document).ready(function () {
  serverLocation = window.location.hostname + ":" + window.location.port;
  // document.getElementById("searchplaceholder").textContent = serverLocation;
  var CSRFTK = document
    .querySelector('meta[name="csrf-token"]')
    .getAttribute("content");
});

//API 자동완성 로직
$search.onkeyup = (event) => {
  // 검색어
  const value = $search.value.trim();
  console.log(dataList);

  // 자동완성 필터링
  const matchDataList = value
    ? dataList.filter((label) => label.includes(value))
    : [];

  switch (event.keyCode) {
    // UP KEY
    case 38:
      nowIndex = Math.max(nowIndex - 1, 0);
      break;

    // DOWN KEY
    case 40:
      nowIndex = Math.min(nowIndex + 1, matchDataList.length - 1);
      break;

    // ENTER KEY
    case 13:
      document.querySelector("#search").value = matchDataList[nowIndex] || "";

      // 초기화
      nowIndex = 0;
      matchDataList.length = 0;
      break;

    // 그외 다시 초기화
    default:
      nowIndex = 0;
      break;
  }

  // 리스트 보여주기
  showRouterSearchList(matchDataList, value, nowIndex);
};

// router 자동완성 키 맵
const showRouterSearchList = (data, value, nowIndex) => {
  const regex = new RegExp(`(${value})`, "g");
  $autoComplete.innerHTML = data
    .map(
      (label, index) => `
			<div class='${nowIndex === index ? "active" : ""}'>
				${label.replace(regex, "<mark>$1</mark>")}
			</div>
		`
    )
    .join("");
};

// $("#queryadd").on("keyup", function (event) {
//   if (event.keyCode === 13) {
//     $("#querybox").append(
//       "<div class='input-group input-group-sm'>" +
//         "<span class='input-group-text'>" +
//         "QUERY ADD" +
//         "</span>" +
//         "<input type='text' id='queryadd' class='form-control' />" +
//         "<span class='input-group-text'>" +
//         "<button type='button' class='btn btn-outline-light text-dark'>" +
//         "ADD" +
//         "</button>" +
//         "</span>" +
//         "</div>"
//     );
//   }
// });

//swagger 항목 찾아서 팝업 열기
$("#swaggerSearch").click(function () {
  var url = mcpjs["util/pathfinder"].getURL("ApiSearch");
  var obj = {
    path: $("#search").val(),
  };
  client.post(url, obj).then((result) => {
    var swagPath = "/swagger/index.html#/";
    var targetPath =
      swagPath +
      result.data.ResourceName +
      "/" +
      result.data.Method.toLowerCase() +
      result.data.Path.split("/").join("_").toLowerCase();

    console.log(targetPath);
    window.open(targetPath);
  });
});

$("#testbtn").click(function () {
  $(this)
    .prop("disabled", true)
    .html("<span class='spinner-border spinner-border-sm'></span> Loading..");

  var METHOD = $('input[name="METHOD"]:checked').val();

  switch (METHOD) {
    case "GET":
      console.log("GET start");
      METHOD_GET();
      break;
    case "POST":
      console.log("POST start");
      METHOD_POST();
      break;
    case "DELETE":
      console.log("DELETE start");
      METHOD_DELETE();
      break;
    case "PUT":
      console.log("PUT start");
      METHOD_PUT();
      break;
    default:
      console.log("METHOD err");
  }

  $(this).prop("disabled", false).html("TEST");
});

function METHOD_GET() {
  client
    .get($search.value, {})
    .then((response) => {
      console.log(response.data);
      $("#result").val(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
      $("#result").val(JSON.stringify(error));
      alert("Fail" + error);
    });
}

function METHOD_POST() {
  console.log($("#data").val());
  try {
    var data = JSON.parse($("#data").val());
  } catch {
    var data = null;
  }

  client
    .post($("#search").val(), data)
    .then((response) => {
      console.log(response.data);
      $("#result").val(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
      $("#result").val(JSON.stringify(error));
      alert("Fail" + error);
    });
}

function METHOD_DELETE() {
  console.log($("#data").val());
  var data = JSON.parse($("#data").val());
  console.log('JSON.parse($("#data").val()', data);
  client
    .delete($("#search").val(), data)
    .then((response) => {
      console.log(response.data);
      $("#result").val(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
      $("#result").val(JSON.stringify(error));
      alert("Fail" + error);
    });
}

function METHOD_PUT() {
  console.log($("#data").val());
  var data = JSON.parse($("#data").val());
  console.log('JSON.parse($("#data").val()', data);
  client
    .put($("#search").val(), data)
    .then((response) => {
      console.log(response.data);
      $("#result").val(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
      $("#result").val(JSON.stringify(error));
      alert("Fail" + error);
    });
}

$("#prettyPrint").click(function prettyPrint() {
  var ugly = document.getElementById("result").value;
  var obj = JSON.parse(ugly);
  var pretty = JSON.stringify(obj, undefined, 4);
  document.getElementById("result").value = pretty;
});
