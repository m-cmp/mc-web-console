import ApexCharts from "apexcharts"

// navBar에 있는 object인데 직접 handling( onchange)
$("#select-current-project").on('change', async function () {
  let project = { "Id": this.value, "Name": this.options[this.selectedIndex].text, "NsId": this.options[this.selectedIndex].text }
  webconsolejs["common/api/services/workspace_api"].setCurrentProject(project)// 세션에 저장
  var respMciList = await webconsolejs["common/api/services/mci_api"].getMciList(project.NsId);
  getMciListCallbackSuccess(project.NsId, respMciList);
})

////
// 모달 콜백 예제
export function commoncallbac(val) {
  alert(val);
}

var selectedWorkspaceProject = new Object();

//DOMContentLoaded 는 Page에서 1개만.
// init + 파일명 () : ex) initMonitoring() 를 호출하도록 한다.
document.addEventListener("DOMContentLoaded", initMonitoring);

// 해당 화면에서 최초 설정하는 function
//로드 시 prj 값 받아와 getPmkList 호출
async function initMonitoring() {
  ////////////////////// partials init functions///////////////////////////////////////
  // try {
  //     webconsolejs["partials/operation/manage/pmkcreate"].initPmkCreate();//PmkCreate을 Partial로 가지고 있음. 
  // } catch (e) {
  //     console.log(e);
  // }
  ////////////////////// partials init functions end ///////////////////////////////////////

  ////////////////////// set workspace list, project list at Navbar///////////////////////////////////////
  selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();

  // workspace selection check
  webconsolejs["partials/layout/modal"].checkWorkspaceSelection(selectedWorkspaceProject)
  ////////////////////// set workspace list, project list at Navbar end //////////////////////////////////



  if (selectedWorkspaceProject.projectId != "") {
    var selectedProjectId = selectedWorkspaceProject.projectId;
    var selectedNsId = selectedWorkspaceProject.nsId;

    //getPmkList();// project가 선택되어 있으면 pmk목록을 조회한다.
    var respMciList = await webconsolejs["common/api/services/mci_api"].getMciList(selectedNsId);
    getMciListCallbackSuccess(selectedProjectId, respMciList);


    // ////////////////////// 받은 pmkId가 있으면 해당 pmkId를 set하고 조회한다. ////////////////
    // // 외부(dashboard)에서 받아온 pmkID가 있으면 pmk INFO 이동
    // // 현재 브라우저의 URL
    // const url = window.location.href;
    // const urlObj = new URL(url);
    // // URLSearchParams 객체 생성
    // const params = new URLSearchParams(urlObj.search);
    // // pmkID 파라미터 값 추출
    // selectedMonitoringID = params.get('pmkID');

    // console.log('selectedMonitoringID:', selectedMonitoringID);  // 출력: pmkID의 값 (예: com)
    // if (selectedMonitoringID != undefined) {
    //     toggleRowSelection(selectedPmkID)
    //     getSelectedPmkData(selectedPmkID)
    // }
    // ////////////////////  pmkId를 set하고 조회 완료. ////////////////
  }
}

function getMciListCallbackSuccess(nsId, mciList) {

  setMciList(mciList)
}

function setMciList(mciList) {
  var res_item = mciList.mci;

  // res_item이 배열인지 확인
  if (Array.isArray(res_item)) {
    // HTML option 리스트 초기값
    var html = '<option value="">Select</option>';

    // res_item 배열을 순회하면서 각 MCI의 name을 option 태그로 변환
    res_item.forEach(item => {
      html += '<option value="' + item.id + '">' + item.name + '</option>';
    });

    // monitoring_mcilist 셀렉트 박스에 옵션 추가
    $("#monitoring_mcilist").empty();
    $("#monitoring_mcilist").append(html);
  } else {
    console.error("res_item is not an array");
  }
}

// mci 선택했을 때 displayMonitoringMci 
$("#monitoring_mcilist").on('change', async function () {

  var selectedMci = $("#monitoring_mcilist").val()

  selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
  var selectedNsId = selectedWorkspaceProject.nsId;

  displayMonitoringMci(selectedNsId, selectedMci)

})


