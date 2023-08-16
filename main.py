import json
import time

from fastapi import FastAPI, WebSocket, File, UploadFile, Form, status, Request
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Constants
HISTORY_SIZE = 50000
HISTORY_STEP = 360
LAST_24_MEASUREMENTS = 48
DATA_FILE = "data.json"
CONFIG_KEY = "config"
NEWEST_FIRMWARE_KEY = "newest_firmware"
FIRMWARE_FOLDER = "firmware"
STATIC_FOLDER = "static"


app = FastAPI()

# Data Models
class Measurement(BaseModel):
    moisture: float
    temperature: float
    humidity: float
    pressure: float
    white: float
    visible: float


class Limits(BaseModel):
    moisture: list[float] = [0, 100]
    temperature: list[float] = [0, 100]
    humidity: list[float] = [0, 100]
    pressure: list[float] = [0, 100]
    white: list[float] = [0, 100]
    visible: list[float] = [0, 100]


class Response(BaseModel):
    updateAvailable: bool
    limits: Limits


# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)


@app.post("/api/measurements")
async def post_measurements(measurement: Measurement, request: Request) -> Response:
    post_data = {"timestamp": time.time(), "data": measurement.dict()}

    with open(DATA_FILE, "r+") as f:
        data = json.load(f)
        newest_version = data[CONFIG_KEY][NEWEST_FIRMWARE_KEY]
        data["history"].append(post_data)
        data["history"] = data["history"][-HISTORY_SIZE:]
        f.seek(0)
        json.dump(data, f, indent=4)
        f.truncate()

    await manager.broadcast(json.dumps(post_data))

    current_version = request.headers.get("Version")
    return Response(updateAvailable=(current_version != newest_version), limits=limits)


@app.get("/api/measurements")
async def get_measurements():
    with open(DATA_FILE, "r") as f:
        history = json.load(f).get("history", [])
        history = history[::HISTORY_STEP]
    return history[-LAST_24_MEASUREMENTS:]


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            input_data = json.loads(await websocket.receive_text())
            update_limits(input_data)
            with open(DATA_FILE, "r+") as f:
                data = json.load(f)
                data["limits"] = limits.dict()
                f.seek(0)
                json.dump(data, f, indent=4)
                f.truncate()
    except Exception as e:
        print(e)
        manager.disconnect(websocket)


@app.get("/api/firmwareupdate")
async def firmwareupdate():
    with open(DATA_FILE, "r") as f:
        newest_version = json.load(f).get(NEWEST_FIRMWARE_KEY)
    return FileResponse(f"{FIRMWARE_FOLDER}/{newest_version}.bin")


@app.post("/upload_firmware/")
async def upload_firmware(file: UploadFile = File(...), version: str = Form(...)):
    with open(f"{FIRMWARE_FOLDER}/{version}.bin", "wb") as buffer:
        buffer.write(file.file.read())

    with open(DATA_FILE, "r+") as f:
        data = json.load(f)
        data[NEWEST_FIRMWARE_KEY] = version
        f.seek(0)
        json.dump(data, f, indent=4)
        f.truncate()

    return RedirectResponse("/", status_code=status.HTTP_303_SEE_OTHER)


def update_limits(input_data):
    minmax = 0 if 'Min' in input_data['name'] else 1
    if 'moisture' in input_data['name']:
        limits.moisture[minmax] = input_data['value']
    elif 'temperature' in input_data['name']:
        limits.temperature[minmax] = input_data['value']
    elif 'humidity' in input_data['name']:
        limits.humidity[minmax] = input_data['value']
    elif 'pressure' in input_data['name']:
        limits.pressure[minmax] = input_data['value']
    elif 'white' in input_data['name']:
        limits.white[minmax] = input_data['value']
    elif 'visible' in input_data['name']:
        limits.visible[minmax] = input_data['value']
    else:
        print("Error: unknown limit")


def get_limits() -> Limits:
    with open(DATA_FILE, "r") as f:
        data = json.load(f)
    return Limits(
        moisture=tuple(data["limits"]["moisture"]),
        temperature=tuple(data["limits"]["temperature"]),
        humidity=tuple(data["limits"]["humidity"]),
        pressure=tuple(data["limits"]["pressure"]),
        white=tuple(data["limits"]["white"]),
        visible=tuple(data["limits"]["visible"])
    )


app.mount("/", StaticFiles(directory=STATIC_FOLDER, html=True), name="static")

limits = get_limits()
manager = ConnectionManager()
