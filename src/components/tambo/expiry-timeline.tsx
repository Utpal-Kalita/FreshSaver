"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTamboStreamStatus } from "@tambo-ai/react";
import { z } from "zod";

export const expiryTimelineSchema = z.object({
  title: z
    .string()
    .default("Items expiring soon")
    .describe("Headline for the expiry timeline card"),
  items: z
    .array(
      z.object({
        name: z.string().describe("Name of the inventory item"),
        daysUntilExpiry: z
          .number()
          .int()
          .describe("Number of days until the item expires"),
        quantity: z.number().int().describe("Units at risk"),
        unitPrice: z.number().describe("Price per unit"),
        category: z.string().optional().describe("Item category"),
        location: z.string().optional().describe("Storage location"),
      }),
    )
    .default([])
    .describe("List of items with their expiry information"),
  currencySymbol: z
    .string()
    .default("₹")
    .describe("Currency symbol for formatting"),
  summary: z
    .string()
    .optional()
    .describe("Optional summary text shown below the chart"),
});

export type ExpiryTimelineProps = z.infer<typeof expiryTimelineSchema>;

const urgencyColor = (days: number): string => {
  if (days <= 3) return "rgb(220, 38, 38)";      // red
  if (days <= 7) return "rgb(234, 88, 12)";       // orange
  if (days <= 14) return "rgb(202, 138, 4)";      // amber
  if (days <= 30) return "rgb(22, 163, 74)";      // green
  return "rgb(100, 116, 139)";                      // slate
};

const urgencyLabel = (days: number): string => {
  if (days <= 0) return "EXPIRED";
  if (days === 1) return "Tomorrow";
  if (days <= 3) return `${days} days — URGENT`;
  if (days <= 7) return `${days} days`;
  return `${days} days`;
};

export function ExpiryTimeline(props: ExpiryTimelineProps) {
  const { streamStatus, propStatus } =
    useTamboStreamStatus<ExpiryTimelineProps>();
  const { title, items = [], currencySymbol = "₹", summary } = props;

  const sortedItems = useMemo(
    () =>
      [...items].sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry),
    [items],
  );

  const chartData = useMemo(
    () =>
      sortedItems.map((item) => ({
        name: item.name.length > 22 ? item.name.slice(0, 20) + "…" : item.name,
        fullName: item.name,
        days: item.daysUntilExpiry,
        quantity: item.quantity,
        loss: item.quantity * item.unitPrice,
        unitPrice: item.unitPrice,
        category: item.category,
        location: item.location,
      })),
    [sortedItems],
  );

  const totalAtRisk = useMemo(
    () => chartData.reduce((sum, d) => sum + d.loss, 0),
    [chartData],
  );

  const maxDays = useMemo(
    () => Math.max(...chartData.map((d) => d.days), 1) * 1.15,
    [chartData],
  );

  if (streamStatus.isPending) {
    return (
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card p-6">
        <div className="h-5 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 h-64 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="w-full max-w-2xl rounded-lg border border-green-200 bg-green-50/60 p-6 text-center">
        <p className="text-lg font-semibold text-green-800">
          No items expiring soon
        </p>
        <p className="mt-1 text-sm text-green-700/80">
          All inventory looks good!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl rounded-xl border border-orange-200/70 bg-orange-50/50 p-6 shadow-sm">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
          Expiry Timeline
        </p>
        <h2
          className={`text-xl font-semibold text-orange-900 ${
            propStatus.title?.isStreaming ? "animate-pulse" : ""
          }`}
        >
          {title}
        </h2>
      </div>

      {/* Summary stats */}
      <div className="mt-4 flex flex-wrap gap-6 text-sm">
        <div>
          <p className="text-xs text-orange-700/70">Items expiring</p>
          <p className="text-lg font-semibold text-orange-900">
            {items.length}
          </p>
        </div>
        <div>
          <p className="text-xs text-orange-700/70">Total value at risk</p>
          <p className="text-lg font-semibold text-destructive">
            {currencySymbol}
            {totalAtRisk.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-6 w-full rounded-md border border-orange-200/50 bg-white/80 p-2 shadow-inner"
           style={{ height: Math.max(200, chartData.length * 52 + 40) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ left: 8, right: 60, top: 12, bottom: 12 }}
          >
            <CartesianGrid horizontal={false} stroke="rgba(234,88,12,0.15)" />
            <XAxis
              type="number"
              domain={[0, maxDays]}
              tick={{ fill: "rgb(154,52,18)", fontSize: 11 }}
              label={{
                value: "Days until expiry",
                position: "insideBottom",
                offset: -4,
                fill: "rgb(154,52,18)",
                fontSize: 11,
              }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fill: "rgb(124,45,18)", fontSize: 12, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(251,146,60,0.1)" }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              content={({ active, payload }: any) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload;
                return (
                  <div className="rounded-lg border border-orange-200 bg-white p-3 text-sm shadow-lg">
                    <p className="font-semibold text-orange-900">{d.fullName}</p>
                    {d.category && (
                      <p className="text-xs text-orange-700">{d.category}</p>
                    )}
                    <div className="mt-2 space-y-1 text-orange-800">
                      <p>Expires in: <strong>{urgencyLabel(d.days)}</strong></p>
                      <p>Quantity: <strong>{d.quantity} units</strong></p>
                      <p>
                        Potential loss:{" "}
                        <strong className="text-destructive">
                          {currencySymbol}{d.loss.toLocaleString("en-IN")}
                        </strong>
                      </p>
                      {d.location && <p className="text-xs">📍 {d.location}</p>}
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="days" radius={[0, 8, 8, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={urgencyColor(entry.days)} />
              ))}
              <LabelList
                dataKey="days"
                position="right"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => urgencyLabel(Number(value))}
                fill="rgb(124,45,18)"
                fontWeight={600}
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Item detail cards */}
      <div className="mt-4 space-y-2">
        {sortedItems.map((item, i) => (
          <div
            key={`${item.name}-${i}`}
            className="flex items-center justify-between rounded-lg border border-orange-200 bg-white/90 px-4 py-2 text-sm"
          >
            <div className="flex items-center gap-3">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ background: urgencyColor(item.daysUntilExpiry) }}
              />
              <div>
                <span className="font-medium text-orange-900">{item.name}</span>
                {item.location && (
                  <span className="ml-2 text-xs text-orange-600">
                    📍 {item.location}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-orange-700">{item.quantity} units</span>
              <span className="font-semibold text-destructive">
                {currencySymbol}
                {(item.quantity * item.unitPrice).toLocaleString("en-IN")}
              </span>
              <span
                className="rounded-full px-2 py-0.5 font-semibold text-white"
                style={{ background: urgencyColor(item.daysUntilExpiry) }}
              >
                {urgencyLabel(item.daysUntilExpiry)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {summary && (
        <p
          className={`mt-4 text-sm text-orange-800/90 ${
            propStatus.summary?.isStreaming ? "animate-pulse" : ""
          }`}
        >
          {summary}
        </p>
      )}
    </div>
  );
}
