
import React, { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '../state/store'
import { buildSplit, distributeSets, weeklyTargets, nextLoadSuggestion } from '../utils/rp'
import { supabase } from '../lib/supabaseClient'
import { enqueue, drain } from '../utils/offlineQueue'

export default function Workout(){
    React.useEffect(()=>{
      const btn = document.getElementById('ovld_btn'); if(!btn) return;
      const act = ()=>{
        const load = parseFloat(document.getElementById('ovld_load').value||'0');
        const reps = parseFloat(document.getElementById('ovld_reps').value||'0');
        const rir = parseFloat(document.getElementById('ovld_rir').value||'2');
        const range = (document.getElementById('ovld_range').value||'8-12').split('-').map(x=>parseInt(x.trim())||0);
        const res = nextLoadSuggestion(load, range, reps, rir);
        const p = document.getElementById('ovld_out'); if(p){ p.textContent = `Next: ${res.nextLoad} (${res.deltaPct>=0?'+':''}${res.deltaPct}%)`; }
      };
      btn.addEventListener('click', act); return ()=> btn.removeEventListener('click', act);
    },[]);

  const { dayKey } = useParams()
  const days = useStore(s=>s.days)
  const mesoWeeks = useStore(s=>s.mesoWeeks)
  const includeDeload = useStore(s=>s.includeDeload)
  const priorities = useStore(s=>s.priorities)
  const exercisesByBucket = useStore(s=>s.exercisesByBucket)
  const programId = useStore(s=>s.programId)
  const currentWeek = useStore(s=>s.currentWeek)

  const split = useMemo(()=> buildSplit(days),[days])
  const dayIdx = Math.max(0, days.indexOf(dayKey))
  const weekTargetsArr = useMemo(()=> weeklyTargets(mesoWeeks, includeDeload, priorities, 0.25), [mesoWeeks, includeDeload, priorities])
  const todayTargets = distributeSets(weekTargetsArr[currentWeek-1] || weekTargetsArr[0], split)[dayIdx] || {}
  const bucket = split[dayIdx] || 'Full'
  const candidates = exercisesByBucket[bucket] || []

  const [sets, setSets] = useState([])
  function addSet(exName, muscle, repRange){
    setSets(prev => ([...prev, { exName, muscle, repRange, weight:0, reps:0, rir:2, note:'' }]))
  }
  function updateSet(i, patch){
    setSets(prev => { const c=[...prev]; c[i] = { ...c[i], ...patch }; return c })
  }

  async function saveOnline(payload){
    const { data, error } = await supabase.functions.invoke('log-session', { body: payload })
    if (error) throw error
    return data
  }

  async function save(){
    const payload = { program_id: programId, week_number: currentWeek, day: dayKey, sets }
    if (!navigator.onLine) {
      await enqueue({ type:'log-session', payload })
      alert('Saved offline. Will sync when online.')
      setSets([])
      return
    }
    try{
      await saveOnline(payload)
      // attempt to drain any queued
      await drain(async (item)=>{
        if(item.type==='log-session'){ await saveOnline(item.payload) }
      })
      alert('Saved')
      setSets([])
    }catch(e){
      await enqueue({ type:'log-session', payload })
      alert('Network issue. Saved offline — will sync later.')
    }
  }

  async function computeNextWeek(){
    const { data, error } = await supabase.functions.invoke('compute-next-week', {
      body: { program_id: programId, from_week: currentWeek }
    })
    if (error) { alert('Error: '+error.message); return }
    alert('Computed week '+ (currentWeek+1) +' targets. Switch week in Planner when ready.')
  }

  return (
    <div className="grid" style={{gap:16}}>
      <div className="card">
        <h2>Workout — {dayKey} ({bucket})</h2>
        <p className="muted">Targets today:</p>
        <div className="row">
          {Object.entries(todayTargets).map(([m,s])=> <div key={m} className="pill">{m}: {s} sets</div>)}
        </div>
      </div>

      <div className="card">
        <h3>Exercises</h3>
        <div className="row">
          {candidates.map((c,i)=> (
            <button key={i} className="chip" onClick={()=>addSet(c.name,c.muscle,c.repRange)}>{c.name}</button>
          ))}
        </div>
        <p className="muted">Click to add sets; each click creates a set row you can edit.</p>
      </div>

      <div className="card">
        <h3>Sets</h3>
        <table>
          <thead><tr><th>#</th><th>Exercise</th><th>Muscle</th><th>Weight</th><th>Reps</th><th>RIR</th><th>Note</th><th>Next Load</th></tr></thead>
          <tbody>
            {sets.map((s,i)=> {
              const sug = nextLoadSuggestion(Number(s.weight||0), s.repRange||[8,12], Number(s.reps||0), Number(s.rir||2))
              return (
                <tr key={i}>
                  <td>{i+1}</td>
                  <td>{s.exName}</td>
                  <td>{s.muscle}</td>
                  <td><input type="number" value={s.weight} onChange={e=>updateSet(i,{weight:e.target.value})} style={{width:90}}/></td>
                  <td><input type="number" value={s.reps} onChange={e=>updateSet(i,{reps:e.target.value})} style={{width:70}}/></td>
                  <td><input type="number" value={s.rir} onChange={e=>updateSet(i,{rir:e.target.value})} style={{width:60}}/></td>
                  <td><input value={s.note} onChange={e=>updateSet(i,{note:e.target.value})}/></td>
                  <td><span className="pill">{sug.nextLoad} ({sug.deltaPct>=0?'+':''}{sug.deltaPct}%)</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="row" style={{justifyContent:'space-between', marginTop:8}}>
          <button className="btn warn" onClick={()=>setSets([])}>Clear</button>
          <div className="row">
            <button className="btn secondary" onClick={computeNextWeek}>Compute Next Week</button>
            <button className="btn" onClick={save}>Save Session</button>
          </div>
        </div>
        <p className="muted">If offline, your session is queued and syncs when you reconnect.</p>
      </div>
    </div>
  )
}
