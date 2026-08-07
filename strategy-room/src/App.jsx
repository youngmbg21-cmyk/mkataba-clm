import { useEffect, useState } from 'react'
import { supabase, configured } from './lib/supabase.js'
import { useWorkspace } from './state/useWorkspace.js'

import Auth from './components/Auth.jsx'
import Header from './components/Header.jsx'
import Ledger from './components/Ledger.jsx'
import Pricing from './components/Pricing.jsx'
import Profit from './components/Profit.jsx'
import Growth from './components/Growth.jsx'
import Copilot from './components/Copilot.jsx'
import History from './components/History.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState('ledger')

  useEffect(() => {
    if (!configured) {
      setReady(true)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const ws = useWorkspace(session)

  if (!ready) return null
  if (!configured || !session) return <Auth />

  if (ws.loading) {
    return (
      <main className="wrap" style={{ paddingTop: 60 }}>
        <div className="card">Loading your model…</div>
      </main>
    )
  }

  if (!ws.model || !ws.model.settings?.id) {
    return (
      <main className="wrap" style={{ paddingTop: 60 }}>
        <div className="card">
          <h2>No model yet</h2>
          <p className="sub">{ws.error || 'This workspace has no numbers in it.'}</p>
          <p className="sub">
            In Supabase, open the SQL editor and run <b>select seed_workspace();</b> once. Then
            refresh this page.
          </p>
          <button className="btn" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </main>
    )
  }

  const props = {
    model: ws.model,
    raw: ws.raw,
    workspaceId: ws.workspaceId,
    update: ws.update,
    updateSettings: ws.updateSettings,
    addRow: ws.addRow,
    deleteRow: ws.deleteRow
  }

  return (
    <>
      <Header
        model={ws.model}
        tab={tab}
        setTab={setTab}
        email={session.user.email}
        saving={ws.saving}
      />
      <main className="wrap">
        {ws.error ? <div className="err">{ws.error}</div> : null}

        {tab === 'ledger' && <Ledger {...props} />}
        {tab === 'pricing' && <Pricing {...props} />}
        {tab === 'profit' && <Profit {...props} />}
        {tab === 'growth' && <Growth {...props} />}
        {tab === 'copilot' && <Copilot model={ws.model} workspaceId={ws.workspaceId} />}
        {tab === 'history' && <History workspaceId={ws.workspaceId} />}
      </main>
    </>
  )
}
