/** Keep the browser's local wall time when moving between Jam forms and API instants. */
export function jamDateTimeToForm(value?: string): {date: string; time: string} {
  if (!value) return {date: '', time: ''}
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return {date: '', time: ''}

  const date = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`
  const time = `${String(parsed.getHours()).padStart(2, '0')}:${String(parsed.getMinutes()).padStart(2, '0')}`
  return {date, time}
}

export function jamFormToDateTime(date: string, time: string): string {
  return new Date(`${date}T${time}`).toISOString()
}
