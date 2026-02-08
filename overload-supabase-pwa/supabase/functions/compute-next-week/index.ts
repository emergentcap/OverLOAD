
// supabase/functions/compute-next-week/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MUSCLES = ['Chest','Back','Lats','Quads','Hamstrings','Glutes','Delts','Biceps','Triceps','Calves'];
const baseMEV = { Emphasize: 12, Grow: 10, Maintain: 6 } as any;
const baseMRV = { Emphasize: 20, Grow: 16, Maintain: 10 } as any;

serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } }
    });

    const { program_id, from_week } = await req.json();
    if (!program_id || !from_week) {
      return new Response(JSON.stringify({ error: "program_id and from_week required" }), { status: 400 });
    }

    // Get program to read priorities, meso_weeks, include_deload
    const { data: program, error: pErr } = await supabase.from("programs").select("*").eq("id", program_id).single();
    if (pErr) throw pErr;

    const to_week = Number(from_week) + 1;
    const isDeload = program.include_deload && (to_week === program.meso_weeks);

    // Get last week targets
    const { data: lastWeek, error: wErr } = await supabase.from("weeks")
      .select("*").eq("program_id", program_id).eq("week_number", from_week).single();
    if (wErr) throw wErr;

    // Aggregate average RIR per muscle for from_week
    const { data: sessions, error: sErr } = await supabase
      .from("sessions").select("id").eq("program_id", program_id).eq("week_number", from_week);
    if (sErr) throw sErr;
    const sessionIds = sessions.map((s:any)=>s.id);
    let avgRIR: Record<string, number> = {};
    if (sessionIds.length) {
      const { data: sets, error: setErr } = await supabase
        .from("sets").select("muscle, rir").in("session_id", sessionIds);
      if (setErr) throw setErr;
      const sum: Record<string, number> = {}, cnt: Record<string, number> = {};
      sets.forEach((x:any)=>{
        if(!x.muscle) return;
        sum[x.muscle] = (sum[x.muscle]||0) + (Number(x.rir)||0);
        cnt[x.muscle] = (cnt[x.muscle]||0) + 1;
      });
      MUSCLES.forEach(m=>{
        avgRIR[m] = cnt[m]? (sum[m]/cnt[m]) : 2; // default mid RIR
      });
    } else {
      MUSCLES.forEach(m=> avgRIR[m] = 2);
    }

    // Compute new targets
    const priorities = program.priorities || {};
    const nextTargets: Record<string, number> = {};
    const lastTargets = lastWeek.targets || {};
    MUSCLES.forEach(m => {
      const mev = baseMEV[priorities[m] || 'Grow'];
      const mrv = baseMRV[priorities[m] || 'Grow'];
      let t = Number(lastTargets[m] || mev);
      if (isDeload) {
        t = Math.round(mev * 0.5);
      } else {
        const r = avgRIR[m];
        if (r >= 3) t += 2;      // plenty in the tank → add more
        else if (r >= 1.5) t += 1; // moderate → small bump
        else if (r <= 1) t = Math.max(mev, t); // close to failure → hold
        // cap within [mev, mrv]
        if (t < mev) t = mev;
        if (t > mrv) t = mrv;
      }
      nextTargets[m] = t;
    });

    // Upsert next week
    const { data: up, error: uErr } = await supabase.from("weeks").upsert({
      program_id, week_number: to_week, targets: nextTargets, deload: isDeload
    }).select("*").single();
    if (uErr) throw uErr;

    // audit adjustments
    await supabase.from("adjustments").insert({
      program_id, from_week, to_week, rules: { avgRIR, isDeload }
    });

    return new Response(JSON.stringify({ ok:true, week: up }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || String(e) }), { status: 500 });
  }
});
