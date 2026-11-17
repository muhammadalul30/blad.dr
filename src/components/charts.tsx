"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const axis = { fontSize: 11, fill: "var(--muted)" };
const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--line)",
  borderRadius: 6,
  color: "var(--ink)",
  fontSize: 12,
  boxShadow: "none",
};
const itemStyle = { color: "var(--ink)", padding: 0 };
const legendStyle = { fontSize: 12, color: "var(--muted)" };
const margin = { top: 8, right: 8, bottom: 0, left: -18 };

function Frame({ children, label }: { children: React.ReactElement; label: string }) {
  return (
    <div role="img" aria-label={label} className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export type FrequencyPoint = { label: string; siang: number; malam: number };

export function FrequencyChart({ data }: { data: FrequencyPoint[] }) {
  return (
    <Frame label="Grafik batang jumlah BAK per hari, dipisah siang dan malam">
      <BarChart data={data} margin={margin}>
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={{ stroke: "var(--line)" }} minTickGap={12} />
        <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} cursor={{ fill: "var(--line)", opacity: 0.35 }} />
        <Legend wrapperStyle={legendStyle} iconType="square" iconSize={9} />
        <Bar dataKey="siang" name="Siang" stackId="bak" fill="var(--accent)" isAnimationActive={false} />
        <Bar dataKey="malam" name="Malam (nokturia)" stackId="bak" fill="var(--chart-2)" isAnimationActive={false} />
      </BarChart>
    </Frame>
  );
}

export type FluidPoint = { label: string; asupan: number; keluar: number };

export function FluidChart({ data, target }: { data: FluidPoint[]; target: number }) {
  return (
    <Frame label="Grafik batang asupan cairan dan volume urin per hari dalam mililiter">
      <BarChart data={data} margin={{ ...margin, left: -4 }} barGap={1}>
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={{ stroke: "var(--line)" }} minTickGap={12} />
        <YAxis tick={axis} tickLine={false} axisLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={tooltipStyle}
          itemStyle={itemStyle}
          cursor={{ fill: "var(--line)", opacity: 0.35 }}
          formatter={(value) => `${value} ml`}
        />
        <Legend wrapperStyle={legendStyle} iconType="square" iconSize={9} />
        <ReferenceLine
          y={target}
          stroke="var(--muted)"
          strokeDasharray="4 3"
        />
        <Bar dataKey="asupan" name="Asupan" fill="var(--accent)" isAnimationActive={false} />
        <Bar dataKey="keluar" name="Urin terukur" fill="var(--chart-2)" isAnimationActive={false} />
      </BarChart>
    </Frame>
  );
}

export type IpssPoint = { label: string; total: number; qol: number };

export function IpssChart({ data }: { data: IpssPoint[] }) {
  return (
    <Frame label="Grafik garis skor total IPSS dari waktu ke waktu">
      <LineChart data={data} margin={margin}>
        <CartesianGrid vertical={false} stroke="var(--line)" />
        <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={{ stroke: "var(--line)" }} minTickGap={12} />
        <YAxis tick={axis} tickLine={false} axisLine={false} domain={[0, 35]} ticks={[0, 7, 19, 35]} />
        <Tooltip contentStyle={tooltipStyle} itemStyle={itemStyle} />
        <ReferenceLine y={7} stroke="var(--muted)" strokeDasharray="4 3" />
        <ReferenceLine y={19} stroke="var(--muted)" strokeDasharray="4 3" />
        <Line
          dataKey="total"
          name="Skor IPSS"
          stroke="var(--accent)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--accent)" }}
          isAnimationActive={false}
        />
      </LineChart>
    </Frame>
  );
}
