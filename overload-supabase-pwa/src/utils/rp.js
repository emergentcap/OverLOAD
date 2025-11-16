
export const MUSCLES = [ 'Chest','Back','Lats','Quads','Hamstrings','Glutes','Delts','Biceps','Triceps','Calves' ]
export const baseMEV = { Emphasize: 12, Grow: 10, Maintain: 6 }
export const baseMRV = { Emphasize: 20, Grow: 16, Maintain: 10 }
export function clamp(n,a,b){ return Math.max(a, Math.min(b, n)) }
export function buildSplit(days){
  const n = days.length
  if(n >= 6) return ['Push','Pull','Legs','Push','Pull','Legs']
  if(n === 5) return ['Upper','Lower','Push','Pull','Legs']
  if(n === 4) return ['Upper','Lower','Upper','Lower']
  if(n === 3) return ['Full','Full','Full']
  if(n === 2) return ['Full','Full']
  return ['Full']
}
const bucketMap = {
  'Push': ['Chest','Delts','Triceps'],
  'Pull': ['Back','Lats','Biceps','Delts'],
  'Legs': ['Quads','Hamstrings','Glutes','Calves'],
  'Upper': ['Chest','Back','Lats','Delts','Biceps','Triceps'],
  'Lower': ['Quads','Hamstrings','Glutes','Calves'],
  'Full': ['Chest','Back','Lats','Quads','Hamstrings','Glutes','Delts','Biceps','Triceps','Calves']
}
export function weeklyTargets(mesoWeeks, includeDeload, priorities, progressionRate){
  const out = []
  for(let w=1; w<=mesoWeeks; w++){
    const isDeload = includeDeload && (w===mesoWeeks)
    const target = {}
    MUSCLES.forEach(m=>{
      const mev = baseMEV[priorities[m]]
      const mrv = baseMRV[priorities[m]]
      if(isDeload){
        target[m] = Math.round(mev*0.5)
      }else{
        const span = mrv - mev
        const add = Math.round(span * clamp((w-1)*progressionRate,0,1))
        target[m] = clamp(mev + add, 0, mrv)
      }
    })
    out.push(target)
  }
  return out
}
export function distributeSets(targets, split){
  const perDay = split.map(()=>({}))
  MUSCLES.forEach(m=>{
    const total = targets[m] || 0
    const idx = split.map((b,i)=> bucketMap[b].includes(m)?i:null).filter(v=>v!==null)
    if(idx.length===0) return
    const per = Math.floor(total/idx.length)
    let rem = total - per*idx.length
    idx.forEach(i=>{
      perDay[i][m] = (perDay[i][m]||0) + per + (rem>0?1:0)
      if(rem>0) rem--
    })
  })
  return perDay
}
export function nextLoadSuggestion(currentLoad, repRange, achievedReps, achievedRIR){
  const [minR, maxR] = repRange
  let delta = 0
  if(achievedReps >= maxR && achievedRIR <= 1){ delta = +0.025 }
  else if(achievedReps >= minR && achievedRIR <= 2){ delta = +0.01 }
  else if(achievedReps < minR || achievedRIR >= 3){ delta = -0.02 }
  const next = Math.max(0, Math.round((currentLoad*(1+delta))*2)/2)
  return { deltaPct: Math.round(delta*1000)/10, nextLoad: next }
}
