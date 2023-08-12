from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import json
import time

app = FastAPI()


class Measurement(BaseModel):
    moisture: float
    temperature: float
    humidity: float
    pressure: float
    white: float
    visible: float

class Limits(BaseModel):
    moisture: list[float] = 0, 100
    temperature: list[float] = 0, 100
    humidity: list[float] = 0, 100
    pressure: list[float]  = 0, 100
    white: list[float] = 0, 100
    visible: list[float] = 0, 100

class Response(BaseModel):
    updateAvailable: bool
    limits: Limits

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
async def post_measurements(measurement: Measurement) -> Response:
    post_data = measurement.model_dump()
    post_data = {"timestamp": time.time(), "data": post_data}

    with open("data.json", "r+") as f:
        data = json.load(f)
        data["history"].append(post_data)
        data["history"] = data["history"][-5000:]
        print(len(data["history"]))
        f.seek(0)
        json.dump(data, f, indent=4)
        f.truncate()

    await manager.broadcast(json.dumps(post_data))
                
    return Response(updateAvailable=True, limits=limits)

@app.get("/api/measurements")
async def get_measurements():
    with open("data.json", "r") as f:
        history = json.load(f).get("history", [])
    # return last 24 measurements
    return history[-48:]


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            input = await websocket.receive_text()
            input = json.loads(input)
            update_limits(input)
            with open("data.json", "r+") as f:
                data = json.load(f)
                data["limits"] = (limits.model_dump())
                f.seek(0)
                json.dump(data, f, indent=4)
                f.truncate()
    except Exception as e:
        print(e)
        manager.disconnect(websocket)

def update_limits(input):
    print(input)
    minmax = 0 if 'Min' in input['name'] else 1
    if 'moisture' in input['name']:
        limits.moisture[minmax] = input['value']
    elif 'temperature' in input['name']:
        limits.temperature[minmax] = input['value']
    elif 'humidity' in input['name']:
        limits.humidity[minmax] = input['value']
    elif 'pressure' in input['name']:
        limits.pressure[minmax] = input['value']
    elif 'white' in input['name']:
        limits.white[minmax] = input['value']
    elif 'visible' in input['name']:
        limits.visible[minmax] = input['value']
    else:
        print("Error: unknown limit")

# Endpoints to add:
# Serve update
# upload update
# get limits

def get_limits() -> Limits:
    with open("data.json", "r") as f:
        data = json.load(f)
    return Limits(moisture=tuple(data["limits"]["moisture"]),
                  temperature=tuple(data["limits"]["temperature"]),
                  humidity=tuple(data["limits"]["humidity"]),
                  pressure=tuple(data["limits"]["pressure"]),
                  white=tuple(data["limits"]["white"]),
                  visible=tuple(data["limits"]["visible"]))

app.mount("/", StaticFiles(directory="static", html=True), name="static")

limits = get_limits()
manager = ConnectionManager()