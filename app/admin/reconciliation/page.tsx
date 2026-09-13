'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Lang = 'fr' | 'ht'
type CaseStatus = 'new' | 'reviewing' | 'resolved'
type Row = {
  anomaly_key: string
  severity: 'critical' | 'high' | 'medium' | string
  payment_id: string | null
  payout_id: string | null
  ride_id: string | null
  driver_id: string | null
  payment_status: string | null
  payout_status: string | null
  gross_htg: number | string | null
  platform_fee_htg: number | string | null
  expected_platform_fee_htg: number | string | null
  driver_net_htg: number | string | null
  expected_driver_net_htg: number | string | null
  payout_amount_htg: number | string | null
  provider: string | null
  payout_reference: string | null
  created_at: string | null
  details: string
  case?: AnomalyCase | null
}
type AnomalyCase = {
  id: string
  anomaly_fingerprint: string
  anomaly_key: string
  payment_id: string | null
  payout_id: string | null
  ride_id: string | null
  status: CaseStatus
  assigned_admin_id: string | null
  admin_note: string | null
  resolution_reason: string | null
  assigned_at: string | null
  resolved_at: string | null
  updated_at: string
}
type Action = { id: string; case_id: string; actor_admin_id: string | null; action_type: string; note: string | null; created_at: string }

const labels = {
  fr: {
    title:'Réconciliation financière', subtitle:'Vérifiez que paiements, commission plateforme et versements chauffeurs correspondent', back:'Tableau de bord', loading:'Analyse en cours…', empty:'Aucune anomalie détectée.', denied:'Accès réservé aux administrateurs.', refresh:'Actualiser', search:'Rechercher une anomalie, une référence ou un trajet…', all:'Toutes', open:'Ouvertes', resolvedOnly:'Résolues', gross:'Brut', fee:'Commission 15 %', net:'Net chauffeur 85 %', payout:'Versement', statuses:'Statuts', reference:'Référence', provider:'Fournisseur', new:'Nouveau', reviewing:'En révision', resolved:'Résolu', take:'Prendre le dossier', note:'Note admin', saveNote:'Enregistrer la note', resolve:'Résoudre', reopen:'Rouvrir', resolution:'Raison de résolution', timeline:'Historique', noTimeline:'Aucune action enregistrée.', total:'Anomalies', critical:'Critiques', high:'Élevées', medium:'Moyennes', openCases:'À traiter', missing_payout:'Versement chauffeur manquant', platform_fee_mismatch:'Commission 15 % incorrecte', driver_net_mismatch:'Net chauffeur 85 % incorrect', payout_amount_mismatch:'Montant du versement incorrect', paid_payout_missing_proof:'Versement payé sans preuve complète', stale_payout:'Versement en attente depuis plus de 24 h'
  },
  ht: {
    title:'Rekonsilyasyon finansye', subtitle:'Verifye peman kliyan, komisyon platfòm ak payout chofè yo mache ansanm', back:'Dashboard Admin', loading:'N ap analize…', empty:'Pa gen okenn anomali finansye detekte.', denied:'Se administratè sèlman ki gen aksè.', refresh:'Rafrechi', search:'Chèche anomali, referans oswa trajè…', all:'Tout', open:'Pou trete', resolvedOnly:'Rezoud', gross:'Brit', fee:'Komisyon 15%', net:'Net chofè 85%', payout:'Payout', statuses:'Estati', reference:'Referans', provider:'Founisè', new:'Nouvo', reviewing:'An revizyon', resolved:'Rezoud', take:'Pran dosye a', note:'Nòt admin', saveNote:'Anrejistre nòt', resolve:'Rezoud', reopen:'Relouvri', resolution:'Rezon rezolisyon', timeline:'Istorik', noTimeline:'Pa gen aksyon anrejistre.', total:'Anomali', critical:'Kritik', high:'Wo', medium:'Mwayen', openCases:'Pou trete', missing_payout:'Payout chofè manke', platform_fee_mismatch:'Komisyon 15% pa kòrèk', driver_net_mismatch:'Net chofè 85% pa kòrèk', payout_amount_mismatch:'Montan payout la pa kòrèk', paid_payout_missing_proof:'Payout make peye san prèv konplè', stale_payout:'Payout ap tann plis pase 24 èdtan'
  }
}

