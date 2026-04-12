import type { TableSchema } from '@/shared/stores/schema.store';

type SuggestedQuestion = {
    text: string;
    priority: number;
};

type TableRule = {
    pattern: RegExp;
    template: (formatters: SuggestionFormatters, table: string) => string;
};

type ColumnRule = {
    pattern: RegExp;
    template: (formatters: SuggestionFormatters, table: string, column: string) => string;
};

export type SuggestionFormatters = {
    orderTrend: (table: string) => string;
    topUsers: (table: string) => string;
    errorLogs: (table: string) => string;
    popularProducts: (table: string) => string;
    paymentSummary: (table: string) => string;
    recentTrend: (table: string) => string;
    topRecordsByColumn: (table: string, column: string) => string;
    breakdownByColumn: (table: string, column: string) => string;
};

const TABLE_RULES: TableRule[] = [
    { pattern: /order/i, template: (formatters, table) => formatters.orderTrend(table) },
    { pattern: /user|customer/i, template: (formatters, table) => formatters.topUsers(table) },
    { pattern: /log|event/i, template: (formatters, table) => formatters.errorLogs(table) },
    { pattern: /product|item/i, template: (formatters, table) => formatters.popularProducts(table) },
    { pattern: /payment|transaction/i, template: (formatters, table) => formatters.paymentSummary(table) },
];

const COLUMN_RULES: ColumnRule[] = [
    {
        pattern: /^(created_at|updated_at|timestamp|date|time|datetime|created|updated)$/i,
        template: (formatters, table) => formatters.recentTrend(table),
    },
    {
        pattern: /^(amount|price|revenue|total|cost|salary|balance)$/i,
        template: (formatters, table, column) => formatters.topRecordsByColumn(table, column),
    },
    {
        pattern: /^(status|state|type|category)$/i,
        template: (formatters, table, column) => formatters.breakdownByColumn(table, column),
    },
];

function getTableBaseName(name: string): string {
    const parts = name.split('.');
    return parts[parts.length - 1];
}

export function createSuggestionFormatters(locale?: string): SuggestionFormatters {
    const normalizedLocale = (locale ?? 'en').toLowerCase();

    if (normalizedLocale.startsWith('zh')) {
        return {
            orderTrend: table => `${table} 的每日趋势`,
            topUsers: table => `${table} 中最活跃的前 10 名用户`,
            errorLogs: table => `${table} 中最近 24 小时的错误日志`,
            popularProducts: table => `${table} 中最受欢迎的商品`,
            paymentSummary: table => `${table} 的支付汇总`,
            recentTrend: table => `${table} 最近 7 天的趋势`,
            topRecordsByColumn: (table, column) => `按 ${column} 查看 ${table} 中前 10 条记录`,
            breakdownByColumn: (table, column) => `按 ${column} 统计 ${table} 的分布`,
        };
    }

    if (normalizedLocale.startsWith('ja')) {
        return {
            orderTrend: table => `${table} の日次トレンドを表示`,
            topUsers: table => `${table} のアクティブユーザー上位10件を表示`,
            errorLogs: table => `${table} の直近24時間のエラーログを表示`,
            popularProducts: table => `${table} の人気商品を表示`,
            paymentSummary: table => `${table} の支払いサマリーを表示`,
            recentTrend: table => `${table} の直近7日間のトレンドを表示`,
            topRecordsByColumn: (table, column) => `${table} を ${column} で並べた上位10件を表示`,
            breakdownByColumn: (table, column) => `${column} ごとの ${table} の内訳を表示`,
        };
    }

    if (normalizedLocale.startsWith('es')) {
        return {
            orderTrend: table => `Mostrar tendencias diarias de ${table}`,
            topUsers: table => `Mostrar los 10 usuarios más activos de ${table}`,
            errorLogs: table => `Mostrar errores de las últimas 24 horas en ${table}`,
            popularProducts: table => `Mostrar los productos más populares de ${table}`,
            paymentSummary: table => `Mostrar el resumen de pagos de ${table}`,
            recentTrend: table => `Mostrar la tendencia de ${table} en los últimos 7 días`,
            topRecordsByColumn: (table, column) => `Mostrar los 10 registros principales de ${table} por ${column}`,
            breakdownByColumn: (table, column) => `Mostrar el desglose de ${table} por ${column}`,
        };
    }

    return {
        orderTrend: table => `Show daily trends from ${table}`,
        topUsers: table => `Show top 10 users by activity from ${table}`,
        errorLogs: table => `Show error logs in the last 24 hours from ${table}`,
        popularProducts: table => `Show most popular products from ${table}`,
        paymentSummary: table => `Show payment summary from ${table}`,
        recentTrend: table => `Show trend of ${table} in the last 7 days`,
        topRecordsByColumn: (table, column) => `Show top 10 records from ${table} by ${column}`,
        breakdownByColumn: (table, column) => `Show breakdown of ${table} by ${column}`,
    };
}

export function generateSuggestions(tables: TableSchema[], fallbacks: string[], formatters: SuggestionFormatters, limit = 4): string[] {
    const suggestions: SuggestedQuestion[] = [];
    const usedTables = new Set<string>();

    for (const table of tables) {
        const baseName = getTableBaseName(table.name);

        for (const rule of TABLE_RULES) {
            if (rule.pattern.test(baseName) && !usedTables.has(table.name)) {
                suggestions.push({ text: rule.template(formatters, baseName), priority: 1 });
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
                    suggestions.push({ text: rule.template(formatters, baseName, column), priority: 2 });
                    usedTables.add(table.name);
                    break;
                }
            }
        }
    }

    suggestions.sort((a, b) => a.priority - b.priority);
    const result = suggestions.slice(0, limit).map(suggestion => suggestion.text);

    if (result.length < limit) {
        for (const fallback of fallbacks) {
            if (result.length >= limit) break;
            if (!result.includes(fallback)) {
                result.push(fallback);
            }
        }
    }

    return result;
}
