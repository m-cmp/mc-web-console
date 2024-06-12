import Apexcharts from "apexcharts"


document.addEventListener("DOMContentLoaded", function () {
  console.log("=====", window)
  window && (new Apexcharts(document.getElementById('cpu-chart'), {
    chart: {
      type: "area",
      fontFamily: 'inherit',
      height: 240,
      parentHeightOffset: 0,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: false
      },
    },
    title: {
      text: "CPU",
      align: 'center',
      margin: 10,
      offsetX: 0,
      offsetY: 0,
      floating: false,
      style: {
        fontSize: '14px',
        fontWeight: 'bold',
        fontFamily: undefined,
        color: '#263238'
      },
    },
    dataLabels: {
      enabled: false,
    },
    fill: {
      opacity: .16,
      type: 'solid'
    },
    stroke: {
      width: 2,
      lineCap: "round",
      curve: "smooth",
    },
    series: [{
      name: "series1",
      data: [56, 40, 39, 47, 34, 48, 44]
    }, {
      name: "series2",
      data: [45, 43, 30, 23, 38, 39, 54]
    }],
    tooltip: {
      theme: 'dark'
    },
    grid: {
      padding: {
        top: -20,
        right: 0,
        left: -4,
        bottom: -4
      },
      strokeDashArray: 4,
    },
    xaxis: {
      labels: {
        padding: 0,
      },
      tooltip: {
        enabled: false
      },
      axisBorder: {
        show: false,
      },
      type: 'datetime',
    },
    yaxis: {
      labels: {
        padding: 4
      },
    },
    labels: [
      '2020-06-21', '2020-06-22', '2020-06-23', '2020-06-24', '2020-06-25', '2020-06-26', '2020-06-27'
    ],
    colors: [tabler.getColor("primary"), tabler.getColor("purple")],
    legend: {
      show: true,
      position: 'bottom',
      offsetY: 12,
      markers: {
        width: 10,
        height: 10,
        radius: 100,
      },
      itemMargin: {
        horizontal: 8,
        vertical: 8
      },
    },
  })).render();
});


document.addEventListener("DOMContentLoaded", function () {
  console.log("=====", window)
  window && (new Apexcharts(document.getElementById('memory-chart'), {
    chart: {
      type: "area",
      fontFamily: 'inherit',
      height: 240,
      parentHeightOffset: 0,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: false
      },
    },
    title: {
      text: "Memory",
      align: 'center',
      margin: 10,
      offsetX: 0,
      offsetY: 0,
      floating: false,
      style: {
        fontSize: '14px',
        fontWeight: 'bold',
        fontFamily: undefined,
        color: '#263238'
      },
    },
    dataLabels: {
      enabled: false,
    },
    fill: {
      opacity: .16,
      type: 'solid'
    },
    stroke: {
      width: 2,
      lineCap: "round",
      curve: "smooth",
    },
    series: [{
      name: "series1",
      data: [56, 40, 39, 47, 34, 48, 44]
    }, {
      name: "series2",
      data: [45, 43, 30, 23, 38, 39, 54]
    }],
    tooltip: {
      theme: 'dark'
    },
    grid: {
      padding: {
        top: -20,
        right: 0,
        left: -4,
        bottom: -4
      },
      strokeDashArray: 4,
    },
    xaxis: {
      labels: {
        padding: 0,
      },
      tooltip: {
        enabled: false
      },
      axisBorder: {
        show: false,
      },
      type: 'datetime',
    },
    yaxis: {
      labels: {
        padding: 4
      },
    },
    labels: [
      '2020-06-21', '2020-06-22', '2020-06-23', '2020-06-24', '2020-06-25', '2020-06-26', '2020-06-27'
    ],
    colors: [tabler.getColor("primary"), tabler.getColor("purple")],
    legend: {
      show: true,
      position: 'bottom',
      offsetY: 12,
      markers: {
        width: 10,
        height: 10,
        radius: 100,
      },
      itemMargin: {
        horizontal: 8,
        vertical: 8
      },
    },
  })).render();
});

