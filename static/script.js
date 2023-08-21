// Grab all inputs
let inputs = document.querySelectorAll('input');

var moistureChart = createChart('moistureChart', 'Feuchtigkeit (%)');
var temperatureChart = createChart('temperatureChart', 'Temperatur (°C)');
var humidityChart = createChart('humidityChart', 'Luftfeuchtigkeit (%)');
var pressureChart = createChart('airPressureChart', 'Luftdruck (Pa)');
var whiteChart = createChart('whiteChart', 'Weißes Licht (Lux)');
var visibleChart = createChart('visibleChart', 'Sichtbares Licht (Lux)');
var charts = [moistureChart, temperatureChart, humidityChart, pressureChart, whiteChart, visibleChart]

var NUMBER_OF_MEASUREMENTS = 48;
var timer = null;

var HOSTNAME = "e795af42-f489-4f54-8ff6-ade24852e1da.ul.bw-cloud-instance.org"

var ws = new WebSocket("ws://" + HOSTNAME + "/ws");

function createChart(id, label1) {
    var datasets = [{
        label: label1,
        data: Array(10).fill(null),
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.4,
    }];

    var ctx = document.getElementById(id).getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array(10).fill(''),
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    display: false,
                    beginAtZero: false,
                },
                x: {
                    display: false,
                }
            },
            elements: {
                point: {
                    radius: 0,
                    hoverRadius: 10
                }
            },
            interaction: {
                mode: 'nearest',
                intersect: false,
            },
        }
    });
}

function refreshData() {
    fetch("http://" + HOSTNAME + "/api/measurements")
        .then(response => response.json())
        .then(data => {
            console.log(data);
            data.forEach(measurement => {
                moistureChart.data.datasets[0].data.push(measurement.data.moisture);
                temperatureChart.data.datasets[0].data.push(measurement.data.temperature);
                humidityChart.data.datasets[0].data.push(measurement.data.humidity);
                pressureChart.data.datasets[0].data.push(measurement.data.pressure);
                whiteChart.data.datasets[0].data.push(measurement.data.white);
                visibleChart.data.datasets[0].data.push(measurement.data.visible);

                charts.forEach(chart => {
                    chart.data.labels.push('');
                    if (chart.data.datasets[0].data.length > NUMBER_OF_MEASUREMENTS) {
                        chart.data.datasets[0].data.shift();
                        chart.data.labels.shift();
                    }
                    chart.update();
                });
            });
        });
}


function inputHandler(event) {
    clearTimeout(timer);
    if (event.target.value != "") {
        timer = setTimeout(() => {
            ws.send(JSON.stringify({
                'value': Number(event.target.value),
                'name': event.target.name
            }
            ));
            check_limits();
        }, 1000);
    }
}

inputs.forEach(input => {
    input.addEventListener('input', inputHandler);
});

ws.onmessage = function (event) {
    data = JSON.parse(event.data).data;
    // Add new data to charts
    moistureChart.data.datasets[0].data.push(data.moisture);
    temperatureChart.data.datasets[0].data.push(data.temperature);
    humidityChart.data.datasets[0].data.push(data.humidity);
    pressureChart.data.datasets[0].data.push(data.pressure);
    whiteChart.data.datasets[0].data.push(data.white);
    visibleChart.data.datasets[0].data.push(data.visible);

    charts.forEach(chart => {
        chart.data.labels.push('');
        if (chart.data.datasets[0].data.length > NUMBER_OF_MEASUREMENTS) {
            chart.data.datasets[0].data.shift();
            chart.data.labels.shift();
        }
        chart.update();
    });
};

function check_limit(chart, limit) {
    if (chart.data.datasets[0].data.slice(-1) < limit[0] || chart.data.datasets[0].data.slice(-1) > limit[1]) {
        chart.data.datasets[0].borderColor = "red";
        chart.update();
    } else {
        chart.data.datasets[0].borderColor = "rgba(75, 192, 192, 1)";
        chart.update();
    }
}

function check_limits() {
    fetch("http://" + HOSTNAME + "/api/limits")
        .then(response => response.json())
        .then(data => {
            check_limit(moistureChart, data.moisture);
            check_limit(temperatureChart, data.temperature);
            check_limit(humidityChart, data.humidity);
            check_limit(visibleChart, data.visible);
            check_limit(whiteChart, data.white);
            check_limit(pressureChart, data.pressure);
        });
}

refreshData();
check_limits();