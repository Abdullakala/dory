/**
 * Parses an environment variable as a boolean flag.
 * Returns `defaultValue` when the variable is undefined; `false` when the value is the string `"false"`.
 */
export function parseEnvFlag(value: string | undefined, defaultValue = true): boolean {
    if (value === undefined) return defaultValue;
    return value !== 'false';
}
