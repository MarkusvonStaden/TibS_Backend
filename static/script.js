var temperatureChart = createChart('temperatureChart', 'Temperatur (°C)');
var humidityChart = createChart('humidityChart', 'Luftfeuchtigkeit (%)');
var pressureChart = createChart('airPressureChart', 'Luftdruck (Pa)');
var lightChart = createChart('lightChart', 'Weißes Licht', 'Sichtbares Licht');

var NUMBER_OF_MEASUREMENTS = 48;

var ws = new WebSocket("ws://127.0.0.1/ws");

function createChart(id, label1, label2) {
    var datasets = [{
        label: label1,
        data: Array(10).fill(null),
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.4
    }];

    if (label2) {
        datasets.push({
            label: label2,
            data: Array(10).fill(null),
            borderColor: 'rgba(255, 99, 132, 1)',
            tension: 0.4
        });
    }

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
                    radius: 0
                }
            },
            interaction: {
                mode: 'nearest',
                intersect: false,
            },
            animation: {
                duration: 500,
                easing: 'linear',
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
                temperatureChart.data.datasets[0].data.push(measurement.data.temperature);
                humidityChart.data.datasets[0].data.push(measurement.data.humidity);
                pressureChart.data.datasets[0].data.push(measurement.data.pressure);
                lightChart.data.datasets[0].data.push(measurement.data.white);
                lightChart.data.datasets[1].data.push(measurement.data.visible);

                temperatureChart.data.labels.push('');
                humidityChart.data.labels.push('');
                pressureChart.data.labels.push('');
                lightChart.data.labels.push('');

                if (temperatureChart.data.datasets[0].data.length > NUMBER_OF_MEASUREMENTS) {
                    temperatureChart.data.datasets[0].data.shift();
                    temperatureChart.data.labels.shift();
                }
                if (humidityChart.data.datasets[0].data.length > NUMBER_OF_MEASUREMENTS) {
                    humidityChart.data.datasets[0].data.shift();
                    humidityChart.data.labels.shift();
                }
                if (pressureChart.data.datasets[0].data.length > NUMBER_OF_MEASUREMENTS) {
                    pressureChart.data.datasets[0].data.shift();
                    pressureChart.data.labels.shift();
                }
                if (lightChart.data.datasets[0].data.length > NUMBER_OF_MEASUREMENTS) {
                    lightChart.data.datasets[0].data.shift();
                }
                if (lightChart.data.datasets[1].data.length > NUMBER_OF_MEASUREMENTS) {
                    lightChart.data.datasets[1].data.shift();
                    lightChart.data.labels.shift();
                }
            });

            temperatureChart.update();
            humidityChart.update();
            pressureChart.update();
            lightChart.update();
        });
}

refreshData();

ws.onmessage = function (event) {
    data = JSON.parse(event.data).data;
    console.log(data);
    // Add new data to charts
    temperatureChart.data.datasets[0].data.push(data.temperature);
    humidityChart.data.datasets[0].data.push(data.humidity);
    pressureChart.data.datasets[0].data.push(data.pressure);
    lightChart.data.datasets[0].data.push(data.white);
    lightChart.data.datasets[1].data.push(data.visible);

    temperatureChart.data.labels.push('');
    humidityChart.data.labels.push('');
    pressureChart.data.labels.push('');
    lightChart.data.labels.push('');

    if (temperatureChart.data.datasets[0].data.length > NUMBER_OF_MEASUREMENTS) {
        temperatureChart.data.datasets[0].data.shift();
        temperatureChart.data.labels.shift();
    }
    if (humidityChart.data.datasets[0].data.length > NUMBER_OF_MEASUREMENTS) {
        humidityChart.data.datasets[0].data.shift();
        humidityChart.data.labels.shift();
    }
    if (pressureChart.data.datasets[0].data.length > NUMBER_OF_MEASUREMENTS) {
        pressureChart.data.datasets[0].data.shift();
        pressureChart.data.labels.shift();
    }
    if (lightChart.data.datasets[0].data.length > NUMBER_OF_MEASUREMENTS) {
        lightChart.data.datasets[0].data.shift();
    }
    if (lightChart.data.datasets[1].data.length > NUMBER_OF_MEASUREMENTS) {
        lightChart.data.datasets[1].data.shift();
        lightChart.data.labels.shift();
    }

    temperatureChart.update();
    humidityChart.update();
    pressureChart.update();
    lightChart.update();
};

