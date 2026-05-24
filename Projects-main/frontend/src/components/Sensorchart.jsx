import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const SensorChart = ({ data }) => {
  // Format the time directly from either an ISO timestamp string or a pre-formatted string
  const formatXAxis = (tickItem) => {
    if (!tickItem) return "";
    try {
      // If it's already a formatted local time string, return it
      if (typeof tickItem === 'string' && tickItem.includes(':')) {
        return tickItem;
      }
      const date = new Date(tickItem);
      return date.toLocaleTimeString('en-IN', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
    } catch (e) {
      return tickItem;
    }
  };

  return (
    <div className="w-full h-full min-h-[320px] bg-slate-950/40 p-2 rounded-xl">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          
          {/* Support both potential key names smoothly */}
          <XAxis 
            dataKey={(obj) => obj.timestamp || obj.time} 
            tickFormatter={formatXAxis} 
            stroke="#64748b" 
            fontSize={11}
            fontFamily="monospace"
            minTickGap={40}
          />
          
          {/* Left Y-Axis for Core Telemetry Signatures (Vibration & Temp) */}
          <YAxis 
            yAxisId="left" 
            stroke="#64748b" 
            fontSize={11} 
            fontFamily="monospace"
            domain={[0, 'auto']}
            allowDataOverflow={false}
          />
          
          {/* Right Y-Axis for Motor Rotational Speed Dynamics */}
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            stroke="#d97706" 
            fontSize={11} 
            fontFamily="monospace"
            domain={[0, 'auto']} 
          />

          <Tooltip 
            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ fontSize: '12px', fontFamily: 'sans-serif' }}
            labelFormatter={(label) => `Time: ${formatXAxis(label)}`}
          />
          <Legend wrapperStyle={{ paddingTop: '15px', fontSize: '12px' }} />
          
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="vibration"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={false}
            name="Vibration (g)"
            isAnimationActive={false}
          />

          <Line
            yAxisId="left"
            type="monotone"
            dataKey="temperature"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            name="Temperature (°C)"
            isAnimationActive={false}
          />

          <Line
            yAxisId="right"
            type="monotone"
            dataKey="rpm"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            name="Motor Speed (RPM)"
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SensorChart;