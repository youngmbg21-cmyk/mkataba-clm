// =====================================================================
// THE COPILOT — server side.
//
// Why this runs on a server and not in the browser:
//   1. The Anthropic API key never reaches anyone's laptop.
//   2. The briefing is rebuilt HERE from the saved numbers. The browser
//      cannot slip extra text to the model, so "the copilot is only ever
//      given the numbers that are actually in the model" is enforced,
//      not merely promised.
//
// The exact briefing that was sent is returned to the browser and saved
// to the database, so you can always see what the AI was told.
// =====================================================================

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { shapeModel } from '../../shared/model.js'
import { buildBrief, buildPrompt } from '../../shared/brief.js'

const MODEL = 'claude-opus-5'

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  })

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Use POST.' }, 405)

  const { SUPABASE_URL, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return json({ error: 'Server is missing SUPABASE_URL or SUPABASE_ANON_KEY.' }, 500)
  }
  if (!ANTHROPIC_API_KEY) {
    return json({ error: 'Server is missing ANTHROPIC_API_KEY.' }, 500)
  }

  let body
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Could not read the request.' }, 400)
  }

  const question = String(body?.question || '').trim()
  const workspaceId = String(body?.workspaceId || '').trim()
  if (!question) return json({ error: 'No question was asked.' }, 400)
  if (!workspaceId) return json({ error: 'No workspace was given.' }, 400)

  // The caller's own sign-in token. Every read below therefore runs as
  // that person, under the same security rules as the app — a stranger
  // cannot read someone else's model through this endpoint.
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'You are not signed in.' }, 401)

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  })

  const { data: userData, error: userErr } = await supabase.auth.getUser(token)
  if (userErr || !userData?.user) return json({ error: 'Your sign-in has expired.' }, 401)
  const userId = userData.user.id

  // --- Read the model back out of the database -----------------------
  const table = async name => {
    const { data, error } = await supabase.from(name).select('*').eq('workspace_id', workspaceId)
    if (error) throw new Error(`${name}: ${error.message}`)
    return data
  }

  let briefing
  try {
    const [settingsRows, markets, tiers, features, costs, roles, evidence] = await Promise.all([
      table('settings'),
      table('markets'),
      table('tiers'),
      table('features'),
      table('costs'),
      table('roles'),
      table('evidence')
    ])

    if (!settingsRows?.length) {
      return json({ error: 'No model found for this workspace.' }, 404)
    }

    briefing = buildBrief(
      shapeModel({
        settings: settingsRows[0],
        markets,
        tiers,
        features,
        costs,
        roles,
        evidence
      })
    )
  } catch (e) {
    return json({ error: `Could not read the model: ${e.message}` }, 500)
  }

  // --- Ask Claude ----------------------------------------------------
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })
  let answer = null
  let failure = null

  try {
    const response = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 8000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages: [{ role: 'user', content: buildPrompt(briefing, question) }]
    })

    if (response.stop_reason === 'refusal') {
      failure = 'The model declined to answer that question. Try rewording it.'
    } else {
      answer = response.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('\n')
        .trim()

      if (response.stop_reason === 'max_tokens' && answer) {
        answer += '\n\n(The answer was cut short. Ask a narrower question.)'
      }
      if (!answer) failure = 'The model returned an empty answer. Try again.'
    }
  } catch (e) {
    failure = e?.status === 429
      ? 'Too many questions at once. Wait a moment and try again.'
      : `The copilot could not be reached: ${e?.message || 'unknown error'}`
  }

  // --- Keep the record ------------------------------------------------
  // Every question and answer is saved so you can look back at what
  // advice you were given and whether it held up.
  await supabase.from('copilot_log').insert({
    workspace_id: workspaceId,
    question,
    briefing,
    answer,
    model: MODEL,
    error: failure,
    created_by: userId
  })

  if (failure) return json({ briefing, error: failure }, 502)
  return json({ briefing, answer, model: MODEL })
}