document.addEventListener("DOMContentLoaded", function () {
  console.log("=====", window)
  window && (new Apexcharts(document.getElementById('disk-chart'), {
    chart: {
      type: "area",
      fontFamily: 'inherit',
      height: 240,
      parentHeightOffset: 0,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: false
      },
    },

    title: {
      text: "Disk",
      align: 'center',
      margin: 10,
      offsetX: 0,
      offsetY: 0,
      floating: false,
      style: {
        fontSize: '14px',
        fontWeight: 'bold',
        fontFamily: undefined,
        color: '#263238'
      },
    },

    dataLabels: {
      enabled: false,
    },
    fill: {
      opacity: .16,
      type: 'solid'
    },
    stroke: {
      width: 2,
      lineCap: "round",
      curve: "smooth",
    },
    series: [{
      name: "series1",
      data: [56, 40, 39, 47, 34, 48, 44]
    }, {
      name: "series2",
      data: [45, 43, 30, 23, 38, 39, 54]
    }],
    tooltip: {
      theme: 'dark'
    },
    grid: {
      padding: {
        top: -20,
        right: 0,
        left: -4,
        bottom: -4
      },
      strokeDashArray: 4,
    },
    xaxis: {
      labels: {
        padding: 0,
      },
      tooltip: {
        enabled: false
      },
      axisBorder: {
        show: false,
      },
      type: 'datetime',
    },
    yaxis: {
      labels: {
        padding: 4
      },
    },
    labels: [
      '2020-06-21', '2020-06-22', '2020-06-23', '2020-06-24', '2020-06-25', '2020-06-26', '2020-06-27'
    ],
    colors: [tabler.getColor("primary"), tabler.getColor("purple")],
    legend: {
      show: true,
      position: 'bottom',
      offsetY: 12,
      markers: {
        width: 10,
        height: 10,
        radius: 100,
      },
      itemMargin: {
        horizontal: 8,
        vertical: 8
      },
    },
  })).render();
});

document.addEventListener("DOMContentLoaded", function () {
  console.log("=====", window)
  window && (new Apexcharts(document.getElementById('network-chart'), {
    chart: {
      type: "area",
      fontFamily: 'inherit',
      height: 240,
      parentHeightOffset: 0,
      toolbar: {
        show: false,
      },
      animations: {
        enabled: false
      },
    },

    title: {
      text: "Network",
      align: 'center',
      margin: 10,
      offsetX: 0,
      offsetY: 0,
      floating: false,
      style: {
        fontSize: '14px',
        fontWeight: 'bold',
        fontFamily: undefined,
        color: '#263238'
      },
    },

    dataLabels: {
      enabled: false,
    },
    fill: {
      opacity: .16,
      type: 'solid'
    },
    stroke: {
      width: 2,
      lineCap: "round",
      curve: "smooth",
    },
    series: [{
      name: "series1",
      data: [56, 40, 39, 47, 34, 48, 44]
    }, {
      name: "series2",
      data: [45, 43, 30, 23, 38, 39, 54]
    }],
    tooltip: {
      theme: 'dark'
    },
    grid: {
      padding: {
        top: -20,
        right: 0,
        left: -4,
        bottom: -4
      },
      strokeDashArray: 4,
    },
    xaxis: {
      labels: {
        padding: 0,
      },
      tooltip: {
        enabled: false
      },
      axisBorder: {
        show: false,
      },
      type: 'datetime',
    },
    yaxis: {
      labels: {
        padding: 4
      },
    },
    labels: [
      '2020-06-21', '2020-06-22', '2020-06-23', '2020-06-24', '2020-06-25', '2020-06-26', '2020-06-27'
    ],
    colors: [tabler.getColor("primary"), tabler.getColor("purple")],
    legend: {
      show: true,
      position: 'bottom',
      offsetY: 12,
      markers: {
        width: 10,
        height: 10,
        radius: 100,
      },
      itemMargin: {
        horizontal: 8,
        vertical: 8
      },
    },
  })).render();
});
