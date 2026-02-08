
// /api/cron-compute-next-week.js
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const url = process.env.VITE_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) return res.status(500).json({ error: 'Missing envs' })

    const supabase = createClient(url, serviceKey)

    // Fetch all programs
    const { data: programs, error: pErr } = await supabase.from('programs').select('id, meso_weeks')
    if (pErr) throw pErr

    let computed = 0, skipped = 0
    for (const p of (programs || [])) {
      // Find last week for program
      const { data: weeks, error: wErr } = await supabase
        .from('weeks')
        .select('week_number')
        .eq('program_id', p.id)
        .order('week_number', { ascending: false })
        .limit(1)
      if (wErr) throw wErr

      const lastWeek = weeks?.[0]?.week_number
      if (!lastWeek) { skipped++; continue }

      if (lastWeek >= (p.meso_weeks || 5)) { skipped++; continue }

      // Call Supabase Edge Function to compute next week
      const fnUrl = url.replace('.supabase.co', '.functions.supabase.co') + '/compute-next-week'
      const resp = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ program_id: p.id, from_week: lastWeek })
      })
      if (!resp.ok) {
        const t = await resp.text()
        console.error('Edge function error:', t)
        continue
      }
      computed++
    }

    return res.status(200).json({ ok: true, computed, skipped })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: e.message || String(e) })
  }
}
