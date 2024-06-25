import Apexcharts from "apexcharts"

// function drawGraph(data, label, ...){

// }
const coffeeData = {
  cpuAmericano: {
    name: "americano",
    data: [75, 78, 76, 52, 82, 102, 90]
  },
  cpuLatte: {
    name: "latte",
    data: [72, 43, 81, 54, 77, 63, 79]
  },

  memoryAmericano: {
    name: "americano",
    data: [63, 61, 65, 64, 62, 60, 76]
  },
  memoryLatte: {
    name: "latte",
    data: [52, 50, 58, 49, 42, 50, 69]
  },

  diskAmericano: {
    name: "americano",
    data: [40, 42, 41, 43, 44, 39, 42]
  },
  diskLatte: {
    name: "latte",
    data: [32, 30, 38, 39, 32, 30, 39]
  },

  networkAmericano: {
    name: "americano",
    data: [1520, 1410, 1583, 1495, 1623, 1389, 1501]
  },
  networkLatte: {
    name: "latte",
    data: [1120, 1250, 1293, 1225, 1183, 1199, 1161]
  }
};

document.addEventListener("DOMContentLoaded", function () {
  console.log("=====", window)
  window && (new Apexcharts(document.getElementById('cpu-chart'), {
    chart: {
      type: "area",
      fontFamily: 'inherit',
      height: 240,
      parentHeightOffset: 0,
      toolbar: {
        show: true,
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
    series: [
      coffeeData.cpuAmericano,
      coffeeData.cpuLatte
    ],
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
        show: true,
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
    series: [
      coffeeData.memoryAmericano,
      coffeeData.memoryLatte
    ],
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
        show: true,
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
    series: [
      coffeeData.diskAmericano,
      coffeeData.diskLatte
      ],
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
        show: true,
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
    series: [
      coffeeData.networkAmericano,
      coffeeData.networkLatte
    ],
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
