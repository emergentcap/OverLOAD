
import React from 'react'

export default function Help(){
  return (
    <div className="grid" style={{gap:16}}>
      <div className="card">
        <h2>OVERLOAD — How it works</h2>
        <p className="muted">
          OVERLOAD is a hypertrophy planner/logger inspired by Renaissance Periodization (RP). It ramps weekly training volume
          from <em>MEV</em> (minimum effective) toward <em>MRV</em> (maximum recoverable), guides <em>progressive overload</em> set by set using
          your logged <em>RIR</em>, and supports planned deloads to drop fatigue.
        </p>
      </div>

      <div className="card">
        <h3>Pages</h3>
        <ul>
          <li><strong>Planner:</strong> pick training days, mesocycle weeks, deload, and muscle priorities (Emphasize/Grow/Maintain). Save creates your program + Week 1 targets.</li>
          <li><strong>Workout:</strong> per-day log for weight/reps/RIR. The app suggests next load based on your outcome. You can also compute next week’s targets.</li>
          <li><strong>Progress:</strong> quick trends of Avg RIR and Avg Load over time to sanity-check your mesocycle.</li>
        </ul>
      </div>

      <div className="card">
        <h3>Methods (concise)</h3>
        <ul>
          <li><strong>Volume landmarks:</strong> Start near MEV; ramp toward MRV across the meso; final week deload ~50% MEV (optional).</li>
          <li><strong>RIR targets:</strong> Most sets at 1–2 RIR for compounds; use 0–1 RIR occasionally for last isolation set.</li>
          <li><strong>Double progression:</strong> Add reps inside the range first; when you reach the top with ≤1 RIR, add small load next time.</li>
          <li><strong>Load suggestions:</strong> Top-of-range &amp; ≤1 RIR → +2.5%; in-range &amp; ≤2 RIR → +1%; below-range or ≥3 RIR → −2% (rounded to nearest 0.5).</li>
          <li><strong>Lengthened partials:</strong> Optional finisher for safe isolation moves (laterals, curls, pushdowns, flies). Avoid on risky compounds.</li>
        </ul>
      </div>

      <div className="card">
        <h3>Progressive Overload — what to expect</h3>
        <ul>
          <li><strong>Weekly sets:</strong> Emphasize muscles trend higher (MEV→MRV); Maintain muscles hold lower. Expect +1–2 sets/week when avg RIR ≥ 2.</li>
          <li><strong>Loads:</strong> Small, frequent jumps beat big leaps. Many lifters see +1% to +2.5% in top sets when performance is at/near the rep cap with ≤1–2 RIR.</li>
          <li><strong>Deload:</strong> Planned performance dip; come back week 1 slightly below pre-deload loads and rebuild quickly.</li>
        </ul>
      </div>

      <div className="card">
        <h3>Offline, accounts, and security</h3>
        <ul>
          <li><strong>PWA:</strong> Install to your phone; logs queue offline and sync automatically when online.</li>
          <li><strong>Sign-in:</strong> Supabase Auth with magic links (and optional OAuth).</li>
          <li><strong>Data isolation:</strong> Row-Level Security ensures each user sees only their data.</li>
        </ul>
      </div>

      <div className="card">
        <h3>FAQ</h3>
        <p><strong>Q:</strong> Can I change the split mid-meso?<br/><strong>A:</strong> Yes — adjust days in Planner; save to cloud; recompute next week when needed.</p>
        <p><strong>Q:</strong> How do I track warm-ups?<br/><strong>A:</strong> Log only working sets if you like; the warm-up guidance is shown but not required for logging.</p>
        <p><strong>Q:</strong> What if I fail early?<br/><strong>A:</strong> Enter your actual reps/RIR; the next load suggestion will reduce weight (−2%) and you can hold sets constant.</p>
      </div>
    </div>
  )
}
