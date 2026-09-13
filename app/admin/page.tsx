'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

type Lang = 'fr' | 'ht'
type Stats = { users:number; pendingDrivers:number; approvedDrivers:number; totalRides:number; activeRides:number; openSafety:number; platformFees:number }
type Perms = { is_admin:boolean; is_super_admin:boolean; can_manage_admins:boolean; can_manage_drivers:boolean; can_view_payments:boolean; can_manage_payouts:boolean; can_reconcile:boolean; can_manage_safety:boolean; can_view_system:boolean }

const copy = {
  fr: {
    title:'Tableau de bord administrateur', subtitle:'Vue générale de Taxi Platform Haiti', loading:'Chargement du tableau de bord…', denied:'Accès réservé aux administrateurs.',
    restricted:'Certaines sections sont masquées selon les permissions attribuées à ce compte.', users:'Utilisateurs', pending:'Chauffeurs en attente', approved:'Chauffeurs approuvés', rides:'Trajets totaux', active:'Trajets actifs', fees:'Commissions plateforme',
    admins:'Administrateurs', adminsDesc:'Ajouter des administrateurs et définir leurs restrictions', drivers:'Chauffeurs', driversDesc:'Demandes, approbations et comptes chauffeurs', payments:'Paiements & commissions', paymentsDesc:'Transactions, méthodes de paiement et revenus plateforme',
    payouts:'Versements chauffeurs', payoutsDesc:'Suivi des montants dus et paiements chauffeurs', reconciliation:'Réconciliation', reconciliationDesc:'Vérifier les écarts et rapprocher les paiements', safety:'Sécurité', safetyDesc:'Alertes, incidents et événements de sécurité', system:'État du système', systemDesc:'Vérifier les services essentiels de la plateforme',
    refresh:'Actualiser', attention:'À surveiller', allGood:'Aucune alerte de sécurité ouverte', openSafety:'alerte(s) de sécurité ouverte(s)', limited:'ADMIN LIMITÉ', super:'SUPER ADMIN'
  },
  ht: {
    title:'Dashboard administratè', subtitle:'Apèsi jeneral Taxi Platform Haiti', loading:'N ap chaje dashboard la…', denied:'Se administratè sèlman ki gen aksè.',
    restricted:'Gen kèk seksyon ki kache selon dwa Super Admin lan bay kont sa a.', users:'Itilizatè', pending:'Chofè k ap tann', approved:'Chofè apwouve', rides:'Total trajè', active:'Trajè aktif', fees:'Komisyon platfòm',
    admins:'Administratè yo', adminsDesc:'Ajoute administratè epi defini restriksyon yo', drivers:'Chofè yo', driversDesc:'Aplikasyon, apwobasyon ak kont chofè yo', payments:'Peman & komisyon', paymentsDesc:'Tranzaksyon, metòd peman ak revni platfòm',
    payouts:'Peman pou chofè', payoutsDesc:'Swiv kantite lajan pou peye chofè yo', reconciliation:'Rekonsilyasyon', reconciliationDesc:'Verifye diferans epi matche peman yo', safety:'Sekirite', safetyDesc:'Alèt, ensidan ak evènman sekirite', system:'Eta sistèm nan', systemDesc:'Verifye sèvis enpòtan platfòm nan',
    refresh:'Rafrechi', attention:'Pou siveye', allGood:'Pa gen okenn alèt sekirite ouvè', openSafety:'alèt sekirite ouvè', limited:'ADMIN LIMITE', super:'SUPER ADMIN'
  }
}

const emptyStats:Stats={users:0,pendingDrivers:0,approvedDrivers:0,totalRides:0,activeRides:0,openSafety:0,platformFees:0}
const noPerms:Perms={is_admin:false,is_super_admin:false,can_manage_admins:false,can_manage_drivers:false,can_view_payments:false,can_manage_payouts:false,can_reconcile:false,can_manage_safety:false,can_view_system:false}

