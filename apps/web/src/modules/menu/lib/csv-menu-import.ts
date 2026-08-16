import type { MenuItemStatus } from "../types/menu.types";

export const MENU_CSV_TEMPLATE = `category,name,description,price,sku,preparation_time,calories,featured,status
Starters,Nordic Caesar Salad,"Crisp greens, rye croutons and parmesan",9.90,STARTER-CAESAR,10,420,false,AVAILABLE
Mains,Margherita Pizza,"Tomato, mozzarella and basil",12.90,MAIN-PIZZA,20,780,true,AVAILABLE
`;

export type CsvMenuImportRow = {
  category: string;
  name: string;
  description?: string;
  price: number;
  sku?: string;
  preparationTime?: number;
  calories?: number;
  isFeatured?: boolean;
  status?: MenuItemStatus;
};

export type CsvMenuPreview = {
  rows: CsvMenuImportRow[];
  errors: string[];
};

const REQUIRED_HEADERS = ["category", "name", "price"] as const;
const VALID_STATUSES = new Set<MenuItemStatus>([
  "AVAILABLE",
  "UNAVAILABLE",
  "HIDDEN",
]);

const normalizeHeader = (value: string) =>
  value
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

function recordsFromCsv(source: string): {
  records: string[][];
  error?: string;
} {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === ",") {
      record.push(field);
      field = "";
    } else if (character === "\n") {
      record.push(field.replace(/\r$/, ""));
      if (record.some((value) => value.trim())) records.push(record);
      record = [];
      field = "";
    } else field += character;
  }

  if (quoted)
    return { records: [], error: "The CSV contains an unclosed quote." };
  record.push(field.replace(/\r$/, ""));
  if (record.some((value) => value.trim())) records.push(record);
  return { records };
}

const optionalInteger = (
  raw: string,
  label: string,
  line: number,
  errors: string[],
) => {
  if (!raw.trim()) return undefined;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    errors.push(
      `Row ${line}: ${label} must be a whole number of zero or more.`,
    );
    return undefined;
  }
  return value;
};

export function parseMenuCsv(source: string): CsvMenuPreview {
  const parsed = recordsFromCsv(source);
  if (parsed.error) return { rows: [], errors: [parsed.error] };
  if (parsed.records.length < 2) {
    return {
      rows: [],
      errors: ["Add a header and at least one menu item row."],
    };
  }

  const headers = parsed.records[0]!.map(normalizeHeader);
  const missing = REQUIRED_HEADERS.filter(
    (header) => !headers.includes(header),
  );
  if (missing.length) {
    return {
      rows: [],
      errors: [
        `Missing required column${missing.length === 1 ? "" : "s"}: ${missing.join(", ")}.`,
      ],
    };
  }
  if (parsed.records.length - 1 > 500) {
    return {
      rows: [],
      errors: ["A single import can contain at most 500 items."],
    };
  }

  const column = (record: string[], name: string) => {
    const index = headers.indexOf(name);
    return index < 0 ? "" : (record[index] ?? "").trim();
  };
  const rows: CsvMenuImportRow[] = [];
  const errors: string[] = [];
  const skus = new Set<string>();

  parsed.records.slice(1).forEach((record, rowIndex) => {
    const line = rowIndex + 2;
    const category = column(record, "category");
    const name = column(record, "name");
    const rawPrice = column(record, "price");
    const price = Number(rawPrice);
    if (category.length < 2) errors.push(`Row ${line}: category is required.`);
    if (name.length < 2) errors.push(`Row ${line}: name is required.`);
    if (
      !rawPrice ||
      !Number.isFinite(price) ||
      price < 0 ||
      !/^\d+(?:\.\d{1,2})?$/.test(rawPrice)
    ) {
      errors.push(
        `Row ${line}: price must be a non-negative number with up to two decimals.`,
      );
    }

    const sku = column(record, "sku").toUpperCase();
    if (sku && skus.has(sku))
      errors.push(`Row ${line}: SKU ${sku} is duplicated.`);
    if (sku) skus.add(sku);
    const preparationTime = optionalInteger(
      column(record, "preparation_time"),
      "preparation_time",
      line,
      errors,
    );
    const calories = optionalInteger(
      column(record, "calories"),
      "calories",
      line,
      errors,
    );
    const featured = column(record, "featured").toLowerCase();
    if (
      featured &&
      !["true", "false", "yes", "no", "1", "0"].includes(featured)
    ) {
      errors.push(`Row ${line}: featured must be true or false.`);
    }
    const status = (column(record, "status").toUpperCase() ||
      "AVAILABLE") as MenuItemStatus;
    if (!VALID_STATUSES.has(status)) {
      errors.push(
        `Row ${line}: status must be AVAILABLE, UNAVAILABLE, or HIDDEN.`,
      );
    }

    rows.push({
      category,
      name,
      price,
      ...(column(record, "description")
        ? { description: column(record, "description") }
        : {}),
      ...(sku ? { sku } : {}),
      ...(preparationTime !== undefined ? { preparationTime } : {}),
      ...(calories !== undefined ? { calories } : {}),
      ...(featured
        ? { isFeatured: ["true", "yes", "1"].includes(featured) }
        : {}),
      ...(VALID_STATUSES.has(status) ? { status } : {}),
    });
  });

  return { rows, errors };
}

export function downloadMenuCsvTemplate() {
  const url = URL.createObjectURL(
    new Blob([MENU_CSV_TEMPLATE], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "tablefolk-menu-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}
