"use client";
import { formatPrice } from "@/lib/format";   // 👈 NAYA

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = [
  "#831843",
  "#be185d",
  "#db2777",
  "#f472b6",
  "#fb7185",
  "#fbbf24",
];



export default function CategoryDonutChart({ data, total , currency = "USD" }) {
  const chartData = data.map((item) => ({
    name: item.category,
    value: Number(item.revenue.toFixed(2)),
  }));

  return (
    <div>
      <div className="relative h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={2}
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>

            <Tooltip
              formatter={(value, name) => [formatPrice(value, currency), name]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #fbcfe8",
                fontSize: 12,
                color: "#831843",
                textTransform: "capitalize",
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-[10px] uppercase tracking-wider text-[#9d6b82]">
            Total
          </p>
          <p className="text-lg font-bold text-[#831843]">
            {formatPrice(total, currency)}
          </p>
        </div>
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {chartData.map((item, index) => (
          <li key={item.name} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: COLORS[index % COLORS.length] }}
            />
            <span className="truncate capitalize text-[#5b2b3d]">
              {item.name}
            </span>
            <span className="ml-auto shrink-0 font-semibold text-[#831843]">
              {formatPrice(item.value, currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}