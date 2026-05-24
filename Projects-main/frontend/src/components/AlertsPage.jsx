import React, { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

const SEVERITY = {
  CRITICAL: { bg: "bg-red-900/80",    text: "text-red-200",    border: "border-red-500/40",    icon: "🔴" },
  WARNING:  { bg: "bg-yellow-900/80", text: "text-yellow-200", border: "border-yellow-500/40", icon: "🟡" },
  INFO:     { bg: "bg-blue-900/80",   text: "text-blue-200",   border: "border-blue-500/40",   icon: "🔵" },
};

const TYPE_LABEL = {
  RPM:         { label: "RPM",         unit: "RPM",   color: "text-amber-400" },
  TEMPERATURE: { label: "Temperature", unit: "°C",    color: "text-orange-400" },
  VIBRATION:   { label: "Vibration",   unit: "g",     color: "text-red-400" },
  STATUS:      { label: "Status",      unit: "",      color: "text-blue-400" },
};

const AlertRow = ({ alert, index }) => {
  const sev  = SEVERITY[alert.severity?.toUpperCase()]  || SEVERITY.INFO;
  const type = TYPE_LABEL[alert.type?.toUpperCase()]    || { label: alert.type || "Metric", unit: "", color: "text-white" };

  return (
    <div className={`flex flex-wrap justify-between items-start gap-3 px-5 py-4 border-b border-slate-700/60 hover:bg-slate-700/30 transition-colors duration-150 ${index === 0 ? "bg-slate-700/20" : ""}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-base">{sev.icon}</span>
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${sev.bg} ${sev.text}`}>
              {alert.severity || "INFO"}
            </span>
            <span className="text-white font-semibold text-sm">{alert.message}</span>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-mono">
            <span>
              {type.label}:{" "}
              <span className={`font-bold ${type.color}`}>
                {Number(alert.triggerValue ?? alert.value ?? 0).toFixed(3)}{type.unit && ` ${type.unit}`}
              </span>
            </span>
            <span>
              Device: <span className="text-slate-300">{alert.deviceId || "—"}</span>
            </span>
          </div>
        </div>
      </div>
      <div className="text-right text-xs text-slate-500 font-mono shrink-0">
        {alert.timestamp ? new Date(alert.timestamp).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour12: false,
          year: "numeric", month: "short", day: "numeric",
          hour: "2-digit", minute: "2-digit", second: "2-digit",
        }) : "—"}
      </div>
    </div>
  );
};

export default function AlertsPage() {
  const { motorData } = useOutletContext();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const ALERTS_API = "https://zi4lvdvil2.execute-api.ap-south-1.amazonaws.com/alerts";

  const parseAlerts = (data) => {
    let arr = null;
    if (Array.isArray(data))              arr = data;
    else if (Array.isArray(data?.alerts)) arr = data.alerts;
    else if (Array.isArray(data?.items))  arr = data.items;
    else if (typeof data?.body === "string") {
      try { arr = JSON.parse(data.body); } catch {}
    }
    return arr || [];
  };

  const handleFetchAlerts = async () => {
    try {
      const res  = await fetch(ALERTS_API, { cache: "no-store" });
      const data = await res.json();
      const arr = parseAlerts(data);
      setAlerts(arr.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    } catch (err) {
      console.error("Alerts fallback api query mismatch:", err);
    } finally {
      setLoading(false);
    }
  };

  // 📡 DYNAMIC LIVE INTERCEPTION LOOKUP HOOK
  useEffect(() => {
    if (!motorData) return;

    const vibration = Number(motorData.vibration) || 0;
    const statusStr = String(motorData.status || motorData.statusLabel || "").toLowerCase();
    
    // Fallback normalization validation check
    const isFault = statusStr === "critical" || statusStr === "warning" || vibration >= 0.5;
    if (!isFault) return;

    setAlerts((prev) => {
      const syntheticAlert = {
        alertid: motorData.readingId || `alert-${Date.now()}-${Math.random()}`,
        deviceId: motorData.deviceId || "predictive_maintenance_ESP32",
        severity: (statusStr === "critical" || vibration >= 1.0) ? "CRITICAL" : "WARNING",
        type: "VIBRATION",
        message: `Vibration threshold breach: ${vibration.toFixed(3)} g recorded`,
        triggerValue: vibration,
        timestamp: motorData.timestamp || new Date().toISOString()
      };

      // Deduplicate overlapping transactions bounds
      const exists = prev.some((a) => a.alertid === syntheticAlert.alertid || 
        (Math.abs(new Date(a.timestamp).getTime() - new Date(syntheticAlert.timestamp).getTime()) < 1000 && 
         a.triggerValue === syntheticAlert.triggerValue)
      );
      
      if (exists) return prev;
      return [syntheticAlert, ...prev];
    });
  }, [motorData]);

  useEffect(() => {
    handleFetchAlerts();
    const interval = setInterval(handleFetchAlerts, 4000);
    return () => clearInterval(interval);
  }, []);

  const severities = ["ALL", "CRITICAL", "WARNING", "INFO"];
  const filtered = filter === "ALL" ? alerts : alerts.filter((a) => a.severity?.toUpperCase() === filter);

  const counts = {
    CRITICAL: alerts.filter((a) => a.severity?.toUpperCase() === "CRITICAL").length,
    WARNING:  alerts.filter((a) => a.severity?.toUpperCase() === "WARNING").length,
    INFO:     alerts.filter((a) => a.severity?.toUpperCase() === "INFO").length,
  };

  return (
    <div className="p-6 min-h-screen bg-slate-900 text-white space-y-6">
      
      {/* ── Header UI ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Alerts Log</h1>
          <p className="text-slate-400 text-sm mt-0.5">Live feed · every alert occurrence logged with trigger value</p>
        </div>

        <div className="flex gap-3 text-sm font-semibold">
          <span className="px-3 py-1.5 rounded-full bg-red-900/50 text-red-300 border border-red-500/30">{counts.CRITICAL} Critical</span>
          <span className="px-3 py-1.5 rounded-full bg-yellow-900/50 text-yellow-300 border border-yellow-500/30">{counts.WARNING} Warning</span>
          <span className="px-3 py-1.5 rounded-full bg-blue-900/50 text-blue-300 border border-blue-500/30">{counts.INFO} Info</span>
        </div>
      </div>

      {/* ── Filter Bars ──────────────────────────────────────────────────── */}
      <div className="flex gap-2">
        {severities.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold border transition-all ${
              filter === s ? "bg-slate-600 border-slate-400 text-white" : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500"
            }`}
          >
            {s}
          </button>
        ))}
        <button
          onClick={handleFetchAlerts}
          className="ml-auto px-4 py-1.5 rounded-lg text-sm font-semibold bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition-all"
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── Table Grid Row ───────────────────────────────────────────────── */}
      <div className="bg-slate-800/60 backdrop-blur rounded-xl border border-slate-700/60 overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center h-48 gap-3 text-slate-500">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Querying cloud systems…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2 text-slate-500">
            <span className="text-3xl">✅</span>
            <p className="text-sm italic">No alerts logged{filter !== "ALL" ? ` matching severity ${filter}` : ""}</p>
          </div>
        ) : (
          <div>
            <div className="px-5 py-3 border-b border-slate-700/60 text-xs text-slate-500 font-mono">
              Showing {filtered.length} alert{filtered.length !== 1 ? "s" : ""} {filter !== "ALL" && ` · filtered by ${filter}`}
            </div>
            {filtered.map((alert, i) => (
              <AlertRow key={alert.alertid || i} alert={alert} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}