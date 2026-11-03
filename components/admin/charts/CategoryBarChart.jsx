"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "#831843",
  "#be185d",
  "#db2777",
  "#f472b6",
  "#fb7185",
  "#fbbf24",
];

export default function CategoryBarChart({ data }) {
  const chartData = data.map((item) => ({
    name: item.category,
    count: item.count,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 16, left: 8, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#fce7f3"
            horizontal={false}
          />

          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#9d6b82" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />

          <YAxis
            type="category"
            dataKey="name"
            width={92}
            tick={{ fontSize: 11, fill: "#5b2b3d" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) =>
              value.length > 13 ? `${value.slice(0, 13)}…` : value
            }
          />

          <Tooltip
            formatter={(value) => [`${value} products`, "Count"]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #fbcfe8",
              fontSize: 12,
              color: "#831843",
            }}
          />

          <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={16}>
            {chartData.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}