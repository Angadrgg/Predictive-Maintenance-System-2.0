// --- Imports ---
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
const mqtt = require("mqtt"); 
require("dotenv").config();

const SensorData = require("./models/SensorData");

// --- Create Express app ---
const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(express.json());
app.use(cors());

// --- Test route ---
app.get("/api/data/latest", async (req, res) => {
  try {
    // 1. Fetch the last 20 entries, sorted by NEWEST first
    const data = await SensorData.find()
      .sort({ timestamp: -1 })
      .limit(20);

    // 2. IMPORTANT: Force the browser NOT to cache (Fixes the 304 issue)
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // 3. Send the data (we reverse it so the graph draws left-to-right)
    res.json(data.reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- MongoDB connection ---
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/predictive_maintenance")
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// ---------------------------------------------------------------------------
// ✅ NEW: MQTT BROKER CONNECTION
// ---------------------------------------------------------------------------
const mqttClient = mqtt.connect("mqtt://broker.hivemq.com:1883");
const MQTT_TOPIC = "college/industrial/motor1/data";

mqttClient.on("connect", () => {
  console.log("✅ Connected to MQTT Broker (HiveMQ)");
  mqttClient.subscribe(MQTT_TOPIC, (err) => {
    if (!err) {
      console.log(`📡 Listening for ESP32 data on topic: ${MQTT_TOPIC}`);
    }
  });
});

// ---------------------------------------------------------------------------
// ✅ NEW: HANDLE INCOMING ESP32 DATA (Replaces POST route)
// ---------------------------------------------------------------------------
mqttClient.on("message", async (topic, message) => {
  try {
    // 1. Parse the JSON from the ESP32
    const payload = JSON.parse(message.toString());
    console.log(`📩 New data on ${topic}:`, payload);

    const { deviceId, temperature, vibration, rpm } = payload;

    // 2. Input validation
    if (!deviceId || temperature == null || vibration == null) {
      console.error("❌ Missing required fields in MQTT payload");
      return;
    }

    // 3. Save to MongoDB
    // Note: Ensure 'rpm' is added to your SensorData.js mongoose schema!
    const data = new SensorData({ deviceId, temperature, vibration, rpm });
    await data.save();

    // 4. Send to AI model container for prediction
    const aiResponse = await axios.post("http://localhost:8000/predict", {
      temperature,
      vibration
    });

    console.log("🤖 AI Predicted Remaining Life:", aiResponse.data.predicted_remaining_life);

  } catch (err) {
    console.error("❌ Error processing MQTT message:", err.message);
  }
});

// --- Fetch latest data route (React uses this to load historical graphs on refresh) ---
app.get("/api/data/latest", async (req, res) => {
  try {
    const latestData = await SensorData.find().sort({ timestamp: -1 }).limit(20);
    res.json(latestData.reverse()); // reverse for chronological order
  } catch (err) {
    console.error("❌ Error fetching data:", err.message);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// --- Start server ---
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));