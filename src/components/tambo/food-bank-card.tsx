"use client";

import {
  useTamboComponentState,
  useTamboStreamStatus,
} from "@tambo-ai/react";
import { z } from "zod";

export const foodBankCardSchema = z.object({
  title: z
    .string()
    .default("Community donation partners")
    .describe("Headline shown above the charity list"),
  charities: z
    .array(
      z.object({
        name: z.string().describe("Name of the charity or NGO"),
        distanceKm: z
          .number()
          .optional()
          .describe("Approximate distance in kilometres"),
        contactPerson: z
          .string()
          .optional()
          .describe("Primary point of contact"),
        phone: z
          .string()
          .optional()
          .describe("Phone number for quick coordination"),
        pickupWindow: z
          .string()
          .optional()
          .describe("Available pickup schedule"),
        address: z
          .string()
          .optional()
          .describe("Short address or locality details"),
        notes: z
          .string()
          .optional()
          .describe("Any extra instructions for this partner"),
      }),
    )
    .default([
      {
        name: "Delhi FoodBank Network",
        distanceKm: 3.4,
        contactPerson: "Sonal",
        phone: "+91 99102 44556",
        pickupWindow: "Same day pickup till 7pm",
        address: "Okhla Phase II",
        notes: "Needs packed dairy in chilled boxes",
      },
      {
        name: "Robin Hood Army",
        distanceKm: 5.1,
        contactPerson: "Volunteer Desk",
        phone: "+91 93156 20890",
        pickupWindow: "Evening rounds 6-8pm",
        address: "South Extension",
        notes: "Coordinate 30 mins prior for routing",
      },
      {
        name: "Feeding India by Zomato",
        distanceKm: 7.8,
        contactPerson: "Ankit",
        phone: "+91 88005 88221",
        pickupWindow: "Morning collection 9-11am",
        address: "Lajpat Nagar",
        notes: "Prefers sealed dairy packs",
      },
    ])
    .describe("List of donation partners to contact"),
  guidance: z
    .string()
    .optional()
    .describe("Contextual sentence encouraging donation action"),
});

export type FoodBankCardProps = z.infer<typeof foodBankCardSchema>;

const formatDistance = (distanceKm?: number) => {
  if (typeof distanceKm !== "number") return undefined;
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }
  return `${distanceKm.toFixed(1)} km away`;
};

const sanitizePhone = (phone?: string) => {
  if (!phone) return undefined;
  return phone.replace(/\s+/g, "");
};

export function FoodBankCard(props: FoodBankCardProps) {
  const { streamStatus, propStatus } =
    useTamboStreamStatus<FoodBankCardProps>();
  const { title, charities, guidance } = props;
  const [contacted, setContacted] = useTamboComponentState<Record<string, boolean>>(
    "contacted",
    {},
  );

  if (streamStatus.isPending) {
    return (
      <div className="w-full max-w-xl rounded-lg border border-border bg-card p-6">
        <div className="h-5 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-4 space-y-4">
          <div className="h-20 animate-pulse rounded bg-muted" />
          <div className="h-20 animate-pulse rounded bg-muted" />
          <div className="h-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl rounded-xl border border-blue-200/70 bg-blue-50/70 p-6 shadow-sm">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          Donation fallback
        </p>
        <h2 className="text-xl font-semibold text-blue-900">
          {title}
        </h2>
        {guidance && (
          <p
            className={propStatus.guidance?.isStreaming ? "animate-pulse text-sm text-blue-800/90" : "text-sm text-blue-800/90"}
          >
            {guidance}
          </p>
        )}
      </div>

      <div className="mt-6 space-y-4">
        {charities.map((charity, index) => {
          const key = `${charity.name}-${index}`;
          const alreadyContacted = contacted?.[key];
          return (
            <div
              key={key}
              className="rounded-lg border border-blue-200 bg-white/90 p-4 shadow-inner"
            >
              <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">
                    {charity.name}
                  </h3>
                  <div className="text-xs uppercase tracking-wide text-blue-700/80">
                    {formatDistance(charity.distanceKm) ?? "Distance on request"}
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-blue-700/80 md:mt-0">
                  {charity.pickupWindow && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 font-medium text-blue-700">
                      {charity.pickupWindow}
                    </span>
                  )}
                  {charity.contactPerson && (
                    <span className="rounded-full bg-blue-100 px-2 py-1 font-medium text-blue-700">
                      {charity.contactPerson}
                    </span>
                  )}
                </div>
              </div>

              {charity.address && (
                <p className="mt-3 text-sm text-blue-800/90">{charity.address}</p>
              )}

              {charity.notes && (
                <p className="mt-2 text-xs text-blue-700/80">{charity.notes}</p>
              )}

              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-blue-800/90">
                  {charity.phone ? `Phone: ${charity.phone}` : "Phone on request"}
                </div>
                <div className="flex gap-2">
                  {charity.phone && (
                    <a
                      href={`tel:${sanitizePhone(charity.phone)}`}
                      className="rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-sm font-medium text-blue-700 shadow-sm hover:bg-blue-100"
                    >
                      Call
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setContacted({ ...(contacted ?? {}), [key]: !alreadyContacted })
                    }
                    className={`rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 ${alreadyContacted ? "bg-blue-600 text-white" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}
                  >
                    {alreadyContacted ? "Marked contacted" : "Mark contacted"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
