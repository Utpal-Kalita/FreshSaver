"use client";

import { useMemo, useState, type FC } from "react";
import { z } from "zod";
import consumersData from "@/data/consumers.json";

interface Consumer {
  id: string;
  name: string;
  email: string;
  subscribed: boolean;
  preferredCategories: string[];
}

const consumers = consumersData as Consumer[];

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
  category: z
    .string()
    .optional()
    .describe("Product category to match relevant consumers (e.g. Dairy, Bakery, Snacks, Ready Mix)"),
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
  category,
}) => {
  const [discount, setDiscount] = useState(30);
  const [showEmailPanel, setShowEmailPanel] = useState(false);
  const [selectedConsumers, setSelectedConsumers] = useState<Set<string>>(new Set());
  const [emailsSent, setEmailsSent] = useState(false);

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

  // Filter consumers: subscribed + matching category (if provided)
  const relevantConsumers = useMemo(() => {
    return consumers.filter((c) => {
      if (!c.subscribed) return false;
      if (category && c.preferredCategories.length > 0) {
        return c.preferredCategories.some(
          (pref) => pref.toLowerCase() === category.toLowerCase()
        );
      }
      return true;
    });
  }, [category]);

  const toggleConsumer = (id: string) => {
    setSelectedConsumers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedConsumers(new Set(relevantConsumers.map((c) => c.id)));
  };

  const deselectAll = () => {
    setSelectedConsumers(new Set());
  };

  const sendEmails = () => {
    // Simulate sending emails
    setEmailsSent(true);
    setTimeout(() => setEmailsSent(false), 3000);
  };

  const selectedList = relevantConsumers.filter((c) => selectedConsumers.has(c.id));

  return (
    <div className="w-full max-w-xl rounded-xl border border-emerald-500 bg-emerald-50/80 p-6 shadow-sm">
      <h2 className="text-2xl font-semibold text-emerald-900">
        {productName}
      </h2>
      <p className="mt-1 text-sm text-emerald-800/90">
        Current price {formatCurrency(currentPrice)} · Stock {stock}
        {category && <span> · {category}</span>}
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

      {/* Email Notification Button */}
      <button
        type="button"
        onClick={() => setShowEmailPanel(!showEmailPanel)}
        className="mt-6 w-full rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
      >
        {showEmailPanel ? "Hide Email Panel" : `Notify Consumers via Email (${relevantConsumers.length} matched)`}
      </button>

      {/* Email Selection Panel */}
      {showEmailPanel && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-white p-4 shadow-inner">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-emerald-900">
              Select consumers to notify
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAll}
                className="rounded px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="rounded px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
              >
                Deselect all
              </button>
            </div>
          </div>

          {relevantConsumers.length === 0 ? (
            <p className="py-4 text-center text-sm text-emerald-700/70">
              No subscribed consumers found{category ? ` for "${category}"` : ""}.
            </p>
          ) : (
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {relevantConsumers.map((consumer) => (
                <label
                  key={consumer.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-emerald-100 p-2 hover:bg-emerald-50"
                >
                  <input
                    type="checkbox"
                    checked={selectedConsumers.has(consumer.id)}
                    onChange={() => toggleConsumer(consumer.id)}
                    className="h-4 w-4 rounded accent-emerald-600"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-emerald-900">{consumer.name}</p>
                    <p className="text-xs text-emerald-700/70">{consumer.email}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {consumer.preferredCategories.map((cat) => (
                      <span
                        key={cat}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          cat.toLowerCase() === category?.toLowerCase()
                            ? "bg-emerald-200 text-emerald-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* Send Email Button */}
          <button
            type="button"
            onClick={sendEmails}
            disabled={selectedConsumers.size === 0 || emailsSent}
            className={`mt-4 w-full rounded-lg px-5 py-2 text-sm font-semibold shadow focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 ${
              emailsSent
                ? "bg-emerald-400 text-white"
                : selectedConsumers.size === 0
                  ? "cursor-not-allowed bg-gray-300 text-gray-500"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
            }`}
          >
            {emailsSent
              ? `✓ Emails sent to ${selectedList.length} consumer${selectedList.length !== 1 ? "s" : ""}!`
              : `Send Flash Sale Email to ${selectedConsumers.size} consumer${selectedConsumers.size !== 1 ? "s" : ""}`}
          </button>

          {/* Preview */}
          {selectedConsumers.size > 0 && !emailsSent && (
            <div className="mt-3 rounded-md border border-dashed border-emerald-300 bg-emerald-50/50 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-emerald-700/80">
                Email Preview
              </p>
              <p className="text-xs text-emerald-800">
                <strong>Subject:</strong> Flash Sale! {productName} at {formatCurrency(newPrice)} ({discount}% off)
              </p>
              <p className="mt-1 text-xs text-emerald-700/80">
                Hi [Name], great news! We have a limited flash sale on {productName}. 
                Get it at {formatCurrency(newPrice)} (was {formatCurrency(currentPrice)}). 
                Only {stock} units available. Hurry!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

FlashSaleBuilder.propsSchema = flashSaleBuilderSchema;
