import matplotlib.pyplot as plt
import numpy as np
import json

# Load data
with open("data.json", "r") as f:
    data = json.load(f)
    history = data.get("history", [])
    temperature = np.array([x["data"]["humidity"] for x in history])
    plt.plot(temperature[::360], label="Temperature")
    plt.show()