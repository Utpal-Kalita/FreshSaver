"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTamboStreamStatus } from "@tambo-ai/react";
import { z } from "zod";
import { resolveInventoryItem } from "@/services/inventory";

export const wasteRiskAnalyzerSchema = z.object({
  itemName: z.string().describe("Display name for the at-risk inventory item"),
  sku: z.string().optional().describe("SKU to cross-reference inventory data"),
  quantity: z
    .number()
    .int()
    .positive()
    .describe("Units at risk of spoilage")
    .optional(),
  unitPrice: z
    .number()
    .positive()
    .describe("Selling price per unit in rupees")
    .optional(),
  currencySymbol: z
    .string()
    .default("₹")
    .describe("Currency symbol to prepend while rendering amounts"),
  daysUntilExpiry: z
    .number()
    .int()
    .optional()
    .describe("Days remaining before the batch expires"),
  location: z
    .string()
    .optional()
    .describe("Shelf or storage location for quick action"),
  notes: z
    .array(z.string())
    .optional()
    .describe("Short bullet cues urging the manager to act"),
});

export type WasteRiskAnalyzerProps = z.infer<typeof wasteRiskAnalyzerSchema>;

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const formatCurrency = (value: number | string | null | undefined, symbol: string) => {
  const numericValue = toFiniteNumber(value);
  const prefix = symbol ?? "";

  if (numericValue === null) {
    return prefix ? `${prefix}--` : "--";
  }

  const maximumFractionDigits = Number.isInteger(numericValue) ? 0 : 2;

  return `${prefix}${numericValue.toLocaleString("en-IN", {
    maximumFractionDigits,
  })}`;
};

const tooltipFormatter =
  (symbol: string, hasValue: boolean) =>
  (value: number | string | null | undefined) =>
    formatCurrency(hasValue ? value : null, symbol);

export function WasteRiskAnalyzer(props: WasteRiskAnalyzerProps) {
  const { streamStatus, propStatus } = useTamboStreamStatus<WasteRiskAnalyzerProps>();
  const {
    itemName,
    sku,
    quantity,
    unitPrice,
    currencySymbol = "₹",
    daysUntilExpiry,
    location,
    notes = [],
  } = props;

  const inventoryMatch = useMemo(
    () => resolveInventoryItem(sku ?? itemName),
    [itemName, sku],
  );

  const resolvedCurrencySymbol = currencySymbol || "₹";
  const numericQuantity = toFiniteNumber(quantity);
  const numericUnitPrice = toFiniteNumber(unitPrice);
  const inferredQuantity = numericQuantity ?? toFiniteNumber(inventoryMatch?.quantityAtRisk);
  const inferredUnitPrice = numericUnitPrice ?? toFiniteNumber(inventoryMatch?.unitPrice);
  const inferredDaysUntilExpiry =
    typeof daysUntilExpiry === "number" ? daysUntilExpiry : inventoryMatch?.daysUntilExpiry;
  const inferredLocation = location ?? inventoryMatch?.location;

  const totalLossValue = useMemo(() => {
    if (inferredQuantity === null || inferredUnitPrice === null) {
      return null;
    }

    return inferredQuantity * inferredUnitPrice;
  }, [inferredQuantity, inferredUnitPrice]);
  const totalLoss = totalLossValue ?? 0;
  const perUnitLoss = inferredUnitPrice;

  const chartData = useMemo(
    () => [{ label: "Loss if wasted", value: totalLoss }],
    [totalLoss],
  );

  const quantityDisplay = inferredQuantity ?? "--";
  const hasLossEstimate = totalLossValue !== null;
  const xAxisMax = totalLoss > 0 ? totalLoss * 1.1 : Math.max(perUnitLoss ?? 0, 1);

  if (streamStatus.isPending) {
    return (
      <div className="w-full max-w-xl rounded-lg border border-border bg-card p-6">
        <div className="h-48 animate-pulse rounded-md bg-muted" />
        <div className="mt-6 h-4 w-3/4 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl rounded-lg border border-destructive/40 bg-destructive/5 p-6 backdrop-blur-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-destructive">Waste risk</p>
          <h2 className="text-xl font-semibold text-destructive">
            {itemName}
          </h2>
        </div>
        <div className="flex gap-6 text-sm text-destructive">
          <div>
            <p className="text-xs text-destructive/70">Units at risk</p>
            <p className="font-semibold">{quantityDisplay}</p>
          </div>
          <div>
            <p className="text-xs text-destructive/70">Per unit value</p>
            <p className="font-semibold">{formatCurrency(perUnitLoss, resolvedCurrencySymbol)}</p>
          </div>
          {typeof inferredDaysUntilExpiry === "number" && (
            <div>
              <p className="text-xs text-destructive/70">Expires in</p>
              <p className="font-semibold">{inferredDaysUntilExpiry} days</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 h-52 w-full rounded-md border border-destructive/30 bg-card shadow-inner">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: 32, right: 24, top: 16, bottom: 16 }}>
            <CartesianGrid horizontal={false} stroke="rgba(220,38,38,0.2)" />
            <XAxis type="number" hide domain={[0, xAxisMax]} />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fill: "rgb(127,29,29)", fontSize: 12, fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(248,113,113,0.12)" }}
              formatter={tooltipFormatter(resolvedCurrencySymbol, hasLossEstimate)}
              contentStyle={{
                background: "var(--card)",
                borderRadius: 12,
                border: "1px solid rgba(248,113,113,0.4)",
                color: "var(--foreground)",
              }}
            />
            <Bar dataKey="value" radius={[0, 12, 12, 0]} fill="rgba(220,38,38,0.85)">
              <LabelList
                position="right"
                fill="rgb(127,29,29)"
                fontWeight={600}
                formatter={(value) =>
                  formatCurrency(hasLossEstimate ? value : null, resolvedCurrencySymbol)
                }
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex flex-wrap gap-6 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-destructive/70">Total loss if ignored</p>
          <p className="text-lg font-semibold text-destructive">
            {formatCurrency(totalLossValue, resolvedCurrencySymbol)}
          </p>
        </div>
        {inferredLocation && (
          <div>
            <p className="text-xs uppercase tracking-wide text-destructive/70">Where to check</p>
            <p className="font-medium text-foreground/90">{inferredLocation}</p>
          </div>
        )}
      </div>

      {notes.length > 0 && (
        <ul className="mt-6 list-disc space-y-2 border-t border-destructive/20 pt-4 text-sm text-foreground/90">
          {notes.map((note, index) => (
            <li
              key={`${note}-${index}`}
              className={propStatus.notes?.isStreaming ? "animate-pulse" : undefined}
            >
              {note}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