async function displayMonitoringMci(nsId, mciId) {

  var respMci = await webconsolejs["common/api/services/mci_api"].getMci(nsId, mciId);

  var vmList = respMci.responseData.vm
  if (Array.isArray(vmList) && vmList.length > 0) {
    displayServerStatusList(mciId, respMci.responseData.vm)
  } else {
    alert("There is no VM List !!")
  }


}

function displayServerStatusList(mciId, vmList) {

  var res_item = vmList;

  if (Array.isArray(res_item)) {
    var html = '<option value="">Select</option>';

    res_item.forEach(item => {
      html += '<option value="' + item.id + '">' + item.name + '</option>';
    });

    // monitoring_serverlist 셀렉트 박스에 옵션 추가
    $("#monitoring_serverlist").empty();
    $("#monitoring_serverlist").append(html);
  } else {
    console.error("res_item is not an array");
  }

}

// vm 선택했을 때 displayMonitoringMci 
$("#monitoring_serverlist").on('change', async function () {

  var selectedVm = $("#monitoring_serverlist").val()

  selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
  var selectedNsId = selectedWorkspaceProject.nsId;

  setMonitoringMesurement()
})

$("#monitoring_measurement").on('change', async function () {
    var selectedMeasurement = $("#monitoring_measurement").val();

    setMonitoringMetric(selectedMeasurement)
})

// Extend Detection 토글 이벤트 리스너
$("#detectionSwitch").on('change', function() {
  if ($(this).is(':checked')) {
    $("#detection_graph").show();
  } else {
    $("#detection_graph").hide();
  }
})

export async function setMonitoringMesurement(selectId = "monitoring_measurement") {
  try {
    var respMeasurement = await webconsolejs["common/api/services/monitoring_api"].getPlugIns();
    
    // API 응답 구조 확인 및 데이터 추출
    var data;
    if (respMeasurement && respMeasurement.responseData && respMeasurement.responseData.data) {
      data = respMeasurement.responseData.data;
    } else if (respMeasurement && respMeasurement.data) {
      data = respMeasurement.data;
    } else if (respMeasurement && Array.isArray(respMeasurement)) {
      data = respMeasurement;
    } else {
      console.error("Unexpected API response structure:", respMeasurement);
      data = [];
    }
  
    var measurementSelect = document.getElementById(selectId);
    
    if (!measurementSelect) {
      console.error(`${selectId} element not found.`);
      return;
    }

    measurementSelect.innerHTML = "";

    var defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.text = "Select";
    measurementSelect.appendChild(defaultOption);

    if (Array.isArray(data) && data.length > 0) {
      data.forEach(function (item) {
        if (item.pluginType === "INPUT") {
          var option = document.createElement("option");
          option.value = item.name || item.pluginId;
          option.text = item.name || item.pluginId;
          measurementSelect.appendChild(option);
        }
      });
    }
  } catch (error) {
    console.error("setMonitoringMesurement 오류:", error);
  }
}

export async function setMonitoringMetric(selectedMeasurement, selectId = "monitoring_metric") {
    try {
        var respMeasurementFields = await webconsolejs["common/api/services/monitoring_api"].getMeasurementFields();

        // API 응답 구조 확인 및 데이터 추출
        var data;
        if (respMeasurementFields && respMeasurementFields.responseData && respMeasurementFields.responseData.data) {
            data = respMeasurementFields.responseData.data;
        } else if (respMeasurementFields && respMeasurementFields.data) {
            data = respMeasurementFields.data;
        } else if (respMeasurementFields && Array.isArray(respMeasurementFields)) {
            data = respMeasurementFields;
        } else {
            console.error("Unexpected API response structure:", respMeasurementFields);
            data = [];
        }

        var metricSelect = document.getElementById(selectId);

        if (!metricSelect) {
            console.error(`${selectId} element not found.`);
            return;
        }

        metricSelect.innerHTML = "";

        var defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.text = "Select";
        metricSelect.appendChild(defaultOption);

        if (Array.isArray(data) && data.length > 0) {
            data.forEach(function (measurement) {
                if (measurement.measurement === selectedMeasurement) {
                    measurement.fields.forEach(function (field) {
                        var option = document.createElement("option");
                        option.value = field.key;
                        option.text = field.key;
                        metricSelect.appendChild(option);
                    });
                }
            });
        }
    } catch (error) {
        console.error("setMonitoringMetric 오류:", error);
    }
}

