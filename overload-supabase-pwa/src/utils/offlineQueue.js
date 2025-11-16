
import { set, get } from 'idb-keyval'

const KEY = 'offline_queue_v1'

export async function enqueue(item){
  const q = await get(KEY) || []
  q.push({ ...item, ts: Date.now() })
  await set(KEY, q)
}

export async function drain(processor){
  const q = await get(KEY) || []
  const remaining = []
  for(const item of q){
    try { await processor(item) } catch(e){ remaining.push(item) }
  }
  await set(KEY, remaining)
  return { sent: q.length - remaining.length, pending: remaining.length }
}
