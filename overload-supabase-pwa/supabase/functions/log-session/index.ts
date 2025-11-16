
// supabase/functions/log-session/index.ts
// Deno runtime Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization")! } }
    });

    const { program_id, week_number, day, sets } = await req.json();

    if (!program_id || !week_number || !day || !Array.isArray(sets)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
    }

    const { data: session, error: sErr } = await supabase
      .from("sessions")
      .insert({ program_id, week_number, day })
      .select()
      .single();
    if (sErr) throw sErr;

    if (sets.length) {
      const rows = sets.map((x: any) => ({
        session_id: session.id,
        exercise: x.exName || x.exercise,
        muscle: x.muscle,
        weight: x.weight,
        reps: x.reps,
        rir: x.rir,
        notes: x.note || ""
      }));
      const { error: setErr } = await supabase.from("sets").insert(rows);
      if (setErr) throw setErr;
    }

    return new Response(JSON.stringify({ ok: true, session_id: session.id }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message || String(e) }), { status: 500 });
  }
});
