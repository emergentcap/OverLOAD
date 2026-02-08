
import { useSyncExternalStore } from 'react'
import { supabase } from '../lib/supabaseClient'

const DEFAULTS = {
  days: ['Sat','Sun','Mon','Tue','Wed','Fri'],
  mesoWeeks: 5,
  includeDeload: true,
  priorities: {
    Chest:'Grow', Back:'Grow', Lats:'Grow', Quads:'Grow', Hamstrings:'Grow',
    Glutes:'Grow', Delts:'Grow', Biceps:'Grow', Triceps:'Grow', Calves:'Grow'
  },
  exercisesByBucket: {
    Push: [
      { name:'Incline Bench Press', muscle:'Chest', repRange:[6,10] },
      { name:'Press (Machine/DB)', muscle:'Chest', repRange:[8,12] },
      { name:'Cable Fly / Pec Deck', muscle:'Chest', repRange:[10,12], isolation:true },
      { name:'Lateral Raise', muscle:'Delts', repRange:[10,15], isolation:true },
      { name:'Triceps Pushdown', muscle:'Triceps', repRange:[8,12], isolation:true },
      { name:'Overhead Triceps Ext', muscle:'Triceps', repRange:[10,12], isolation:true }
    ],
    Pull: [
      { name:'Row (BB/Chest-Supported)', muscle:'Back', repRange:[6,10] },
      { name:'Lat Pulldown/Chins', muscle:'Lats', repRange:[6,10] },
      { name:'Machine Row', muscle:'Back', repRange:[8,12] },
      { name:'Incline DB Curl', muscle:'Biceps', repRange:[8,12], isolation:true },
      { name:'Hammer Curl', muscle:'Biceps', repRange:[8,12], isolation:true }
    ],
    Legs: [
      { name:'Hack Squat', muscle:'Quads', repRange:[6,10] },
      { name:'RDL / Stiff-Leg DL', muscle:'Hamstrings', repRange:[6,10] },
      { name:'Single-Leg Press', muscle:'Quads', repRange:[8,12] },
      { name:'Leg Extension', muscle:'Quads', repRange:[10,12], isolation:true },
      { name:'Seated Leg Curl', muscle:'Hamstrings', repRange:[8,12], isolation:true },
      { name:'Standing Calf Raise', muscle:'Calves', repRange:[8,12], isolation:true }
    ]
  },
  programId: null,
  currentWeek: 1
}

const subscribers = new Set()
let state = load()

function load(){
  try{
    const raw = localStorage.getItem('rp_hyp_cloud_store')
    if(!raw) return DEFAULTS
    const obj = JSON.parse(raw)
    return { ...DEFAULTS, ...obj }
  }catch(e){ return DEFAULTS }
}
function save(){ localStorage.setItem('rp_hyp_cloud_store', JSON.stringify(state)) }
function set(partial){ state = { ...state, ...partial }; save(); subscribers.forEach(cb=>cb()) }

export function useStore(selector){
  return useSyncExternalStore(
    (cb)=>{ subscribers.add(cb); return ()=>subscribers.delete(cb)},
    ()=> selector? selector(state) : state,
    ()=> selector? selector(state) : state
  )
}

// Cloud helpers
async function ensureProgram(userId){
  const name = 'Default Program'
  // upsert program
  const { data: existing } = await supabase.from('programs').select('id').eq('user_id', userId).eq('name', name).maybeSingle()
  if (existing?.id) return existing.id
  const { data, error } = await supabase.from('programs').insert({
    user_id: userId,
    name,
    start_date: new Date().toISOString().slice(0,10),
    meso_weeks: state.mesoWeeks,
    include_deload: state.includeDeload,
    priorities: state.priorities
  }).select('id').single()
  if (error) throw error
  return data.id
}

async function upsertWeek(programId, weekNumber, targets, deload){
  const { error } = await supabase.from('weeks').upsert({
    program_id: programId, week_number: weekNumber, targets, deload
  })
  if (error) throw error
}

export const actions = {
  setDays: (days)=> set({ days }),
  setMesoWeeks: (n)=> set({ mesoWeeks: n }),
  setIncludeDeload: (v)=> set({ includeDeload: v }),
  setPriorities: (p)=> set({ priorities: p }),
  setCurrentWeek: (w)=> set({ currentWeek: w }),

  // Save program + initial week targets to Supabase
  saveProgram: async ()=>{
    const { data: { user } } = await supabase.auth.getUser()
    if(!user) throw new Error('Not signed in')
    const pid = await ensureProgram(user.id)
    set({ programId: pid })
    return pid
  },

  saveWeekTargets: async (targets, deload=false)=>{
    if(!state.programId){
      const { data: { user } } = await supabase.auth.getUser()
      const pid = await ensureProgram(user.id)
      set({ programId: pid })
    }
    await upsertWeek(state.programId, state.currentWeek, targets, deload)
  }
}
