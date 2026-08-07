import { MONTHS } from '../../shared/model.js'

/** Revenue against costs, month by month. Where they cross is break-even. */
export default function Chart({ p }) {
  const W = 1000
  const H = 280
  const PAD = 44

  const max = Math.max(...p.rows.map(r => Math.max(r.revenue, r.costs))) * 1.15 || 1
  const x = m => PAD + ((m - 1) / (MONTHS - 1)) * (W - PAD - 20)
  const y = v => H - PAD - (v / max) * (H - PAD - 16)
  const line = key => p.rows.map(r => `${x(r.month)},${y(r[key])}`).join(' ')

  const crossRow = p.breakeven ? p.rows[p.breakeven - 1] : null

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto' }} role="img"
         aria-label="Revenue against costs over 24 months">
      <line x1={PAD} y1={H - PAD} x2={W - 20} y2={H - PAD} stroke="#D6DCDA" />
      <line x1={PAD} y1={16} x2={PAD} y2={H - PAD} stroke="#D6DCDA" />

      {crossRow && (
        <>
          <line
            x1={x(crossRow.month)} y1={18} x2={x(crossRow.month)} y2={H - PAD}
            stroke="var(--verified)" strokeDasharray="3 3"
          />
          <circle cx={x(crossRow.month)} cy={y(crossRow.revenue)} r={5} fill="var(--verified)" />
          <text
            x={x(crossRow.month) + 8} y={28} fontSize={12}
            fontFamily="IBM Plex Mono" fill="var(--verified)"
          >
            break-even · month {crossRow.month}
          </text>
        </>
      )}

      <polyline points={line('costs')} fill="none" stroke="#B4462F" strokeWidth={2} />
      <polyline points={line('revenue')} fill="none" stroke="#2F6DB4" strokeWidth={2.5} />

      {[1, 6, 12, 18, 24].map(m => (
        <text key={m} x={x(m)} y={H - 18} fontSize={11} textAnchor="middle"
              fill="#41535F" fontFamily="IBM Plex Mono">
          {m}
        </text>
      ))}

      <text x={PAD} y={H - 4} fontSize={11} fill="#41535F">month</text>
      <text x={W - 20} y={30} fontSize={12} textAnchor="end" fill="#2F6DB4"
            fontFamily="IBM Plex Mono">revenue</text>
      <text x={W - 20} y={48} fontSize={12} textAnchor="end" fill="#B4462F"
            fontFamily="IBM Plex Mono">costs</text>
    </svg>
  )
}