export async function startMonitoring() {
  selectedWorkspaceProject = await webconsolejs["partials/layout/navbar"].workspaceProjectInit();
  var selectedNsId = selectedWorkspaceProject.nsId;

  // NS가 선택되지 않은 경우 처리
  if (!selectedNsId) {
      alert("Please select a Workspace first.");
      return;
  }

  var selectedMci = $("#monitoring_mcilist").val()

  // MCI가 선택되지 않은 경우 처리
  if (!selectedNsId) {
      alert("Please select a Workload first.");
      return;
  }

  var selectedMeasurement = $("#monitoring_measurement").val();
  var selectedMetric = $("#monitoring_metric").val();
  var selectedRange = $("#monitoring_range").val();
  var selectedPeriod = $("#monitoring_period").val();
  var selectedVMId = $("#monitoring_serverlist").val();

  // VM이 선택되지 않은 경우 처리
  if (!selectedVMId) {
    alert("Please select a VM first.");
    return;
  }
  
  // 선택된 VM의 이름을 가져와서 타이틀에 표시
  var selectedVMName = $("#monitoring_serverlist option:selected").text();
  if (selectedVMName && selectedVMName !== "Select") {
    $("#selected_vm_name").text("(" + selectedVMName + ")");
  }

  var response = await webconsolejs["common/api/services/monitoring_api"].getInfluxDBMetrics(selectedMeasurement, selectedMetric, selectedRange, selectedPeriod, selectedNsId, selectedMci, selectedVMId);

  // 응답 데이터의 구조를 검증
  if (response && response.responseData && response.responseData.data) {
    var respMonitoringData = response.responseData.data;
    drawMonitoringGraph(respMonitoringData, selectedNsId, selectedMci, selectedVMId, selectedMeasurement);
  } else {
    console.error("Invalid response structure:", response);
  }
}

