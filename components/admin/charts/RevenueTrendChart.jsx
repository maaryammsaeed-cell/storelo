"use client";

import { formatPrice, formatPriceShort } from "@/lib/format";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";



export default function RevenueTrendChart({ data , currency = "USD" }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#db2777" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#db2777" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#fce7f3"
            vertical={false}
          />

          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "#9d6b82" }}
            tickLine={false}
            axisLine={{ stroke: "#fbcfe8" }}
            interval="preserveStartEnd"
          />

          <YAxis
            tick={{ fontSize: 11, fill: "#9d6b82" }}
            tickLine={false}
            axisLine={false}
            width={50}
            tickFormatter={(value) => formatPriceShort(value, currency)}          />

          <Tooltip
            formatter={(value) => [formatPrice(value, currency), "Revenue"]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #fbcfe8",
              fontSize: 12,
              color: "#831843",
            }}
            labelStyle={{ color: "#9d6b82", fontSize: 11 }}
          />

          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#db2777"
            strokeWidth={2.5}
            fill="url(#revenueFill)"
            activeDot={{ r: 4, fill: "#831843" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}