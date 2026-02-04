/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 *
 * This file serves as the central place to register your Tambo components and tools.
 * It exports arrays that will be used by the TamboProvider.
 *
 * Read more about Tambo at https://tambo.co/docs
 */

import { Graph, graphSchema } from "@/components/tambo/graph";
import {
  WasteRiskAnalyzer,
  wasteRiskAnalyzerSchema,
} from "@/components/tambo/waste-risk-analyzer";
import {
  FlashSaleBuilder,
  flashSaleBuilderSchema,
} from "@/components/tambo/flash-sale-builder";
import { FoodBankCard, foodBankCardSchema } from "@/components/tambo/food-bank-card";
import { SelectForm, selectFormSchema } from "@/components/tambo/select-form";
import type { TamboComponent } from "@tambo-ai/react";
import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import {
  getSalesData,
  getProducts,
  getUserData,
  getKPIs,
} from "@/services/analytics-data";
import {
  findInventoryMatches,
  estimateLossForItem,
  getInventory,
} from "@/services/inventory";

/**
 * tools
 *
 * This array contains all the Tambo tools that are registered for use within the application.
 * Each tool is defined with its name, description, and expected props. The tools
 * can be controlled by AI to dynamically fetch data based on user interactions.
 */

export const tools: TamboTool[] = [
  {
    name: "getSalesData",
    description:
      "Get monthly sales revenue and units data. Can filter by region (North, South, East, West) or category (Electronics, Clothing, Home)",
    tool: getSalesData,
    toolSchema: z.function().args(
      z
        .object({
          region: z.string().optional(),
          category: z.string().optional(),
        })
        .default({}),
    ),
  },
  {
    name: "getProducts",
    description:
      "Get top products with sales and revenue information. Can filter by category (Electronics, Furniture, Appliances)",
    tool: getProducts,
    toolSchema: z.function().args(
      z
        .object({
          category: z.string().optional(),
        })
        .default({}),
    ),
  },
  {
    name: "getUserData",
    description:
      "Get monthly user growth and activity data. Can filter by segment (Free, Premium, Enterprise)",
    tool: getUserData,
    toolSchema: z.function().args(
      z
        .object({
          segment: z.string().optional(),
        })
        .default({}),
    ),
  },
  {
    name: "getKPIs",
    description:
      "Get key business performance indicators. Can filter by category (Financial, Growth, Quality, Retention, Marketing)",
    tool: getKPIs,
    toolSchema: z.function().args(
      z
        .object({
          category: z.string().optional(),
        })
        .default({}),
    ),
  },
  {
    name: "getInventory",
    description:
      "List available inventory items with SKU, unit price, and storage hints",
    tool: () => getInventory(),
    toolSchema: z.function().args(z.object({}).default({})),
  },
  {
    name: "findInventoryMatches",
    description:
      "Find inventory items by SKU, brand, category, or fuzzy name match. Returns ranked matches with confidence scores.",
    tool: (args: {
      sku?: string;
      name?: string;
      brand?: string;
      category?: string;
    }) => findInventoryMatches(args),
    toolSchema: z
      .function()
      .args(
        z
          .object({
            sku: z.string().optional(),
            name: z.string().optional(),
            brand: z.string().optional(),
            category: z.string().optional(),
          })
          .default({}),
      ),
  },
  {
    name: "estimateLossForItem",
    description:
      "Estimate total loss for an item given its name or SKU plus quantity at risk.",
    tool: (args: { nameOrSku: string; quantity: number }) =>
      estimateLossForItem(args.nameOrSku, args.quantity),
    toolSchema: z
      .function()
      .args(
        z.object({
          nameOrSku: z.string(),
          quantity: z.number().positive(),
        }),
      ),
  },
];

/**
 * components
 *
 * This array contains all the Tambo components that are registered for use within the application.
 * Each component is defined with its name, description, and expected props. The components
 * can be controlled by AI to dynamically render UI elements based on user interactions.
 */
export const components: TamboComponent[] = [
  {
    name: "Graph",
    description:
      "Use this when you want to display a chart. It supports bar, line, and pie charts. When you see data generally use this component. IMPORTANT: When asked to create a graph, always generate it first in the chat - do NOT add it directly to the canvas/dashboard. Let the user decide if they want to add it.",
    component: Graph,
    propsSchema: graphSchema,
  },
  {
    name: "SelectForm",
    description:
      "ALWAYS use this component instead of listing options as bullet points in text. Whenever you need to ask the user a question and would normally follow up with bullet points or numbered options, use this component instead. For yes/no or single-choice questions, use mode='single'. For questions where the user can select multiple options, use mode='multi' (default). Each group has a label (the question) and options (the choices). Examples: 'Would you like to continue?' with Yes/No options, or 'Which regions interest you?' with multiple region options.",
    component: SelectForm,
    propsSchema: selectFormSchema,
  },
  {
    name: "WasteRiskAnalyzer",
    description:
      "Red risk spotlight showing projected rupee loss for expiring inventory. Use when perishables need an urgent wake-up call.",
    component: WasteRiskAnalyzer,
    propsSchema: wasteRiskAnalyzerSchema,
  },
  {
    name: "FlashSaleBuilder",
    description:
      "Interactive discount slider that updates recovered revenue and produces a WhatsApp-ready CTA.",
    component: FlashSaleBuilder,
    propsSchema: flashSaleBuilderSchema,
  },
  {
    name: "FoodBankCard",
    description:
      "Donation fallback card listing nearby charities with contact details once stock is unsalvageable.",
    component: FoodBankCard,
    propsSchema: foodBankCardSchema,
  },
  // Add more components here
];
