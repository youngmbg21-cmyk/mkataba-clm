/** 1 234 567 SEK — spaces, not commas, so it reads the Swedish way. */
export const fmt = (n, cur = 'SEK') => {
  const r = Math.round(Number(n) || 0)
  return r.toLocaleString('sv-SE').replace(/,/g, ' ').replace(/ /g, ' ') + (cur ? ' ' + cur : '')
}

export const fmtDate = iso => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('sv-SE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
