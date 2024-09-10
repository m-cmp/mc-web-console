document.addEventListener("DOMContentLoaded", async function () {
  const response = await webconsolejs["common/api/http"].commonAPIPost('/api/demogetuserinfo', null)
  if (response.status != 200) {
    alert("userinfo get Fail")

  } else {
    let preferred_username = document.getElementById("preferred_username")
    let exp = document.getElementById("exp")
    let wsprj = document.getElementById("wsprj")
    let role = document.getElementById("role")

    let currentWorkspace = webconsolejs["common/api/services/workspace_api"].getCurrentWorkspace().Name
    let currentProject = webconsolejs["common/api/services/workspace_api"].getCurrentProject().Name

    preferred_username.textContent = response.data.responseData.preferred_username;
    exp.textContent = convertUnixTimestamp(response.data.responseData.exp);
    wsprj.textContent = currentWorkspace + " / " + currentProject;
    role.textContent = response.data.responseData.clientRole;
  }
});
let wsprj = document.getElementById("wsprj")


function convertUnixTimestamp(unixTimestamp) {
  // UNIX 타임스탬프를 밀리초 단위로 변환
  let milliseconds = unixTimestamp * 1000;

  // 밀리초를 Date 객체로 변환
  let dateObject = new Date(milliseconds);

  // Date 객체에서 연, 월, 일, 시, 분, 초 정보 추출
  let year = dateObject.getFullYear();
  let month = ("0" + (dateObject.getMonth() + 1)).slice(-2); // 월은 0부터 시작하므로 1을 더해줌
  let day = ("0" + dateObject.getDate()).slice(-2);
  let hours = ("0" + dateObject.getHours()).slice(-2);
  let minutes = ("0" + dateObject.getMinutes()).slice(-2);
  let seconds = ("0" + dateObject.getSeconds()).slice(-2);

  // 변환된 값을 문자열로 조합하여 반환
  let convertedTime = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
  return convertedTime;
}