// Grab all inputs
let inputs = document.querySelectorAll('input');

var moistureChart = createChart('moistureChart', 'Feuchtigkeit (%)');
var temperatureChart = createChart('temperatureChart', 'Temperatur (°C)');
var humidityChart = createChart('humidityChart', 'Luftfeuchtigkeit (%)');
var pressureChart = createChart('airPressureChart', 'Luftdruck (Pa)');
var whiteChart = createChart('whiteChart', 'Weißes Licht (Lux)');
var visibleChart = createChart('visibleChart', 'Sichtbares Licht (Lux)');

var NUMBER_OF_MEASUREMENTS = 48;
var timer = null;

var ws = new WebSocket("ws://127.0.0.1/ws");

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
    fetch('http://127.0.0.1/api/measurements')
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

                moistureChart.data.labels.push('');
                temperatureChart.data.labels.push('');
                humidityChart.data.labels.push('');
                pressureChart.data.labels.push('');
                whiteChart.data.labels.push('');
                visibleChart.data.labels.push('');

                if (moistureChart.data.datasets[0].data.length > NUMBER_OF_MEASUREMENTS) {
                    moistureChart.data.datasets[0].data.shift();
                    moistureChart.data.labels.shift();
                    temperatureChart.data.datasets[0].data.shift();
                    temperatureChart.data.labels.shift();
                    humidityChart.data.datasets[0].data.shift();
                    humidityChart.data.labels.shift();
                    pressureChart.data.datasets[0].data.shift();
                    pressureChart.data.labels.shift();
                    whiteChart.data.datasets[0].data.shift();
                    whiteChart.data.labels.shift();
                    visibleChart.data.datasets[0].data.shift();
                    visibleChart.data.labels.shift();
                }
            });

            moistureChart.update();
            temperatureChart.update();
            humidityChart.update();
            pressureChart.update();
            whiteChart.update();
            visibleChart.update();
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
        }, 1000);
    }
}

inputs.forEach(input => {
    input.addEventListener('input', inputHandler);
});

refreshData();

ws.onmessage = function (event) {
    data = JSON.parse(event.data).data;
    // Add new data to charts
    moistureChart.data.datasets[0].data.push(data.moisture);
    temperatureChart.data.datasets[0].data.push(data.temperature);
    humidityChart.data.datasets[0].data.push(data.humidity);
    pressureChart.data.datasets[0].data.push(data.pressure);
    whiteChart.data.datasets[0].data.push(data.white);
    visibleChart.data.datasets[0].data.push(data.visible);

    moistureChart.data.labels.push('');
    temperatureChart.data.labels.push('');
    humidityChart.data.labels.push('');
    pressureChart.data.labels.push('');
    whiteChart.data.labels.push('');
    visibleChart.data.labels.push('');

    if (moistureChart.data.datasets[0].data.length > NUMBER_OF_MEASUREMENTS) {
        moistureChart.data.datasets[0].data.shift();
        moistureChart.data.labels.shift();
        temperatureChart.data.datasets[0].data.shift();
        temperatureChart.data.labels.shift();
        humidityChart.data.datasets[0].data.shift();
        humidityChart.data.labels.shift();
        pressureChart.data.datasets[0].data.shift();
        pressureChart.data.labels.shift();
        whiteChart.data.datasets[0].data.shift();
        whiteChart.data.labels.shift();
        visibleChart.data.datasets[0].data.shift();
        visibleChart.data.labels.shift();
    }

    moistureChart.update();
    temperatureChart.update();
    humidityChart.update();
    pressureChart.update();
    whiteChart.update();
    visibleChart.update();
};
