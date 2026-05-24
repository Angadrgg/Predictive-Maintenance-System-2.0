// src/App.jsx

import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [motorData, setMotorData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let socket = null;
    let reconnectTimer = null;
    let manuallyClosed = false;

    const connectWebSocket = () => {
      const WEBSOCKET_URL =
        "wss://kmnj3q42ra.execute-api.ap-south-1.amazonaws.com/production";

      console.log("Connecting to AWS WebSocket...");
      socket = new WebSocket(WEBSOCKET_URL);

      socket.onopen = () => {
        console.log("✅ AWS WebSocket Connected!");
        setIsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("📩 Live Data Received:", data);
          setMotorData(data);
        } catch (err) {
          console.error("❌ Parse Error:", err);
        }
      };

      socket.onerror = () => {
        // Ignore transient dev reconnect errors
      };

      socket.onclose = () => {
        setIsConnected(false);

        if (manuallyClosed) {
          console.log("WebSocket closed intentionally.");
          return;
        }

        console.log("⚠️ Connection lost. Reconnecting in 3s...");
        reconnectTimer = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };
    };

    connectWebSocket();

    return () => {
      manuallyClosed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket) socket.close();
    };
  }, []);

  return (
    <div className="dark font-sans">
      <div className="bg-dark-bg text-dark-text flex min-h-screen">
        <Sidebar
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <div
          className={`flex-1 transition-all duration-300 ${
            isSidebarOpen ? "ml-64" : "ml-20"
          }`}
        >
          <Outlet context={{ motorData, isConnected }} />
        </div>
      </div>
    </div>
  );
}

export default App;