export default function AdminDashboardPage(){
  const [lang,setLang]=useState<Lang>('fr')
  const [authorized,setAuthorized]=useState<boolean|null>(null)
  const [stats,setStats]=useState<Stats>(emptyStats)
  const [perms,setPerms]=useState<Perms>(noPerms)
  const [busy,setBusy]=useState(false)
  const t=copy[lang]

  useEffect(()=>{const saved=localStorage.getItem('taxi-language') as Lang|null;if(saved==='fr'||saved==='ht')setLang(saved);void init()},[])

  async function init(){
    setBusy(true)
    const {data:auth}=await supabase.auth.getUser()
    if(!auth.user){window.location.assign('/admin/login');return}
    const {data,error}=await supabase.rpc('get_my_admin_permissions')
    const p=(Array.isArray(data)?data[0]:data) as Perms|undefined
    if(error||!p?.is_admin){setAuthorized(false);setBusy(false);return}
    setPerms(p);setAuthorized(true);await loadStats(p);setBusy(false)
  }

  async function loadStats(p=perms){
    setBusy(true)
    const base=emptyStats
    let next={...base}
    const [users,rides,active]=await Promise.all([
      supabase.from('profiles').select('id',{count:'exact',head:true}),
      supabase.from('rides').select('id',{count:'exact',head:true}),
      supabase.from('rides').select('id',{count:'exact',head:true}).in('status',['requested','accepted','driver_arriving','in_progress'])
    ])
    next.users=users.count??0;next.totalRides=rides.count??0;next.activeRides=active.count??0
    if(p.is_super_admin||p.can_manage_drivers){
      const [pending,approved]=await Promise.all([
        supabase.from('driver_profiles').select('user_id',{count:'exact',head:true}).eq('status','pending'),
        supabase.from('driver_profiles').select('user_id',{count:'exact',head:true}).eq('status','approved')
      ])
      next.pendingDrivers=pending.count??0;next.approvedDrivers=approved.count??0
    }
    if(p.is_super_admin||p.can_manage_safety){const safety=await supabase.from('ride_safety_events').select('id',{count:'exact',head:true}).is('acknowledged_at',null).is('resolved_at',null);next.openSafety=safety.count??0}
    if(p.is_super_admin||p.can_view_payments){const payments=await supabase.from('payments').select('platform_fee_htg');next.platformFees=(payments.data??[]).reduce((sum,row:any)=>sum+Number(row.platform_fee_htg??0),0)}
    setStats(next);setBusy(false)
  }

  async function logout(){await supabase.auth.signOut();window.location.assign('/admin/login')}
  function changeLang(next:Lang){setLang(next);localStorage.setItem('taxi-language',next)}

  if(authorized===null)return <main className="adminShell"><section className="adminWrap"><div className="loading">{t.loading}</div></section></main>
  if(authorized===false)return <main className="adminShell"><section className="adminWrap"><div className="denied"><span>🔒</span><h1>{t.denied}</h1><button onClick={()=>window.location.assign('/admin/login')}>Admin Login</button></div></section></main>

  const allow=(key:keyof Perms)=>perms.is_super_admin||Boolean(perms[key])
  const nav=[
    allow('can_manage_admins')?{icon:'👑',title:t.admins,desc:t.adminsDesc,href:'/admin/admins'}:null,
    allow('can_manage_drivers')?{icon:'🚕',title:t.drivers,desc:t.driversDesc,href:'/admin/drivers',badge:stats.pendingDrivers||undefined}:null,
    allow('can_view_payments')?{icon:'💳',title:t.payments,desc:t.paymentsDesc,href:'/admin/payments'}:null,
    allow('can_manage_payouts')?{icon:'💸',title:t.payouts,desc:t.payoutsDesc,href:'/admin/payouts'}:null,
    allow('can_reconcile')?{icon:'🧾',title:t.reconciliation,desc:t.reconciliationDesc,href:'/admin/reconciliation'}:null,
    allow('can_manage_safety')?{icon:'🛡️',title:t.safety,desc:t.safetyDesc,href:'/admin/safety',badge:stats.openSafety||undefined}:null,
    allow('can_view_system')?{icon:'⚙️',title:t.system,desc:t.systemDesc,href:'/admin/system-check'}:null,
  ].filter(Boolean) as any[]

  return <main className="adminShell"><section className="adminWrap">
    <header className="topbar"><div className="brand"><span>🚕</span><div><strong>Taxi Haiti</strong><small>{t.subtitle}</small></div></div><div className="topActions"><select value={lang} onChange={e=>changeLang(e.target.value as Lang)}><option value="fr">FR</option><option value="ht">KR</option></select><button className="logout" onClick={()=>void logout()}>↪</button></div></header>
    <div className="hero"><div><p>{perms.is_super_admin?t.super:t.limited}</p><h1>{t.title}</h1></div><button onClick={()=>void loadStats()} disabled={busy}>↻ {t.refresh}</button></div>
    {!perms.is_super_admin&&<div className="restriction">🔐 {t.restricted}</div>}
    <div className="statsGrid">
      <article><span>👥</span><small>{t.users}</small><strong>{stats.users}</strong></article>
      {allow('can_manage_drivers')&&<><article><span>⏳</span><small>{t.pending}</small><strong>{stats.pendingDrivers}</strong></article><article><span>✅</span><small>{t.approved}</small><strong>{stats.approvedDrivers}</strong></article></>}
      <article><span>🛣️</span><small>{t.rides}</small><strong>{stats.totalRides}</strong></article><article><span>📍</span><small>{t.active}</small><strong>{stats.activeRides}</strong></article>
      {allow('can_view_payments')&&<article className="money"><span>💰</span><small>{t.fees}</small><strong>{stats.platformFees.toLocaleString('fr-FR',{maximumFractionDigits:2})} HTG</strong></article>}
    </div>
    {allow('can_manage_safety')&&<div className={stats.openSafety>0?'alert danger':'alert'}><span>{stats.openSafety>0?'⚠️':'✓'}</span><div><small>{t.attention}</small><strong>{stats.openSafety>0?`${stats.openSafety} ${t.openSafety}`:t.allGood}</strong></div></div>}
    <div className="navGrid">{nav.map(item=><button key={item.href} onClick={()=>window.location.assign(item.href)} className="navCard"><span className="icon">{item.icon}</span><div><strong>{item.title}</strong><small>{item.desc}</small></div>{item.badge?<b>{item.badge}</b>:<span className="arrow">›</span>}</button>)}</div>
  </section>
  <style jsx>{`
    .adminShell{min-height:100dvh;background:radial-gradient(circle at 50% -10%,#dceee8 0,#eef3f1 34%,#e7ecef 100%);padding:18px;color:#102033;font-family:Inter,system-ui,sans-serif}.adminWrap{width:min(100%,920px);margin:0 auto}.topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;background:rgba(255,255,255,.9);border:1px solid #dce7e3;border-radius:22px;padding:12px 14px;box-shadow:0 10px 28px rgba(16,32,51,.07)}.brand{display:flex;align-items:center;gap:10px}.brand>span{width:44px;height:44px;display:grid;place-items:center;border-radius:14px;background:#0f705a;font-size:22px}.brand strong,.brand small{display:block}.brand strong{font-size:15px}.brand small{font-size:10px;color:#75847e;margin-top:2px}.topActions{display:flex;gap:7px}.topActions select,.topActions button{height:42px;border-radius:12px;border:1px solid #d9e4e0;background:#fff;font-weight:900;color:#3e544d;padding:0 10px}.topActions .logout{color:#9a3434;background:#fff6f6}.hero{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;padding:26px 4px 15px}.hero p{margin:0 0 5px;color:#0f705a;font-size:10px;font-weight:950;letter-spacing:.16em}.hero h1{margin:0;font-size:30px;line-height:1.05}.hero button{border:1px solid #d8e4df;background:#fff;color:#0f705a;border-radius:13px;padding:10px 12px;font-weight:900}.restriction{margin:0 0 12px;background:#fff9e9;border:1px solid #f0dfad;color:#775f19;border-radius:14px;padding:10px 12px;font-size:10px;font-weight:800}.statsGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.statsGrid article{display:grid;grid-template-columns:34px 1fr;grid-template-rows:auto auto;column-gap:8px;background:#fff;border:1px solid #dfe8e4;border-radius:18px;padding:13px;box-shadow:0 8px 20px rgba(16,32,51,.045)}.statsGrid article>span{grid-row:1/3;width:34px;height:34px;border-radius:11px;background:#f0f7f4;display:grid;place-items:center}.statsGrid small{font-size:9px;color:#7b8984;font-weight:850;text-transform:uppercase}.statsGrid strong{font-size:19px;margin-top:3px}.statsGrid .money strong{font-size:16px}.alert{margin:12px 0;display:flex;align-items:center;gap:11px;padding:12px 14px;border-radius:16px;background:#edf8f4;border:1px solid #d5eae2;color:#0d6c55}.alert.danger{background:#fff3f3;border-color:#f0d3d3;color:#9b3333}.alert>span{font-size:21px}.alert small,.alert strong{display:block}.alert small{font-size:9px;font-weight:900;text-transform:uppercase}.alert strong{font-size:12px;margin-top:2px}.navGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px 0 24px}.navCard{position:relative;display:grid;grid-template-columns:46px 1fr auto;align-items:center;text-align:left;gap:11px;border:1px solid #dde7e3;background:#fff;border-radius:19px;padding:14px;min-height:86px;color:#102033;box-shadow:0 8px 22px rgba(16,32,51,.045);cursor:pointer}.navCard .icon{width:46px;height:46px;border-radius:14px;background:#edf7f3;display:grid;place-items:center;font-size:22px}.navCard strong,.navCard small{display:block}.navCard strong{font-size:14px}.navCard small{font-size:10px;color:#75847f;line-height:1.35;margin-top:3px}.navCard .arrow{font-size:26px;color:#91a19b}.navCard b{min-width:24px;height:24px;padding:0 6px;border-radius:999px;background:#c93636;color:#fff;display:grid;place-items:center;font-size:10px}.loading,.denied{margin-top:20vh;background:#fff;border-radius:22px;padding:24px;text-align:center}.denied span{font-size:34px}.denied h1{font-size:20px}.denied button{border:0;border-radius:13px;background:#0f705a;color:#fff;padding:12px 16px;font-weight:900}@media(max-width:650px){.adminShell{padding:10px}.hero{padding-top:22px}.hero h1{font-size:24px}.hero button{font-size:11px;padding:9px}.statsGrid{grid-template-columns:1fr 1fr}.navGrid{grid-template-columns:1fr}.navCard{min-height:80px}.brand small{display:none}}@media(max-width:370px){.statsGrid{grid-template-columns:1fr}.hero{align-items:flex-start;flex-direction:column}}
  `}</style></main>
}
