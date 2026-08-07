import { CONF_LABEL, CONF_NEXT } from '../../shared/model.js'

/**
 * The confidence tag beside every number. Click it to move the number
 * from Assumed -> Estimated -> Verified as real evidence arrives.
 */
export function Chip({ value, onChange }) {
  return (
    <button
      className="chip"
      data-c={value}
      title="Click to change how much this number is trusted"
      onClick={() => onChange(CONF_NEXT[value] || 'A')}
    >
      {CONF_LABEL[value] || 'Assumed'}
    </button>
  )
}

/**
 * One editable row: label, number, unit, confidence tag.
 * No number in this app is ever shown without its tag.
 */
export default function Field({ label, hint, value, conf, unit, step = 1, onValue, onConf }) {
  return (
    <div className="field">
      <label>
        {label}
        {hint ? <span className="hint">{hint}</span> : null}
      </label>
      <input
        type="number"
        value={value ?? 0}
        step={step}
        onChange={e => onValue(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
      />
      <span className="unit">{unit || ''}</span>
      <Chip value={conf} onChange={onConf} />
    </div>
  )
}
