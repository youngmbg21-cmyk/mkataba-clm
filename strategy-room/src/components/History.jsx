import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { fmtDate } from '../lib/format.js'

// The database stores column names. These are the words a person uses.
const FIELD_LABELS = {
  fx: 'exchange rate',
  fx_conf: 'exchange rate — trust level',
  cash: 'cash you start with',
  cash_conf: 'cash you start with — trust level',
  buffer: 'safety buffer',
  buffer_conf: 'safety buffer — trust level',
  target_arr: 'yearly revenue target',
  target_arr_conf: 'yearly revenue target — trust level',
  target_month: 'target month',
  target_month_conf: 'target month — trust level',
  new_per_month: 'new customers per month',
  new_per_conf: 'new customers per month — trust level',
  churn: 'monthly churn',
  churn_conf: 'monthly churn — trust level',
  cac: 'cost to win a customer',
  cac_conf: 'cost to win a customer — trust level',
  start_customers: 'customers already had',
  start_conf: 'customers already had — trust level',
  mix_ess: 'tier mix — Essentials',
  mix_pro: 'tier mix — Professional',
  mix_ent: 'tier mix — Enterprise',
  price_se: 'Sweden price',
  price_se_conf: 'Sweden price — trust level',
  price_ke: 'Kenya price',
  price_ke_conf: 'Kenya price — trust level',
  value: 'amount',
  confidence: 'trust level',
  cost: 'monthly cost',
  start_month: 'month it starts',
  name: 'name',
  said: 'what they said',
  affects: 'number it affects',
  who: 'who',
  market: 'market',
  ess: 'in Essentials',
  pro: 'in Professional',
  ent: 'in Enterprise',
  '(row)': ''
}

const CONF_WORDS = { A: 'Assumed', E: 'Estimated', V: 'Verified' }

const pretty = v => {
  if (v === null || v === undefined || v === '') return '—'
  if (CONF_WORDS[v]) return CONF_WORDS[v]
  if (v === 'true') return 'yes'
  if (v === 'false') return 'no'
  const n = Number(v)
  if (!Number.isNaN(n) && v !== '') return String(Math.round(n * 100) / 100)
  return String(v)
}

export default function History({ workspaceId }) {
  const [rows, setRows] = useState([])
  const [people, setPeople] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!workspaceId) return
    let cancelled = false

    ;(async () => {
      setLoading(true)
      const [{ data: log }, { data: members }] = await Promise.all([
        supabase
          .from('change_log')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('changed_at', { ascending: false })
          .limit(300),
        supabase.from('workspace_members').select('user_id, display_name')
      ])

      if (cancelled) return
      const map = {}
      ;(members || []).forEach(m => {
        map[m.user_id] = m.display_name || 'a partner'
      })
      setPeople(map)
      setRows(log || [])
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [workspaceId])

  return (
    <div className="card">
      <h2>What changed, and when</h2>
      <p className="sub">
        Every number that moves is recorded here: who changed it, when, and what it was before.
        Arguments about pricing are useless without knowing when a number moved. Nothing on this page
        can be edited or deleted — it is a record.
      </p>

      {loading ? (
        <p className="sub">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="sub">Nothing has changed yet.</p>
      ) : (
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Who</th>
                <th>What</th>
                <th className="r">From</th>
                <th className="r">To</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const what =
                  r.operation === 'insert'
                    ? `added ${r.row_label}`
                    : r.operation === 'delete'
                      ? `removed ${r.row_label}`
                      : `${r.row_label} — ${FIELD_LABELS[r.field] ?? r.field}`
                return (
                  <tr key={r.id}>
                    <td style={{ fontSize: 12, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
                      {fmtDate(r.changed_at)}
                    </td>
                    <td style={{ fontSize: 12 }}>{people[r.changed_by] || 'unknown'}</td>
                    <td>{what}</td>
                    <td className="r mono">{r.operation === 'update' ? pretty(r.old_value) : ''}</td>
                    <td className="r mono">{r.operation === 'update' ? pretty(r.new_value) : ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
