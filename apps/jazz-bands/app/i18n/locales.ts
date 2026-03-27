import fr from './locales/fr.json'

export function flattenMessages(
  nested: Record<string, unknown>,
  prefix = '',
): Record<string, string> {
  const result: Record<string, string> = {}

  for (const [key, value] of Object.entries(nested)) {
    const newKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenMessages(value as Record<string, unknown>, newKey))
    } else {
      result[newKey] = String(value)
    }
  }

  return result
}

export const frMessages = flattenMessages(fr)
