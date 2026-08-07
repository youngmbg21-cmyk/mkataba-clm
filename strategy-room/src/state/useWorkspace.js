import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { shapeModel } from '../../shared/model.js'

const TABLES = ['settings', 'markets', 'tiers', 'features', 'costs', 'roles', 'evidence', 'scenarios']

/**
 * Loads the shared workspace, keeps it saved, and keeps both partners in
 * step. Edits appear on screen instantly and are written to the database
 * a moment later, so typing never feels laggy.
 */
export function useWorkspace(session) {
  const [workspaceId, setWorkspaceId] = useState(null)
  const [raw, setRaw] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const pending = useRef(new Map()) // "table:id" -> patch waiting to be written
  const timer = useRef(null)
  const wsRef = useRef(null)

  // ---------------------------------------------------------------
  // Load everything
  // ---------------------------------------------------------------
  const load = useCallback(async ws => {
    const results = await Promise.all(
      TABLES.map(t => supabase.from(t).select('*').eq('workspace_id', ws))
    )
    const bad = results.find(r => r.error)
    if (bad) throw new Error(bad.error.message)

    const next = {}
    TABLES.forEach((t, i) => {
      next[t] = results[i].data || []
    })
    setRaw(next)
  }, [])

  useEffect(() => {
    if (!session) return
    let cancelled = false

    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const { data: member, error: mErr } = await supabase
          .from('workspace_members')
          .select('workspace_id')
          .limit(1)

        if (mErr) throw new Error(mErr.message)
        if (!member?.length) {
          throw new Error(
            'Your account is not in a workspace yet. In Supabase, run:  select seed_workspace();  ' +
              'and then  select add_member(\'your@email\');'
          )
        }

        const ws = member[0].workspace_id
        if (cancelled) return
        wsRef.current = ws
        setWorkspaceId(ws)
        await load(ws)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [session, load])

  // ---------------------------------------------------------------
  // Live sync — the other person's edits land here without a refresh.
  // Reloads are skipped while we have unsaved edits of our own, so a
  // partner's change never overwrites what you are mid-way through
  // typing.
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!workspaceId) return
    let reloadTimer = null

    const channel = supabase
      .channel(`workspace-${workspaceId}`)
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        if (pending.current.size > 0) return
        clearTimeout(reloadTimer)
        reloadTimer = setTimeout(() => {
          if (pending.current.size === 0) load(workspaceId).catch(() => {})
        }, 500)
      })
      .subscribe()

    return () => {
      clearTimeout(reloadTimer)
      supabase.removeChannel(channel)
    }
  }, [workspaceId, load])

  // ---------------------------------------------------------------
  // Saving
  // ---------------------------------------------------------------
  const flush = useCallback(async () => {
    const batch = [...pending.current.entries()]
    pending.current.clear()
    if (!batch.length) {
      setSaving(false)
      return
    }

    setSaving(true)
    try {
      for (const [key, patch] of batch) {
        const [table, id] = key.split(':')
        const { error: e } = await supabase.from(table).update(patch).eq('id', id)
        if (e) throw new Error(`${table}: ${e.message}`)
      }
      setError(null)
    } catch (e) {
      setError(`Not saved — ${e.message}`)
    } finally {
      setSaving(pending.current.size > 0)
    }
  }, [])

  const queue = useCallback(
    (table, id, patch) => {
      const key = `${table}:${id}`
      pending.current.set(key, { ...(pending.current.get(key) || {}), ...patch })
      setSaving(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, 600)
    },
    [flush]
  )

  /** Change one row. Shows instantly, saves shortly after. */
  const update = useCallback(
    (table, id, patch) => {
      setRaw(prev => {
        if (!prev) return prev
        return {
          ...prev,
          [table]: prev[table].map(r => (r.id === id ? { ...r, ...patch } : r))
        }
      })
      queue(table, id, patch)
    },
    [queue]
  )

  /** Change a whole-business setting. */
  const updateSettings = useCallback(
    patch => {
      const row = raw?.settings?.[0]
      if (!row) return
      update('settings', row.id, patch)
    },
    [raw, update]
  )

  /** Add a row (a role, a conversation, a cost line). Saves at once. */
  const addRow = useCallback(
    async (table, values) => {
      if (!workspaceId) return null
      setSaving(true)
      const { data, error: e } = await supabase
        .from(table)
        .insert({ ...values, workspace_id: workspaceId })
        .select()
        .single()
      setSaving(false)

      if (e) {
        setError(`Could not add — ${e.message}`)
        return null
      }
      setRaw(prev => (prev ? { ...prev, [table]: [...prev[table], data] } : prev))
      return data
    },
    [workspaceId]
  )

  /** Remove a row. Saves at once. */
  const deleteRow = useCallback(async (table, id) => {
    setSaving(true)
    const { error: e } = await supabase.from(table).delete().eq('id', id)
    setSaving(false)

    if (e) {
      setError(`Could not remove — ${e.message}`)
      return
    }
    setRaw(prev => (prev ? { ...prev, [table]: prev[table].filter(r => r.id !== id) } : prev))
  }, [])

  // Write anything outstanding if the tab is closed mid-edit.
  useEffect(() => {
    const bail = () => {
      if (pending.current.size > 0) flush()
    }
    window.addEventListener('beforeunload', bail)
    return () => window.removeEventListener('beforeunload', bail)
  }, [flush])

  const model = useMemo(() => {
    if (!raw) return null
    return shapeModel({
      settings: raw.settings[0],
      markets: raw.markets,
      tiers: raw.tiers,
      features: raw.features,
      costs: raw.costs,
      roles: raw.roles,
      evidence: raw.evidence
    })
  }, [raw])

  return {
    workspaceId,
    model,
    raw,
    loading,
    error,
    saving,
    setError,
    update,
    updateSettings,
    addRow,
    deleteRow,
    reload: () => (workspaceId ? load(workspaceId) : null)
  }
}
