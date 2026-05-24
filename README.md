Markdown
# Industrial Predictive Maintenance Ecosystem (PdM 2.0)

An end-to-end cyber-physical IoT ecosystem engineered to transform reactive factory maintenance into proactive asset optimization. This system captures physical motor data, transmits it securely over long-range sub-GHz radio links, calculates real-time **Remaining Useful Life (RUL)** prognostics using cloud serverless computing, and streams dynamic indicators directly to a responsive web dashboard over WebSockets.

## 🏗️ Comprehensive Five-Layer Pipeline

[ LAYER 1: SENSING ] ──( LoRa 433MHz )──> [ LAYER 2: WIRELESS LINK ]
│
( AES-128 Cryptography )
▼
[ LAYER 5: REACT UI ] <──( WebSockets )─── [ LAYER 3/4: CLOUD CORE ]


1. **Layer 1 — Sensing Edge Node:** An ESP32 microcontroller paired with an MPU6050 MEMS Inertial Measurement Unit (IMU) and a DHT11 temperature sensor. It samples 3-axis acceleration vectors and computes the Euclidean vector norm on-chip to isolate vibration magnitude ($a = \sqrt{x^2 + y^2 + z^2}$).
2. **Layer 2 — Encrypted Wireless Link:** Telemetry streams are encrypted locally using a hardware-accelerated AES-128 block cipher and transmitted via 433 MHz LoRa radios, ensuring structural penetration through heavy industrial concrete and metal shielding without Wi-Fi reliance.
3. **Layer 3 — Ingestion Gateway:** A secondary field gateway base station decrypts incoming radio frames, runs parity verification, packages the structured variables into unified JSON payloads, and negotiates secure TLS 1.2 MQTT handshakes with AWS IoT Core on port 8883.
4. **Layer 4 — Serverless Cloud Analytical Core:** Ingested payloads invoke an event-driven AWS Lambda engine that logs records to Amazon DynamoDB and parses a rolling window of 50 historical coordinates to compute a Least-Squares Linear Regression line ($vibration(t) = slope \cdot t + intercept$). If a positive wear trend is verified ($slope > 0$), it calculates exactly where the curve intersects the critical terminal baseline safety margin ($1.0\text{ g}$) to project Remaining Useful Life (RUL) windows.
5. **Layer 5 — React Management Dashboard:** A responsive frontend UI (hosted globally on AWS CloudFront) maintains an open WebSocket channel to stream live multi-axis Recharts sparklines, OEE indices, countdown bars, and instant fault ledger updates.

---

## ⚡ Real-Time Fault Classification Matrix

The processing engine maps telemetry vectors down into explicit localized risk labels:

| Vibration Magnitude | Fault Status | System Prediction | Action Performed |
| :--- | :--- | :--- | :--- |
| **Below 0.5 g** | Normal | `STABLE` | Passive data persistence tracking within data lake. |
| **0.5 g – 1.0 g** | Warning | `ELEVATED` | Appends real-time alert record; highlights telemetry card. |
| **Above 1.0 g** | Critical | `HIGH RISK` | Fires dashboard emergency panels; flags breakdown. |

---

## 🚀 Frontend Deployment Setup Guide

### Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v16.x or higher recommended) alongside `npm` or `yarn`.

### 1. Installation
Clone the repository workspace and install the required dependencies:
```bash
git clone [https://github.com/Angadrgg/PdM-System-2.0.git](https://github.com/Angadrgg/PdM-System-2.0.git)
cd PdM-System-2.0
npm install
2. Environment Configuration
Create a .env file within your root project directory to securely route backend WebSocket communication channels:

Code snippet
REACT_APP_WEBSOCKET_URL=wss://[your-api-gateway-endpoint.amazonaws.com/production](https://your-api-gateway-endpoint.amazonaws.com/production)
REACT_APP_ALERTS_API=[https://your-rest-api-endpoint.amazonaws.com/alerts](https://your-rest-api-endpoint.amazonaws.com/alerts)
3. Local Development Build
Launch the interactive local Webpack bundle compiler server:

Bash
npm start
Open your browser and navigate to http://localhost:3000 to inspect the synchronized real-time visualization layout.

⚙️ Technical Repository Stack Mapping
Frontend Layout Architecture: ReactJS, TailwindCSS, Recharts engine hooks, React Router Dom outlet structures.

Database Ledger Infrastructure: Amazon DynamoDB time-series logs (MotorReadings, MotorAlerts, MotorConnection).

Edge Firmware Layer: C++, FreeRTOS, RadioHead SPI LoRa bindings, hardware-accelerated cryptographic blocks.
