import serial
import time
import requests
import random # For testing if ESP32 isn't connected yet

# --- CONFIGURATION ---
# 1. Set your ESP32 Port (Check Device Manager on Windows)
SERIAL_PORT = 'COM3' 
BAUD_RATE = 115200 
# 2. The URL of your Node.js Backend
BACKEND_URL = "http://localhost:3000/api/sensors"

print(f"🔌 Connecting to ESP32 on {SERIAL_PORT}...")

try:
    # Attempt to open the Serial connection
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    time.sleep(2) # Give connection a moment to settle
    print("✅ Connected to ESP32!")
except Exception as e:
    print(f"⚠️  Could not connect to ESP32: {e}")
    print("   (Running in MOCK MODE - generating fake data for testing)")
    ser = None

def get_sensor_data():
    """Reads from Serial or generates fake data if no hardware."""
    if ser and ser.in_waiting > 0:
        try:
            line = ser.readline().decode('utf-8').strip()
            if line.isdigit():
                return int(line)
        except:
            return None
    elif ser is None:
        # Mock data for testing without hardware
        time.sleep(1)
        return random.randint(1000, 4000)
    return None

# --- MAIN LOOP ---
while True:
    # 1. Get the raw number
    sensor_value = get_sensor_data()

    if sensor_value is not None:
        print(f"📡 Raw Sensor: {sensor_value}")

        # 2. (Optional) Run your AI Model here
        # prediction = model.predict([[sensor_value]])
        
        # Simple Logic Logic for status
        status = "Normal"
        if sensor_value > 3500:
            status = "Critical"
        elif sensor_value > 2500:
            status = "Warning"

        # 3. Prepare the package (JSON)
        payload = {
            "vibration": sensor_value,  # Mapping raw value to vibration
            "temperature": 45,          # Static temp for now (or add a second sensor!)
            "status": status
        }

        # 4. FEED THE BACKEND (The HTTP POST Request)
        try:
            response = requests.post(BACKEND_URL, json=payload)
            if response.status_code == 200:
                print(f"✅ Fed to Backend: {status}")
            else:
                print(f"❌ Backend Error: {response.status_code}")
        except Exception as e:
            print(f"❌ Could not reach Backend. Is 'node server.js' running?")

    time.sleep(0.1) # Don't flood the CPU