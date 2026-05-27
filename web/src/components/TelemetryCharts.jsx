import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function TelemetryCharts({ data }) {
  // If no data, show a placeholder
  if (!data || data.length === 0) {
    return (
      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "300px" }}>
        <p style={{ color: "hsl(var(--text-muted))", fontSize: "0.95rem" }}>Selecciona una comunidad en el mapa para ver su historial de telemetría.</p>
      </div>
    );
  }

  // Custom styling for Tooltip
  const customTooltipStyle = {
    backgroundColor: "rgba(15, 23, 42, 0.95)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "12px",
    padding: "0.75rem 1rem",
    boxShadow: "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
      <h3 style={{ fontFamily: "var(--font-title)", fontSize: "1.25rem", color: "hsl(var(--text-main))", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span className="pulse-indicator"></span> Historial de Telemetría (Últimas 20 mediciones)
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
        
        {/* Chart 1: TDS (ppm) */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h4 style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sólidos Disueltos Totales</h4>
            <span style={{ color: "hsl(var(--primary))", fontFamily: "var(--font-title)", fontWeight: 700, fontSize: "1.1rem" }}>
              {data[data.length - 1]?.tds.toFixed(1)} ppm
            </span>
          </div>
          <div style={{ width: "100%", height: "200px" }}>
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTds" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="timestamp" stroke="hsl(var(--text-dark))" fontSize={9} tickLine={false} />
                <YAxis stroke="hsl(var(--text-dark))" fontSize={9} tickLine={false} domain={[0, 'auto']} />
                <Tooltip 
                  contentStyle={customTooltipStyle} 
                  labelStyle={{ color: "hsl(var(--text-muted))", fontSize: "0.8rem", marginBottom: "0.25rem" }}
                  itemStyle={{ color: "hsl(var(--primary))", fontSize: "0.9rem", fontWeight: "bold" }}
                />
                <Area type="monotone" dataKey="tds" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTds)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Turbidity (NTU) */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h4 style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Turbidez del Agua</h4>
            <span style={{ color: "hsl(var(--warning))", fontFamily: "var(--font-title)", fontWeight: 700, fontSize: "1.1rem" }}>
              {data[data.length - 1]?.turbidity.toFixed(2)} NTU
            </span>
          </div>
          <div style={{ width: "100%", height: "200px" }}>
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTurb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="timestamp" stroke="hsl(var(--text-dark))" fontSize={9} tickLine={false} />
                <YAxis stroke="hsl(var(--text-dark))" fontSize={9} tickLine={false} domain={[0, 'auto']} />
                <Tooltip 
                  contentStyle={customTooltipStyle}
                  labelStyle={{ color: "hsl(var(--text-muted))", fontSize: "0.8rem", marginBottom: "0.25rem" }}
                  itemStyle={{ color: "hsl(var(--warning))", fontSize: "0.9rem", fontWeight: "bold" }}
                />
                <Area type="monotone" dataKey="turbidity" stroke="hsl(var(--warning))" fillOpacity={1} fill="url(#colorTurb)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Water Level (%) */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h4 style={{ color: "hsl(var(--text-muted))", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Nivel de Llenado del Tanque</h4>
            <span style={{ color: "hsl(var(--success))", fontFamily: "var(--font-title)", fontWeight: 700, fontSize: "1.1rem" }}>
              {data[data.length - 1]?.level.toFixed(1)}%
            </span>
          </div>
          <div style={{ width: "100%", height: "200px" }}>
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="timestamp" stroke="hsl(var(--text-dark))" fontSize={9} tickLine={false} />
                <YAxis stroke="hsl(var(--text-dark))" fontSize={9} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={customTooltipStyle}
                  labelStyle={{ color: "hsl(var(--text-muted))", fontSize: "0.8rem", marginBottom: "0.25rem" }}
                  itemStyle={{ color: "hsl(var(--success))", fontSize: "0.9rem", fontWeight: "bold" }}
                />
                <Area type="monotone" dataKey="level" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorLevel)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
