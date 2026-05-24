from flask import Flask, request, jsonify
import math

app = Flask(__name__)

@app.route('/')
def home():
    return jsonify({"message": "AI Model API is running!"})

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        temperature = float(data.get("temperature", 0))
        vibration = float(data.get("vibration", 0))

        # --- Simulated AI logic ---
        # Example: simple remaining life estimation
        # Replace this with a trained ML model later.
        remaining_life = max(0, 100 - (temperature * 0.8 + vibration * 5))

        print(f"📡 Received data → Temperature: {temperature}, Vibration: {vibration}")
        print(f"🤖 Predicted Remaining Life: {remaining_life:.2f}%")

        return jsonify({
            "predicted_remaining_life": round(remaining_life, 2)
        })
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("✅ AI Model server started and awaiting sensor data...")
    app.run(host="0.0.0.0", port=8000)
