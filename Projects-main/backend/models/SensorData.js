const mongoose = require("mongoose");

const SensorDataSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  temperature: { type: Number, required: true },
  vibration: { type: Number, required: true },
  rpm: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("SensorData", SensorDataSchema);