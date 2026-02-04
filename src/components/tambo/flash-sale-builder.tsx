"use client";

import { useMemo, useState, type FC } from "react";
import { z } from "zod";

export const flashSaleBuilderSchema = z.object({
  productName: z.string().describe("Name of the product to promote"),
  currentPrice: z
    .number()
    .nonnegative()
    .describe("Current selling price before discount"),
  stock: z
    .number()
    .int()
    .nonnegative()
    .describe("Available units to include in the flash sale"),
});

type FlashSaleBuilderProps = z.infer<typeof flashSaleBuilderSchema>;

type FlashSaleBuilderComponent = FC<FlashSaleBuilderProps> & {
  propsSchema: typeof flashSaleBuilderSchema;
};

const formatCurrency = (value: number) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `₹${safeValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
};

export const FlashSaleBuilder: FlashSaleBuilderComponent = ({
  productName,
  currentPrice,
  stock,
}) => {
  const [discount, setDiscount] = useState(30);

  const newPrice = useMemo(() => {
    const basePrice = Number.isFinite(currentPrice) ? currentPrice : 0;
    const normalizedDiscount = Number.isFinite(discount) ? discount : 0;
    const rawPrice = Math.floor(basePrice * (1 - normalizedDiscount / 100));
    return Number.isFinite(rawPrice) ? Math.max(rawPrice, 0) : 0;
  }, [currentPrice, discount]);

  const recoveredRevenue = useMemo(
    () => {
      const units = Number.isFinite(stock) ? Math.max(stock, 0) : 0;
      return newPrice * units;
    },
    [newPrice, stock],
  );

  const launchSale = () => {
    if (typeof window === "undefined") return;

    const message = `Flash sale on ${productName}! New price: ₹${newPrice}. Available stock: ${stock}.`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full max-w-xl rounded-xl border border-emerald-500 bg-emerald-50/80 p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-emerald-900">
        {productName}
      </h2>
      <p className="mt-1 text-sm text-emerald-800/90">
        Current price {formatCurrency(currentPrice)} · Stock {stock}
      </p>

      <div className="mt-6 rounded-lg border border-emerald-200 bg-white/80 p-5 shadow-inner">
        <div className="flex items-center justify-between text-sm font-medium text-emerald-900">
          <span>Discount</span>
          <span>{discount}%</span>
        </div>
        <input
          type="range"
          min={10}
          max={90}
          step={5}
          value={discount}
          onChange={(event) => setDiscount(Number(event.target.value))}
          className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-emerald-200 accent-emerald-600"
        />
        <div className="mt-2 flex justify-between text-xs font-medium text-emerald-700">
          <span>10%</span>
          <span>90%</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
        <div className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-emerald-700/80">
            New price
          </p>
          <p className="mt-1 text-lg font-semibold text-emerald-900">
            {formatCurrency(newPrice)}
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-emerald-700/80">
            Recovered revenue
          </p>
          <p className="mt-1 text-lg font-semibold text-emerald-900">
            {formatCurrency(recoveredRevenue)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={launchSale}
        className="mt-6 w-full rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
      >
        Launch Flash Sale via WhatsApp
      </button>
    </div>
  );
};

FlashSaleBuilder.propsSchema = flashSaleBuilderSchema;
