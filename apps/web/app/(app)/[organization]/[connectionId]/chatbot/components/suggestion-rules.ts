import type { TableSchema } from '@/shared/stores/schema.store';

type SuggestedQuestion = {
  text: string;
  priority: number;
};

type TableRule = {
  pattern: RegExp;
  template: (table: string) => string;
};

type ColumnRule = {
  pattern: RegExp;
  template: (table: string, column: string) => string;
};

const TABLE_RULES: TableRule[] = [
  { pattern: /order/i, template: (t) => `Show daily order trends from ${t}` },
  { pattern: /user|customer/i, template: (t) => `Top 10 users by activity from ${t}` },
  { pattern: /log|event/i, template: (t) => `Error logs in the last 24 hours from ${t}` },
  { pattern: /product|item/i, template: (t) => `Most popular products from ${t}` },
  { pattern: /payment|transaction/i, template: (t) => `Payment summary from ${t}` },
];

const COLUMN_RULES: ColumnRule[] = [
  {
    pattern: /^(created_at|updated_at|timestamp|date|time|datetime|created|updated)$/i,
    template: (t) => `Trend of ${t} in the last 7 days`,
  },
  {
    pattern: /^(amount|price|revenue|total|cost|salary|balance)$/i,
    template: (t, c) => `Top 10 records from ${t} by ${c}`,
  },
  {
    pattern: /^(status|state|type|category)$/i,
    template: (t, c) => `Breakdown of ${t} by ${c}`,
  },
];

function getTableBaseName(name: string): string {
  const parts = name.split('.');
  return parts[parts.length - 1];
}

export function generateSuggestions(
  tables: TableSchema[],
  fallbacks: string[],
  limit = 4,
): string[] {
  const suggestions: SuggestedQuestion[] = [];
  const usedTables = new Set<string>();

  for (const table of tables) {
    const baseName = getTableBaseName(table.name);

    for (const rule of TABLE_RULES) {
      if (rule.pattern.test(baseName) && !usedTables.has(table.name)) {
        suggestions.push({ text: rule.template(baseName), priority: 1 });
        usedTables.add(table.name);
        break;
      }
    }
  }

  for (const table of tables) {
    if (usedTables.has(table.name)) continue;
    const baseName = getTableBaseName(table.name);

    for (const column of table.columns) {
      if (usedTables.has(table.name)) break;

      for (const rule of COLUMN_RULES) {
        if (rule.pattern.test(column)) {
          suggestions.push({ text: rule.template(baseName, column), priority: 2 });
          usedTables.add(table.name);
          break;
        }
      }
    }
  }

  suggestions.sort((a, b) => a.priority - b.priority);
  const result = suggestions.slice(0, limit).map((s) => s.text);

  if (result.length < limit) {
    for (const fb of fallbacks) {
      if (result.length >= limit) break;
      if (!result.includes(fb)) {
        result.push(fb);
      }
    }
  }

  return result;
}
