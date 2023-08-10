from fastapi import FastAPI, WebSocket
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import json
import time

app = FastAPI()


class Measurement(BaseModel):
    temperature: float
    humidity: float
    pressure: float
    white: float
    visible: float

class Response(BaseModel):
    updateAvailable: bool

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


manager = ConnectionManager()



@app.post("/api/measurements")
async def post_measurements(measurement: Measurement) -> Response:
    data = measurement.model_dump()
    data = {"timestamp": time.time(), "data": data}

    with open("history.json", "r+") as f:
        history = json.load(f)
        history.append(data)
        history = history[-5000:]
        print(len(history))
        f.seek(0)
        json.dump(history, f, indent=4)
        f.truncate()

    await manager.broadcast(json.dumps(data))
                
    return {"updateAvailable": False}

@app.get("/api/measurements")
async def get_measurements():
    with open("history.json", "r") as f:
        history = json.load(f)
    # return last 24 measurements
    return history[-48:]


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except:
        manager.disconnect(websocket)


# Endpoints to add:
# - Get latest measurement (Socket)
# Serve update
# upload update
# update limits
# get limits


app.mount("/", StaticFiles(directory="static", html=True), name="static")