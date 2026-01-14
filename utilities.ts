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
