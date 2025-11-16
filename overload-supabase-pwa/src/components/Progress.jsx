
import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Progress(){
  const [data, setData] = useState([])

  useEffect(()=>{
    (async ()=>{
      // naive: fetch recent sessions and sets, compute per-day avg RIR & load
      const { data: sessions } = await supabase.from('sessions').select('id, day, started_at').order('started_at', { ascending: true }).limit(100)
      if(!sessions?.length){ setData([]); return }
      const ids = sessions.map(s=>s.id)
      const { data: sets } = await supabase.from('sets').select('session_id, weight, rir')
      const bySession = {}
      sets?.forEach(x=>{
        if(!bySession[x.session_id]) bySession[x.session_id] = []
        bySession[x.session_id].push(x)
      })
      const points = sessions.map(s=>{
        const arr = bySession[s.id] || []
        const avgRIR = arr.length? arr.reduce((a,b)=>a+Number(b.rir||0),0)/arr.length : 0
        const avgLoad = arr.length? arr.reduce((a,b)=>a+Number(b.weight||0),0)/arr.length : 0
        const label = new Date(s.started_at).toLocaleDateString() + ' ' + s.day
        return { label, avgRIR: Number(avgRIR.toFixed(2)), avgLoad: Number(avgLoad.toFixed(1)) }
      })
      setData(points)
    })()
  }, [])

  return (
    <div className="grid" style={{gap:16}}>
      <div className="card">
        <h2>Progress & Trends</h2>
        <p className="muted">Pulls from your cloud sessions; charts avg RIR and avg load.</p>
      </div>
      <div className="card" style={{height:320}}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="avgRIR" name="Avg RIR" />
            <Line type="monotone" dataKey="avgLoad" name="Avg Load" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <h3>Raw</h3>
        <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(data,null,2)}</pre>
      </div>
    </div>
  )
}
