// Helper utility functions - Social Content Agent
/**
 * Generate a unique ID
 */
export function generateId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}
/**
 * Format a date as ISO string
 */
export function formatDate(date) {
    return date.toISOString();
}
/**
 * Mask sensitive data for logging
 */
export function maskSecret(value) {
    if (value.length <= 8)
        return '****';
    return `${value.slice(0, 4)}****${value.slice(-4)}`;
}
/**
 * Check if a value is defined (not null or undefined)
 */
export function isDefined(value) {
    return value !== null && value !== undefined;
}
/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse(json, fallback) {
    try {
        return JSON.parse(json);
    }
    catch {
        return fallback;
    }
}
/**
 * Truncate a string to a maximum length
 */
export function truncate(str, maxLength, suffix = '...') {
    if (str.length <= maxLength)
        return str;
    return str.slice(0, maxLength - suffix.length) + suffix;
}
/**
 * Pick specified keys from an object
 */
export function pick(obj, keys) {
    const result = {};
    for (const key of keys) {
        if (key in obj) {
            result[key] = obj[key];
        }
    }
    return result;
}
/**
 * Omit specified keys from an object
 */
export function omit(obj, keys) {
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result;
}
//# sourceMappingURL=helpers.js.map