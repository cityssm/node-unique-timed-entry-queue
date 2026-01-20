// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable sonarjs/pseudo-random */

/**
 * Converts a value to its string representation.
 * @param value - The value to convert.
 * @returns The string representation of the value.
 */
export function valueToString(value: unknown): string {
  if (typeof value === 'string') {
    return value
  } else if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return value.toString()
  } else if (value === null || value === undefined) {
    return ''
  } else {
    return JSON.stringify(value)
  }
}

/**
 * Generates a unique listener ID.
 * @returns A unique string identifier.
 */
export function generateUniqueListenerId(): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 15) +
    Math.random().toString(36).slice(2, 15)
  )
}
