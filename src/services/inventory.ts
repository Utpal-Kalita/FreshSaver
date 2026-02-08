import inventoryData from "@/data/inventory.json";

export interface InventoryItem {
  sku: string;
  name: string;
  brand: string;
  category: string;
  unitPrice: number;
  unit: string;
  location: string;
  shelfLifeDays: number;
  quantityAtRisk?: number;
  daysUntilExpiry?: number;
}

export interface InventoryMatch {
  item: InventoryItem;
  matchConfidence: number;
  matchedBy: "sku" | "name" | "brand" | "category";
}

export interface LossEstimate {
  item: InventoryItem;
  quantity: number;
  totalValue: number;
  perUnitValue: number;
}

const inventory = inventoryData as InventoryItem[];

const normalize = (value?: string) => value?.toLocaleLowerCase().trim() ?? "";

export const resolveInventoryItem = (query: string): InventoryItem | undefined => {
  if (!query) {
    return undefined;
  }

  const normalizedQuery = normalize(query);
  if (!normalizedQuery) {
    return undefined;
  }

  const exactMatch = inventory.find((item) => {
    const itemSku = normalize(item.sku);
    const itemName = normalize(item.name);
    return itemSku === normalizedQuery || itemName === normalizedQuery;
  });

  if (exactMatch) {
    return exactMatch;
  }

  return inventory.find((item) => {
    const itemName = normalize(item.name);
    return itemName.includes(normalizedQuery);
  });
};

export const getInventory = async (): Promise<InventoryItem[]> => {
  return inventory;
};

export const findInventoryMatches = async (
  query: {
    sku?: string;
    name?: string;
    brand?: string;
    category?: string;
  },
): Promise<InventoryMatch[]> => {
  const sku = normalize(query.sku);
  const name = normalize(query.name);
  const brand = normalize(query.brand);
  const category = normalize(query.category);

  const matches: InventoryMatch[] = [];

  inventory.forEach((item) => {
    const itemSku = normalize(item.sku);
    const itemName = normalize(item.name);
    const itemBrand = normalize(item.brand);
    const itemCategory = normalize(item.category);

    if (sku && itemSku === sku) {
      matches.push({ item, matchConfidence: 1, matchedBy: "sku" });
      return;
    }

    if (name && (itemName.includes(name) || name.includes(itemName))) {
      matches.push({ item, matchConfidence: 0.9, matchedBy: "name" });
      return;
    }

    if (brand && itemBrand.includes(brand)) {
      matches.push({ item, matchConfidence: 0.6, matchedBy: "brand" });
      return;
    }

    if (category && itemCategory.includes(category)) {
      matches.push({ item, matchConfidence: 0.4, matchedBy: "category" });
    }
  });

  if (!matches.length && name) {
    const fuzzyMatches = inventory
      .map((item) => {
        const itemName = normalize(item.name);
        const distance = Math.abs(itemName.length - name.length);
        const overlap = itemName.split(" ").filter((token) => name.includes(token)).length;
        const confidence = Math.max(0.2, overlap / Math.max(1, itemName.split(" ").length) - distance * 0.02);
        return { item, matchConfidence: confidence, matchedBy: "name" as const };
      })
      .filter((match) => match.matchConfidence > 0.3)
      .sort((a, b) => b.matchConfidence - a.matchConfidence);

    if (fuzzyMatches.length) {
      return fuzzyMatches.slice(0, 3);
    }
  }

  return matches.sort((a, b) => b.matchConfidence - a.matchConfidence).slice(0, 5);
};

export const getExpiringItems = async (
  withinDays: number = 30,
): Promise<InventoryItem[]> => {
  return inventory
    .filter(
      (item) =>
        typeof item.daysUntilExpiry === "number" &&
        item.daysUntilExpiry <= withinDays,
    )
    .sort((a, b) => (a.daysUntilExpiry ?? 0) - (b.daysUntilExpiry ?? 0));
};

export const estimateLossForItem = async (
  nameOrSku: string,
  quantity: number,
): Promise<LossEstimate | undefined> => {
  if (!nameOrSku || quantity <= 0) {
    return undefined;
  }

  const [match] = await findInventoryMatches({ name: nameOrSku, sku: nameOrSku });
  if (!match) {
    return undefined;
  }

  const effectiveQuantity = Number.isFinite(quantity)
    ? quantity
    : match.item.quantityAtRisk ?? 0;
  const totalValue = match.item.unitPrice * effectiveQuantity;

  return {
    item: match.item,
    quantity: effectiveQuantity,
    totalValue,
    perUnitValue: match.item.unitPrice,
  };
};
