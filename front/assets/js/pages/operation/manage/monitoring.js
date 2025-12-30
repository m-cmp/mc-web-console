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

// 차트 인스턴스와 현재 메트릭 목록을 저장할 전역 변수
var monitoringChartInstance = null;
var currentMetrics = []; // 현재 표시 중인 메트릭 목록
var currentMeasurement = null; // 현재 measurement
var currentVMId = null; // 현재 VM ID

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

  // Start Monitoring 버튼 클릭 시 항상 차트 초기화
  if (monitoringChartInstance) {
    monitoringChartInstance.destroy();
    monitoringChartInstance = null;
  }
  currentMetrics = [];
  currentMeasurement = selectedMeasurement;
  currentVMId = selectedVMId;

  var response = await webconsolejs["common/api/services/monitoring_api"].getInfluxDBMetrics(selectedMeasurement, selectedMetric, selectedRange, selectedPeriod, selectedNsId, selectedMci, selectedVMId);

  // Debug: Log response structure
  console.log('startMonitoring - response:', response);
  console.log('startMonitoring - response.responseData:', response?.responseData);
  console.log('startMonitoring - response.responseData.data:', response?.responseData?.data);

  // 응답 데이터의 구조를 검증
  if (response && response.responseData && response.responseData.data) {
    var respMonitoringData = response.responseData.data;
    console.log('startMonitoring - respMonitoringData:', respMonitoringData);
    drawMonitoringGraph(respMonitoringData, selectedNsId, selectedMci, selectedVMId, selectedMeasurement, selectedMetric);
  } else {
    console.error("Invalid response structure:", response);
  }
}

async function drawMonitoringGraph(MonitoringData, nsId, mciId, vmId, measurement, metric) {
  const chartDataList = [];
  const chartLabels = [];

  // Debug: Log input parameters
  console.log('drawMonitoringGraph - MonitoringData:', MonitoringData);
  console.log('drawMonitoringGraph - measurement:', measurement);
  console.log('drawMonitoringGraph - metric:', metric);

  // MonitoringData.data가 존재하는지 확인
  if (MonitoringData && Array.isArray(MonitoringData)) {
    MonitoringData.forEach(data => {
      // Debug: Log each data series
      console.log('drawMonitoringGraph - data series:', data);
      console.log('drawMonitoringGraph - data.name:', data.name);
      console.log('drawMonitoringGraph - data.columns:', data.columns);
      console.log('drawMonitoringGraph - data.values:', data.values);
      
      // 데이터 구조 확인: columns 배열을 확인하여 어떤 컬럼이 어떤 인덱스인지 확인
      if (data.columns && data.columns.length >= 2) {
        console.log('drawMonitoringGraph - Column 0:', data.columns[0], 'Column 1:', data.columns[1]);
        // 첫 번째 값 샘플 확인
        if (data.values && data.values.length > 0) {
          console.log('drawMonitoringGraph - First value sample:', data.values[0]);
          console.log('drawMonitoringGraph - value[0] type:', typeof data.values[0][0], 'value:', data.values[0][0]);
          console.log('drawMonitoringGraph - value[1] type:', typeof data.values[0][1], 'value:', data.values[0][1]);
        }
      }
      
      // null 값을 skip하고 유효한 데이터만 필터링
      const validData = data.values
        .filter(value => value[1] !== null && value[1] !== undefined)
        .map((value, index, array) => {
          // 타임스탬프를 Date 객체로 변환 (ISO 문자열이거나 Unix 타임스탬프일 수 있음)
          let timestamp = value[0];
          if (typeof timestamp === 'string') {
            // ISO 문자열인 경우
            timestamp = new Date(timestamp).getTime();
          } else if (typeof timestamp === 'number' && timestamp < 10000000000) {
            // Unix 타임스탬프 (초 단위)인 경우 밀리초로 변환
            timestamp = timestamp * 1000;
          }
          
          // 실제 값 추출
          let yValue = parseFloat(value[1]);
          
          // server_time 메트릭인 경우: 타임스탬프 값을 시간 차이(초)로 변환
          // columns 배열의 두 번째 컬럼이 'server_time'인지 확인
          if (metric === 'server_time' && data.columns && data.columns.length >= 2) {
            const columnName = data.columns[1];
            console.log('drawMonitoringGraph - Processing server_time metric, column name:', columnName);
            
            // server_time 컬럼인 경우 처리
            if (columnName === 'server_time' || columnName === metric) {
              // server_time은 타임스탬프 값이므로, 첫 번째 값과의 차이를 초 단위로 계산
              if (index === 0) {
                // 첫 번째 값은 0으로 설정 (기준점)
                yValue = 0;
              } else {
                // 이전 값과의 차이를 초 단위로 계산
                const prevValue = parseFloat(array[index - 1][1]);
                const currentValue = parseFloat(value[1]);
                
                // 타임스탬프 차이 계산
                const timeDiff = Math.abs(currentValue - prevValue);
                
                // 타임스탬프가 밀리초 단위인지 초 단위인지 판단
                // 일반적으로 Unix 타임스탬프는 10자리(초) 또는 13자리(밀리초)
                if (currentValue > 1000000000000) {
                  // 밀리초 단위 (13자리 이상)
                  yValue = timeDiff / 1000; // 밀리초를 초로 변환
                } else if (currentValue > 1000000000) {
                  // 초 단위 (10자리)
                  yValue = timeDiff; // 이미 초 단위
                } else {
                  // 매우 작은 값인 경우 그대로 사용
                  yValue = timeDiff;
                }
              }
            }
          }
          
          return {
            x: timestamp, // timestamp (milliseconds)
            y: yValue // 실제 값 또는 server_time의 경우 시간 차이(초)
          };
        });

      console.log('drawMonitoringGraph - validData (first 3):', validData.slice(0, 3));

      // 유효한 데이터가 있을 때만 시리즈에 추가
      if (validData.length > 0) {
        // 시리즈 이름을 메트릭 기반으로 설정 (data.name이 있으면 사용, 없으면 metric 사용)
        const seriesName = metric || data.name || 'Unknown';
        const seriesData = {
          name: seriesName,
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

  console.log('drawMonitoringGraph - chartDataList:', chartDataList);

  // 유효한 데이터가 없으면 사용자에게 알림
  if (chartDataList.length === 0 || chartDataList.every(series => series.data.length === 0)) {
    alert("No valid data available for the selected metric. Please try a different time range or metric.");
    return;
  }

  // 동적 차트 제목 생성: Measurement - Metric 형식
  const chartTitle = `${measurement.toUpperCase()} - ${metric || 'Unknown'}`;

  // 기존 차트가 있으면 제거
  if (monitoringChartInstance) {
    monitoringChartInstance.destroy();
    monitoringChartInstance = null;
  }

  // 새 차트 생성
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
      text: chartTitle,
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
    colors: ['#FFD700', '#33FF57', '#3357FF', '#FF33A6', '#FF6B9D', '#C44569', '#F8B500', '#6C5CE7'],
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
          return val;
        }
      }
    },
    grid: {
      strokeDashArray: 4,
    }
  };

  monitoringChartInstance = new ApexCharts(document.getElementById("monitoring_chart_1"), options);
  monitoringChartInstance.render();

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

        // 기존 차트 인스턴스가 있으면 예측 데이터 추가
        if (monitoringChartInstance) {
          const existingSeries = monitoringChartInstance.w.globals.series.map((series, index) => {
            return {
              name: monitoringChartInstance.w.globals.seriesNames[index],
              data: series
            };
          });
          
          monitoringChartInstance.updateSeries([...existingSeries, predictionSeries]);
        }
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