async function drawMonitoringGraph(MonitoringData, nsId, mciId, vmId, measurement) {
  const chartDataList = [];
  const chartLabels = [];

  // MonitoringData.data가 존재하는지 확인
  if (MonitoringData && Array.isArray(MonitoringData)) {
    MonitoringData.forEach(data => {
      // null 값을 skip하고 유효한 데이터만 필터링
      const validData = data.values
        .filter(value => value[1] !== null && value[1] !== undefined)
        .map(value => ({
          x: value[0], // timestamp
          y: parseFloat(value[1]).toFixed(2)
        }));

      // 유효한 데이터가 있을 때만 시리즈에 추가
      if (validData.length > 0) {
        const seriesData = {
          name: data.name,
          data: validData
        };
        chartDataList.push(seriesData);

        // timestamp 레이블 수집 (null이 아닌 값만)
        data.values.forEach(value => {
          if (value[1] !== null && value[1] !== undefined) {
            const timestamp = value[0];
            if (!chartLabels.includes(timestamp)) {
              chartLabels.push(timestamp);
            }
          }
        });
      }
    });
  } else {
    console.error("MonitoringData is invalid or does not contain data:", MonitoringData);
    return;
  }

  // 유효한 데이터가 없으면 사용자에게 알림
  if (chartDataList.length === 0 || chartDataList.every(series => series.data.length === 0)) {
    alert("No valid data available for the selected metric. Please try a different time range or metric.");
    return;
  }

  const options = {
    chart: {
      type: "area",
      height: 240,
      toolbar: {
        show: true,
      },
      animations: {
        enabled: false,
      }
    },
    title: {
      text: "CPU Usage Idle (cpu0, cpu1, cpu2, cpu3)",
      align: "center",
      style: {
        fontSize: "14px",
        fontWeight: "bold",
        color: "#263238"
      }
    },
    series: chartDataList,
    xaxis: {
      type: "datetime",
      labels: {
        format: "yyyy-MM-dd HH:mm:ss"
      }
    },
    yaxis: {
      labels: {
        formatter: function (val) {
          return val;
        }
      }
    },
    labels: chartLabels,
    fill: {
      type: "solid",
      opacity: 0.16,
    },
    stroke: {
      curve: "smooth",
      width: 2
    },
    colors: ['#FFD700', '#33FF57', '#3357FF', '#FF33A6'],
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      offsetY: -10,
      markers: {
        width: 10,
        height: 10,
        radius: 100,
      }
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: function (val) {
          return val;  // 툴팁에서도 소수점 둘째 자리까지 표시
        }
      }
    },
    grid: {
      strokeDashArray: 4,
    }
  };

  const chart = new ApexCharts(document.getElementById("monitoring_chart_1"), options);
  chart.render();

  // Prediction Switch 체크 여부 확인
  if ($('#monitoring_predictionSwitch').is(':checked')) {
    try {
      // 시간 범위 설정 (기본값: 12시간 전부터 7일 후까지)
      var startTime = null; // null이면 함수 내부에서 12시간 전으로 설정
      var endTime = null;   // null이면 함수 내부에서 7일 후로 설정
      
      // API 호출 시도 - 화면에서 선택한 값 전달
      var response = await webconsolejs["common/api/services/monitoring_api"].monitoringPrediction(nsId, mciId, vmId, measurement, startTime, endTime);

      if (response && response.responseData && response.responseData.values && response.responseData.values.length > 0) {
        const predictionData = response.responseData.values.map(value => ({
          x: value.timestamp,
          y: parseFloat(value.value).toFixed(2)
        }));

        const predictionSeries = {
          name: "CPU Total (Predicted)",
          data: predictionData,
          color: '#FF5733'
        };

        // 기존 데이터와 함께 업데이트
        chart.updateSeries([...chartDataList, predictionSeries]);
      } else {
      }
    } catch (error) {
      console.error("Prediction API failed:", error);
    }
  }

  // Detection Switch 체크 여부 확인
  if ($('#detectionSwitch').is(':checked')) {
    // Detection Graph 영역 표시
    $("#detection_graph").show();
    drawDetectionGraph(nsId, mciId, vmId, measurement);
  } else {
    // Detection Graph 영역 숨김
    $("#detection_graph").hide();
  }

}

async function drawDetectionGraph(nsId, mciId, vmId, measurement) {
  // 시간 범위 설정 (기본값: 12시간 전부터 현재까지)
  var startTime = null; // null이면 함수 내부에서 12시간 전으로 설정
  var endTime = null;   // null이면 함수 내부에서 현재 시간으로 설정
  
  var respDetection = await webconsolejs["common/api/services/monitoring_api"].getDetectionHistory(nsId, mciId, vmId, measurement, startTime, endTime);
  
  if (!respDetection || !respDetection.responseData || !respDetection.responseData.values) {
    console.error("Invalid detection data:", respDetection);
    return;
  }
  
  var detectionData = respDetection.responseData.values;

  const anomalyData = detectionData.map(item => ({
    x: item.timestamp,  
    y: item.anomaly_score
  }));

  const options = {
    chart: {
      type: 'line',
      height: 240,
      toolbar: {
        show: true,
      }
    },
    series: [{
      name: 'Anomaly Score',
      data: anomalyData  
    }],
    title: {
      text: 'Anomaly Score Over Time',
      align: 'center',
      style: {
        fontSize: '14px',
        fontWeight: 'bold',
        color: '#263238'
      }
    },
    xaxis: {
      type: 'datetime',  
      labels: {
        format: "yyyy-MM-dd HH:mm:ss"
      }
    },
    yaxis: {
      labels: {
        formatter: function (val) {
          return val.toFixed(2);  
        }
      },
      title: {
        text: 'Anomaly Score'
      }
    },
    markers: {
      size: 5,
      colors: ['#FF4560'],  
      strokeWidth: 2
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    grid: {
      strokeDashArray: 4,
    },
    tooltip: {
      theme: "dark",
      y: {
        formatter: function (val) {
          return val.toFixed(2);
        }
      }
    }
  };

  const chart = new ApexCharts(document.getElementById("detection_chart_1"), options);
  chart.render();
}

