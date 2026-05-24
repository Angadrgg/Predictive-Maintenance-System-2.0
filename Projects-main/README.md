# 🔧 Predictive Maintenance IoT System

A complete predictive maintenance platform using **ESP32**, **LoRa**, and **AI** for monitoring industrial machines.

---

## 📦 Project Overview
This project detects early signs of machine failure by analyzing vibration (MPU6050) and temperature (DS18B20) data. 
The ESP32 sends sensor data through LoRa to a base station, which uploads it to a web app for real-time monitoring and predictive analytics.

---

## ⚙️ Features
- 📶 LoRa communication for long-range wireless data
- 📊 Real-time dashboard using React + Node
- 🤖 AI-based remaining life prediction model
- 🔔 Blynk notifications for anomalies
- ⚡ Battery-powered IoT node with TP4056 + 18650 cell

---

## 🧠 Tech Stack
| Layer | Tools Used |
|-------|-------------|
| Hardware | ESP32-WROOM-32, SX1278, MPU6050, DS18B20 |
| Software | Arduino IDE, Python, TensorFlow |
| Communication | LoRa, Wi-Fi, Blynk |
| Dashboard | React, Node.js, Express, MongoDB |
| Version Control | Git + GitHub |

---

## 📁 Folder Structure
📂 models/ → AI model scripts (Python)
┣ 📂 backend/ → Node.js server
┣ 📂 firmware/ → ESP32 code
┣ 📂 frontend/ → React dashboard
┣ 📂 assets/ → Images, diagrams, demo videos
┣ 📄 LICENSE
┣ 📄 .gitignore
┗ 📄 README.txt
