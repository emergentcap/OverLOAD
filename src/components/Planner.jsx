
import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore, actions } from '../state/store'
import { MUSCLES, weeklyTargets, distributeSets, buildSplit } from '../utils/rp'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const DAYS = ['Sat','Sun','Mon','Tue','Wed','Thu','Fri']

export default function Planner(){
  const days = useStore(s=>s.days)
  const mesoWeeks = useStore(s=>s.mesoWeeks)
  const includeDeload = useStore(s=>s.includeDeload)
  const priorities = useStore(s=>s.priorities)
  const [progressionRate, setRate] = useState(0.25)
  const programId = useStore(s=>s.programId)

  const split = useMemo(()=> buildSplit(days),[days])
  const weekly = useMemo(()=> weeklyTargets(mesoWeeks, includeDeload, priorities, progressionRate), [mesoWeeks, includeDeload, priorities, progressionRate])
  const chartData = useMemo(()=> weekly.map((wk,i)=>({week:`W${i+1}`, Chest:wk.Chest, Back:wk.Back, Quads:wk.Quads, Delts:wk.Delts})),[weekly])
  const w1 = weekly[0] || {}
  const dist = useMemo(()=> distributeSets(w1, split), [w1, split])

  async function saveProgram(){
    const pid = await actions.saveProgram()
    await actions.saveWeekTargets(w1, includeDeload && mesoWeeks===1)
    alert('Program saved to cloud' + (pid? ` (id: ${pid})` : ''))
  }

  return (
    <div className="grid" style={{gap:16}}>
      <div className="card">
        <h2>Setup</h2>
        <div className="row">
          <div className="card" style={{flex:1, minWidth:280}}>
            <h3>Days</h3>
            <div className="row">
              {DAYS.map(d=>{
                const active = days.includes(d)
                return <div key={d} className={`chip ${active?'active':''}`} onClick={()=>{
                  const next = active? days.filter(x=>x!==d) : [...days,d].sort((a,b)=>DAYS.indexOf(a)-DAYS.indexOf(b))
                  actions.setDays(next)
                }}>{d}</div>
              })}
            </div>
            <p className="muted">Split → {split.join(' / ')}</p>
          </div>
          <div className="card" style={{flex:1, minWidth:280}}>
            <h3>Mesocycle</h3>
            <div className="row">
              <div className="field" style={{minWidth:120}}>
                <label>Weeks</label>
                <input type="number" min="4" max="8" value={mesoWeeks} onChange={e=>actions.setMesoWeeks(Math.max(4,Math.min(8,parseInt(e.target.value||'5'))))} />
              </div>
              <div className="field" style={{minWidth:180}}>
                <label>Deload last week?</label>
                <select value={includeDeload?'yes':'no'} onChange={e=>actions.setIncludeDeload(e.target.value==='yes')}>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              <div className="field" style={{minWidth:200}}>
                <label>Progression Rate</label>
                <select value={String(progressionRate)} onChange={e=>setRate(parseFloat(e.target.value))}>
                  <option value="0.2">Conservative (20%)</option>
                  <option value="0.25">Standard (25%)</option>
                  <option value="0.33">Aggressive (33%)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="row" style={{justifyContent:'space-between', marginTop:8}}>
          <button className="btn" onClick={saveProgram}>{programId? 'Update Program' : 'Save Program to Cloud'}</button>
          <span className="muted">{programId? `Program ID: ${programId}` : 'Not saved yet'}</span>
        </div>
      </div>

      <div className="card">
        <h3>Muscle Priorities</h3>
        <div className="grid three">
          {MUSCLES.map(m => (
            <div key={m} className="card" style={{padding:12}}>
              <div className="row" style={{justifyContent:'space-between'}}>
                <span>{m}</span>
                <span className="pill">{priorities[m]}</span>
              </div>
              <div className="row">
                {['Emphasize','Grow','Maintain'].map(p=> (
                  <button key={p} className={`chip ${priorities[m]===p?'active':''}`} onClick={()=>actions.setPriorities({...priorities, [m]:p})}>{p}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>Weekly Sets Ramp (examples)</h3>
        <div style={{height:260}}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="week" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Chest" />
              <Line type="monotone" dataKey="Back" />
              <Line type="monotone" dataKey="Quads" />
              <Line type="monotone" dataKey="Delts" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3>Week 1 — Day allocations</h3>
        <div className="grid two">
          {dist.map((day,i)=> (
            <div key={i} className="card">
              <div className="row" style={{justifyContent:'space-between'}}>
                <strong>{days[i] || `Day ${i+1}`}</strong>
                <Link to={`/workout/${days[i] || `Day${i+1}`}`} className="btn">Open Workout</Link>
              </div>
              <table>
                <thead><tr><th>Muscle</th><th>Sets</th></tr></thead>
                <tbody>
                  {Object.entries(day).map(([m,sets]) => <tr key={m}><td>{m}</td><td>{sets}</td></tr>)}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
