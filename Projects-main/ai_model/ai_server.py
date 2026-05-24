from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class SensorData(BaseModel):
    temperature: float
    vibration: float

@app.post("/predict")
def predict(data: SensorData):
    # --- YOUR AI LOGIC HERE ---
    print(f"AI Received: Temp={data.temperature}, Vib={data.vibration}")
    
    # Mock Calculation for now
    remaining_life = 100
    if data.vibration > 100:
        remaining_life = 10
    elif data.vibration > 50:
        remaining_life = 45
        
    return {"predicted_remaining_life": remaining_life}