export default function AdminReconciliationPage(){
  const [lang,setLang]=useState<Lang>('fr')
  const [authorized,setAuthorized]=useState<boolean|null>(null)
  const [rows,setRows]=useState<Row[]>([])
  const [loading,setLoading]=useState(true)
  const [message,setMessage]=useState('')
  const [adminId,setAdminId]=useState<string|null>(null)
  const [notes,setNotes]=useState<Record<string,string>>({})
  const [resolutions,setResolutions]=useState<Record<string,string>>({})
  const [timeline,setTimeline]=useState<Record<string,Action[]>>({})
  const [openTimeline,setOpenTimeline]=useState<string|null>(null)
  const [busyId,setBusyId]=useState<string|null>(null)
  const [query,setQuery]=useState('')
  const [filter,setFilter]=useState<'all'|'open'|'resolved'>('all')
  const t=labels[lang]

  useEffect(()=>{ const saved=localStorage.getItem('taxi-language') as Lang|null; if(saved==='fr'||saved==='ht')setLang(saved); void init() },[])
  useEffect(()=>{ if(!authorized)return; const channel=supabase.channel('admin-financial-reconciliation-live')
    .on('postgres_changes',{event:'*',schema:'public',table:'payments'},()=>void load(false))
    .on('postgres_changes',{event:'*',schema:'public',table:'driver_payouts'},()=>void load(false))
    .on('postgres_changes',{event:'*',schema:'public',table:'financial_anomaly_cases'},()=>void load(false)).subscribe();
    return()=>{void supabase.removeChannel(channel)} },[authorized])

  const fingerprint=(r:Row)=>`${r.anomaly_key}:${r.payment_id??'none'}:${r.payout_id??'none'}`

  async function init(){
    const {data:auth}=await supabase.auth.getUser()
    if(!auth.user){setAuthorized(false);setLoading(false);return}
    const {data:me}=await supabase.from('profiles').select('role').eq('id',auth.user.id).maybeSingle()
    if(me?.role!=='admin'){setAuthorized(false);setLoading(false);return}
    setAdminId(auth.user.id);setAuthorized(true);await load()
  }

  async function load(showLoading=true){
    if(showLoading)setLoading(true);setMessage('')
    const {data,error}=await supabase.rpc('get_admin_financial_reconciliation')
    if(error){setMessage(error.message);if(showLoading)setLoading(false);return}
    const anomalies=(data??[]) as Row[]
    const {data:existing}=await supabase.from('financial_anomaly_cases').select('*')
    const caseMap=new Map((existing??[]).map((c:any)=>[c.anomaly_fingerprint,c as AnomalyCase]))
    const missing=anomalies.filter(r=>!caseMap.has(fingerprint(r))).map(r=>({anomaly_fingerprint:fingerprint(r),anomaly_key:r.anomaly_key,payment_id:r.payment_id,payout_id:r.payout_id,ride_id:r.ride_id}))
    if(missing.length){const {error:insertError}=await supabase.from('financial_anomaly_cases').insert(missing);if(insertError)setMessage(insertError.message)}
    const {data:refreshed}=await supabase.from('financial_anomaly_cases').select('*')
    const refreshedMap=new Map((refreshed??[]).map((c:any)=>[c.anomaly_fingerprint,c as AnomalyCase]))
    setRows(anomalies.map(r=>({...r,case:refreshedMap.get(fingerprint(r))??null})))
    const nextNotes:Record<string,string>={},nextRes:Record<string,string>={}
    for(const c of (refreshed??[]) as AnomalyCase[]){nextNotes[c.id]=c.admin_note??'';nextRes[c.id]=c.resolution_reason??''}
    setNotes(nextNotes);setResolutions(nextRes);if(showLoading)setLoading(false)
  }

  async function log(caseId:string,actionType:string,note?:string){await supabase.from('financial_anomaly_actions').insert({case_id:caseId,actor_admin_id:adminId,action_type:actionType,note:note||null})}
  async function take(c:AnomalyCase){if(!adminId)return;setBusyId(c.id);const {error}=await supabase.from('financial_anomaly_cases').update({status:'reviewing',assigned_admin_id:adminId,assigned_at:new Date().toISOString()}).eq('id',c.id);if(!error)await log(c.id,'taken');else setMessage(error.message);await load(false);setBusyId(null)}
  async function saveNote(c:AnomalyCase){setBusyId(c.id);const note=notes[c.id]?.trim()||'';const {error}=await supabase.from('financial_anomaly_cases').update({admin_note:note||null}).eq('id',c.id);if(!error)await log(c.id,'note_saved',note);else setMessage(error.message);await load(false);setBusyId(null)}
  async function resolve(c:AnomalyCase){if(!adminId)return;const reason=resolutions[c.id]?.trim()||'';if(!reason){setMessage(lang==='ht'?'Mete rezon rezolisyon an anvan.':'Ajoutez la raison de résolution.');return}setBusyId(c.id);const {error}=await supabase.from('financial_anomaly_cases').update({status:'resolved',assigned_admin_id:c.assigned_admin_id||adminId,resolution_reason:reason,resolved_at:new Date().toISOString()}).eq('id',c.id);if(!error)await log(c.id,'resolved',reason);else setMessage(error.message);await load(false);setBusyId(null)}
  async function reopen(c:AnomalyCase){setBusyId(c.id);const {error}=await supabase.from('financial_anomaly_cases').update({status:'reviewing',resolved_at:null}).eq('id',c.id);if(!error)await log(c.id,'reopened');else setMessage(error.message);await load(false);setBusyId(null)}
  async function toggleTimeline(c:AnomalyCase){if(openTimeline===c.id){setOpenTimeline(null);return}const {data}=await supabase.from('financial_anomaly_actions').select('id,case_id,actor_admin_id,action_type,note,created_at').eq('case_id',c.id).order('created_at',{ascending:false});setTimeline(v=>({...v,[c.id]:(data??[]) as Action[]}));setOpenTimeline(c.id)}

  const counts=useMemo(()=>({critical:rows.filter(r=>r.severity==='critical').length,high:rows.filter(r=>r.severity==='high').length,medium:rows.filter(r=>r.severity==='medium').length,open:rows.filter(r=>r.case?.status!=='resolved').length}),[rows])
  const visible=useMemo(()=>{const q=query.trim().toLowerCase();return rows.filter(r=>{const status=r.case?.status??'new';if(filter==='open'&&status==='resolved')return false;if(filter==='resolved'&&status!=='resolved')return false;if(!q)return true;return [r.anomaly_key,r.details,r.payment_id,r.payout_id,r.ride_id,r.provider,r.payout_reference].some(v=>String(v??'').toLowerCase().includes(q))})},[rows,query,filter])
  const money=(v:number|string|null)=>`${Number(v??0).toLocaleString('fr-HT',{maximumFractionDigits:2})} HTG`
  const anomalyLabel=(key:string)=>(t as any)[key]??key
  const statusLabel=(s?:CaseStatus)=>s?(t as any)[s]:t.new
  const changeLang=(v:Lang)=>{setLang(v);localStorage.setItem('taxi-language',v)}

  if(authorized===null)return <main className="page"><section className="card"><p>{t.loading}</p></section></main>
  if(!authorized)return <main className="page"><section className="card"><h1>{t.title}</h1><p>{t.denied}</p><button onClick={()=>location.href='/admin/login'}>Admin login</button></section></main>

  return <main className="page"><section className="card">
    <div className="top"><button onClick={()=>location.href='/admin'}>‹ {t.back}</button><div className="topRight"><span className="live">● LIVE</span><select value={lang} onChange={e=>changeLang(e.target.value as Lang)}><option value="fr">Français</option><option value="ht">Kreyòl</option></select></div></div>
    <div className="brand"><span>R</span><div><strong>Taxi Platform Haiti</strong><small>{t.subtitle}</small></div></div>
    <h1>{t.title}</h1>

    <div className="stats"><div><small>{t.total}</small><strong>{rows.length}</strong></div><div className="critical"><small>{t.critical}</small><strong>{counts.critical}</strong></div><div className="high"><small>{t.high}</small><strong>{counts.high}</strong></div><div className="open"><small>{t.openCases}</small><strong>{counts.open}</strong></div></div>

    <div className="tools"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={t.search}/><div className="filters"><button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>{t.all}</button><button className={filter==='open'?'active':''} onClick={()=>setFilter('open')}>{t.open}</button><button className={filter==='resolved'?'active':''} onClick={()=>setFilter('resolved')}>{t.resolvedOnly}</button><button className="refresh" onClick={()=>void load()}>↻ {t.refresh}</button></div></div>

    {message&&<div className="message">{message}</div>}
    {loading?<div className="empty">{t.loading}</div>:visible.length===0?<div className="empty">✅ {t.empty}</div>:<div className="list">{visible.map((r,i)=>{const c=r.case;return <article className={`issue ${r.severity}`} key={`${r.anomaly_key}-${r.payment_id}-${r.payout_id}-${i}`}>
      <div className="issueHead"><div><span className="severity">{String(r.severity).toUpperCase()}</span><strong>{anomalyLabel(r.anomaly_key)}</strong></div><span className={`caseStatus ${c?.status||'new'}`}>{statusLabel(c?.status)}</span></div>
      <p>{r.details}</p>
      <div className="grid"><div><small>{t.gross}</small><strong>{money(r.gross_htg)}</strong></div><div><small>{t.fee}</small><strong>{money(r.platform_fee_htg)}</strong><em>{money(r.expected_platform_fee_htg)}</em></div><div><small>{t.net}</small><strong>{money(r.driver_net_htg)}</strong><em>{money(r.expected_driver_net_htg)}</em></div><div><small>{t.payout}</small><strong>{money(r.payout_amount_htg)}</strong></div></div>
      <div className="meta"><span><b>{t.statuses}:</b> {r.payment_status||'—'} → {r.payout_status||'—'}</span><span><b>{t.provider}:</b> {r.provider||'—'}</span><span><b>{t.reference}:</b> {r.payout_reference||'—'}</span></div>
      {c&&<div className="workflow">
        {c.status==='new'&&<button className="take" onClick={()=>void take(c)} disabled={busyId===c.id}>{t.take}</button>}
        <label>{t.note}<textarea value={notes[c.id]??''} onChange={e=>setNotes(v=>({...v,[c.id]:e.target.value}))}/></label>
        <button onClick={()=>void saveNote(c)} disabled={busyId===c.id}>{t.saveNote}</button>
        {c.status!=='resolved'?<><label>{t.resolution}<input value={resolutions[c.id]??''} onChange={e=>setResolutions(v=>({...v,[c.id]:e.target.value}))}/></label><button className="resolve" onClick={()=>void resolve(c)} disabled={busyId===c.id}>{t.resolve}</button></>:<button className="reopen" onClick={()=>void reopen(c)} disabled={busyId===c.id}>{t.reopen}</button>}
        <button className="timelineBtn" onClick={()=>void toggleTimeline(c)}>{t.timeline}</button>
        {openTimeline===c.id&&<div className="timeline">{(timeline[c.id]??[]).length?(timeline[c.id]??[]).map(a=><div key={a.id}><strong>{a.action_type}</strong><small>{new Date(a.created_at).toLocaleString()}</small>{a.note&&<p>{a.note}</p>}</div>):<span>{t.noTimeline}</span>}</div>}
      </div>}
    </article>})}</div>}
  </section>
  <style jsx>{`
    .page{min-height:100vh;background:linear-gradient(160deg,#edf6f2,#eef3f8 48%,#e8edf4);padding:24px;color:#102033;font-family:Inter,system-ui,sans-serif}.card{width:min(100%,980px);margin:auto;background:#fff;border-radius:28px;padding:24px;box-shadow:0 24px 70px rgba(18,36,61,.14);box-sizing:border-box}.top{display:flex;justify-content:space-between;gap:12px}.top>button{border:0;background:none;color:#0f6f59;font-weight:900}.topRight{display:flex;align-items:center;gap:8px}.top select{border:1px solid #d8e1e9;border-radius:11px;padding:9px;background:#fff}.live{font-size:10px;font-weight:900;color:#087052}.brand{display:flex;gap:10px;align-items:center;margin-top:18px}.brand>span{width:42px;height:42px;border-radius:13px;background:#0f6f59;color:#fff;display:grid;place-items:center;font-weight:950}.brand strong,.brand small{display:block}.brand small{color:#77879a;max-width:620px}.card h1{font-size:30px;margin:18px 0}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.stats>div{background:#f6f9f8;border:1px solid #e1eae6;border-radius:16px;padding:13px}.stats small,.stats strong{display:block}.stats small{font-size:9px;color:#718192;text-transform:uppercase;font-weight:900}.stats strong{margin-top:5px;font-size:20px}.stats .critical{background:#fff1f1;border-color:#f3d0d0}.stats .high{background:#fff8ea;border-color:#f1dfb8}.stats .open{background:#eef8f4;border-color:#d1e9df}.tools{margin:14px 0;display:grid;gap:9px}.tools input{width:100%;box-sizing:border-box;border:1px solid #d8e1e9;border-radius:14px;padding:12px 13px;font-size:16px;outline:none}.tools input:focus{border-color:#0f6f59;box-shadow:0 0 0 3px rgba(15,111,89,.08)}.filters{display:flex;gap:7px;flex-wrap:wrap}.filters button{border:1px solid #dbe4e0;border-radius:11px;background:#fff;color:#506174;padding:9px 11px;font-weight:850}.filters .active{background:#0f6f59;color:#fff;border-color:#0f6f59}.filters .refresh{margin-left:auto;background:#102033;color:#fff;border-color:#102033}.message{background:#fff0f0;color:#9b2c2c;border-radius:12px;padding:10px;margin-bottom:12px}.empty{padding:32px;text-align:center;border:1px dashed #d8e1e9;border-radius:18px;color:#78889a}.list{display:grid;gap:12px}.issue{border:1px solid #dfe6ee;border-left:5px solid #e4a93b;border-radius:18px;padding:15px;background:#fff}.issue.critical{border-left-color:#c93737}.issue.high{border-left-color:#e78d2d}.issue.medium{border-left-color:#d9b23e}.issueHead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.issueHead>div{display:grid;gap:5px}.severity{font-size:9px;font-weight:950;color:#a33b3b;letter-spacing:.07em}.issueHead strong{font-size:15px}.caseStatus{border-radius:999px;padding:6px 9px;font-size:10px;font-weight:900}.caseStatus.new{background:#fff4d8;color:#805c00}.caseStatus.reviewing{background:#eaf2ff;color:#185fc2}.caseStatus.resolved{background:#e7f7ef;color:#087052}.issue>p{font-size:12px;color:#617184;line-height:1.5;margin:10px 0}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.grid>div{background:#f7f9fb;border-radius:13px;padding:10px}.grid small,.grid strong,.grid em{display:block}.grid small{font-size:9px;text-transform:uppercase;color:#788695;font-weight:900}.grid strong{font-size:13px;margin-top:4px}.grid em{font-size:10px;color:#788695;margin-top:2px;font-style:normal}.meta{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;font-size:11px;color:#657487}.workflow{margin-top:13px;padding-top:13px;border-top:1px solid #e8edf2;display:grid;gap:9px}.workflow label{display:grid;gap:5px;font-size:10px;font-weight:900;color:#657487}.workflow textarea,.workflow input{border:1px solid #d8e1e9;border-radius:11px;padding:10px 11px;font-size:13px;min-height:42px;box-sizing:border-box}.workflow textarea{min-height:72px;resize:vertical}.workflow button{border:0;border-radius:11px;padding:10px 12px;background:#eaf2ff;color:#185fc2;font-weight:900}.workflow .take{background:#102033;color:#fff}.workflow .resolve{background:#0f6f59;color:#fff}.workflow .reopen{background:#fff4df;color:#8a5c00}.workflow .timelineBtn{background:#f2f5f7;color:#506174}.workflow button:disabled{opacity:.5}.timeline{background:#f7f9fb;border-radius:13px;padding:10px;display:grid;gap:8px}.timeline>div{padding-bottom:7px;border-bottom:1px solid #e7ecef}.timeline>div:last-child{border-bottom:0}.timeline strong,.timeline small{display:block}.timeline small{font-size:9px;color:#7b8997;margin-top:2px}.timeline p{margin:4px 0 0;font-size:11px;color:#536477}@media(max-width:700px){.page{padding:0}.card{min-height:100vh;border-radius:0;padding:18px 14px}.card h1{font-size:26px}.stats{grid-template-columns:1fr 1fr}.grid{grid-template-columns:1fr 1fr}.filters .refresh{margin-left:0}.topRight{align-items:flex-end;flex-direction:column}.issue{padding:13px}}@media(max-width:420px){.grid{grid-template-columns:1fr}.stats{gap:7px}.stats>div{padding:11px}}
  `}</style>
  </main>
}
