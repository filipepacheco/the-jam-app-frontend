export function safeT(t: (k: string, opts?: any) => any, key: string, opts?: any): string {
  const res = t(key, opts)
  if (typeof res === 'string') return res

  if (res && typeof res === 'object') {
    // Handle common plural object shapes { one: '', other: '' }
    if (opts && typeof opts.count === 'number') {
      const count = Number(opts.count)
      const form = count === 1 ? 'one' : 'other'
      const template = res[form] ?? res.other ?? Object.values(res)[0]
      if (typeof template === 'string') {
        return template.replace('{{count}}', String(count))
      }
      return String(template ?? '')
    }

    // Fallback to the 'other' form if present, else first string value
    if (typeof res.other === 'string') return res.other
    const first = Object.values(res).find(v => typeof v === 'string')
    if (first) return String(first)

    // As a last resort, stringify
    try {
      return JSON.stringify(res)
    } catch (e) {
      return String(res)
    }
  }

  return String(res ?? '')
}

