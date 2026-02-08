
import React, { useState } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Planner from './components/Planner'
import Workout from './components/Workout'
import Progress from './components/Progress'
  import Help from './components/Help'
import { useAuth, signInWithEmail, signOut, signInWithOAuth } from './state/auth'

function Navbar(){
  const nav = useNavigate()
  return (
    <div className="container">
      <div className="row" style={{justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
        <Link to="/" style={{fontWeight:800, fontSize:18}}>OVERLOAD</Link>
        <div className="row">
          <Link to="/progress" className="btn secondary">Progress</Link>
          <button className="btn secondary" onClick={()=>nav('/')}>Planner</button>
        </div>
      </div>
    </div>
  )
}

function Login(){
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  async function handle(){
    await signInWithEmail(email)
    setSent(true)
  }
  return (
    <div className="container">
      <div className="card" style={{maxWidth:520, margin:'40px auto'}}>
        <h2>Sign in</h2>
        <p className="muted">Enter your email to receive a magic link.</p>
        <div className="field">
          <label>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="row" style={{marginTop:12}}>
          <button className="btn" onClick={handle}>Send magic link</button>
        </div>
        {sent && <p className="muted">Check your email for the link.</p>}
      </div>
    </div>
  )
}

export default function App(){
  const { user, loading } = useAuth()

  if (loading) return <div className="container"><p>Loading...</p></div>
  if (!user) return <Login />

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="row" style={{justifyContent:'space-between', marginBottom:8}}>
          <span className="muted">Signed in as {user.email}</span>
          <button className="btn secondary" onClick={signOut}>Sign out</button>
        </div>
        <Routes>
          <Route path="/" element={<Planner />} />
          <Route path="/workout/:dayKey" element={<Workout />} />
          <Route path="/progress" element={<Progress />} />
            <Route path="/help" element={<Help />} />
        </Routes>
      </div>
    </>
  )
}
