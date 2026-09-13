'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '../lib/supabase'

type Ride = { id: string; passenger_id: string; driver_id: string | null; status: string }
type RideMessage = { id: string; ride_id: string; sender_id: string; message: string; created_at: string }

export default function RideCommunicationPanel() {
  const pathname = usePathname()
  const isPassenger = pathname === '/passenger/dashboard' || pathname === '/'
  const isDriver = pathname === '/driver/dashboard'
  const enabled = isPassenger || isDriver
  const [ride, setRide] = useState<Ride | null>(null)
  const [userId, setUserId] = useState('')
  const [phone, setPhone] = useState('')
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<RideMessage[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [lang, setLang] = useState<'fr' | 'ht'>('fr')
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!enabled) return
    let alive = true
    const loadRide = async () => {
      const { data: auth } = await supabase.auth.getUser()
      if (!alive || !auth.user) { if (alive) setRide(null); return }
      setUserId(auth.user.id)
      const field = isPassenger ? 'passenger_id' : 'driver_id'
      const { data } = await supabase
        .from('rides')
        .select('id,passenger_id,driver_id,status')
        .eq(field, auth.user.id)
        .in('status', ['accepted','driver_arriving','in_progress'])
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (!alive) return
      setRide((data as Ride | null) ?? null)
      if (isPassenger && data) {
        const { data: contact } = await supabase.rpc('get_passenger_active_driver_phone')
        const row = Array.isArray(contact) ? contact[0] : contact
        if (alive) setPhone(row?.driver_phone?.trim?.() || '')
      } else if (alive) setPhone('')
    }
    const syncLang = () => setLang(localStorage.getItem('taxi-language') === 'ht' ? 'ht' : 'fr')
    syncLang(); void loadRide()
    const timer = window.setInterval(() => { syncLang(); void loadRide() }, 2500)
    return () => { alive = false; window.clearInterval(timer) }
  }, [enabled, isPassenger])

  useEffect(() => {
    if (!open || !ride) return
    let alive = true
    const loadMessages = async () => {
      const { data } = await supabase
        .from('ride_messages')
        .select('id,ride_id,sender_id,message,created_at')
        .eq('ride_id', ride.id)
        .order('created_at', { ascending: true })
        .limit(100)
      if (alive) setMessages((data as RideMessage[] | null) ?? [])
    }
    void loadMessages()
    const timer = window.setInterval(() => void loadMessages(), 1400)
    return () => { alive = false; window.clearInterval(timer) }
  }, [open, ride?.id])

  useEffect(() => { if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, open])

  const labels = useMemo(() => lang === 'ht' ? {
    call:'Rele', chat:'Mesaj', title:isPassenger ? 'Mesaj ak chofè a' : 'Mesaj ak kliyan an',
    placeholder:'Ekri yon mesaj…', send:'Voye', close:'Fèmen', noPhone:'Nimewo chofè a pa disponib.', empty:'Pa gen mesaj ankò.'
  } : {
    call:'Appeler', chat:'Message', title:isPassenger ? 'Messages avec le chauffeur' : 'Messages avec le client',
    placeholder:'Écrivez un message…', send:'Envoyer', close:'Fermer', noPhone:'Le numéro du chauffeur n’est pas disponible.', empty:'Aucun message pour le moment.'
  }, [lang, isPassenger])

  if (!enabled || !ride) return null

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const message = draft.trim()
    if (!message || !userId || !ride || sending) return
    setSending(true)
    const { error } = await supabase.from('ride_messages').insert({ ride_id: ride.id, sender_id: userId, message })
    if (!error) {
      setDraft('')
      const { data } = await supabase.from('ride_messages').select('id,ride_id,sender_id,message,created_at').eq('ride_id', ride.id).order('created_at', { ascending: true }).limit(100)
      setMessages((data as RideMessage[] | null) ?? [])
    }
    setSending(false)
  }

  const call = () => {
    if (!phone) { window.alert(labels.noPhone); return }
    window.location.href = `tel:${phone.replace(/[^+\d]/g,'')}`
  }

  return <>
    <div className={`rideComActions ${isDriver ? 'driver' : 'passenger'}`}>
      {isPassenger && <button type="button" onClick={call} className="callBtn">☎ {labels.call}</button>}
      <button type="button" onClick={() => setOpen(true)} className="chatBtn">💬 {labels.chat}</button>
    </div>

    {open && <div className="chatShade" role="presentation" onClick={() => setOpen(false)}>
      <section className="chatPanel" role="dialog" aria-modal="true" aria-label={labels.title} onClick={(e) => e.stopPropagation()}>
        <header><div><span>💬</span><strong>{labels.title}</strong></div><button type="button" onClick={() => setOpen(false)} aria-label={labels.close}>×</button></header>
        <div className="messageList">
          {messages.length === 0 && <div className="empty">{labels.empty}</div>}
          {messages.map((m) => <div key={m.id} className={`bubbleRow ${m.sender_id === userId ? 'mine' : 'theirs'}`}>
            <div className="bubble"><p>{m.message}</p><small>{new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</small></div>
          </div>)}
          <div ref={endRef} />
        </div>
        <form onSubmit={submit}><input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000} placeholder={labels.placeholder} /><button type="submit" disabled={!draft.trim() || sending}>{sending ? '…' : labels.send}</button></form>
      </section>
    </div>}

    <style jsx>{`
      .rideComActions{position:fixed;left:50%;transform:translateX(-50%);z-index:12070;display:flex;gap:8px;pointer-events:auto}.rideComActions.passenger{bottom:max(28px,calc(env(safe-area-inset-bottom) + 14px))}.rideComActions.driver{bottom:max(18px,calc(env(safe-area-inset-bottom) + 10px))}.rideComActions button{border:0;border-radius:999px;padding:10px 15px;font:850 12px Inter,system-ui,sans-serif;box-shadow:0 9px 24px rgba(16,32,51,.20)}.callBtn{background:#102033;color:#fff}.chatBtn{background:${isDriver ? '#0f8067' : '#1b70eb'};color:#fff}
      .chatShade{position:fixed;inset:0;z-index:13000;background:rgba(11,24,38,.42);display:flex;align-items:flex-end;justify-content:center;padding:12px;box-sizing:border-box}.chatPanel{width:min(100%,520px);height:min(72vh,620px);background:#fff;border-radius:24px;display:grid;grid-template-rows:auto 1fr auto;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.30);font-family:Inter,system-ui,sans-serif}.chatPanel header{display:flex;align-items:center;justify-content:space-between;padding:14px 15px;border-bottom:1px solid #e7edf3}.chatPanel header>div{display:flex;align-items:center;gap:8px}.chatPanel header strong{font-size:14px;color:#102033}.chatPanel header button{border:0;background:#f0f4f7;color:#405161;width:34px;height:34px;border-radius:50%;font-size:22px}.messageList{padding:14px;overflow:auto;background:#f7f9fc}.empty{text-align:center;color:#82909d;font-size:12px;padding:28px 10px}.bubbleRow{display:flex;margin:7px 0}.bubbleRow.mine{justify-content:flex-end}.bubbleRow.theirs{justify-content:flex-start}.bubble{max-width:78%;border-radius:16px;padding:9px 11px;background:#fff;border:1px solid #e2e8ef;color:#102033;box-shadow:0 2px 7px rgba(16,32,51,.04)}.mine .bubble{background:${isDriver ? '#e8f5f1' : '#eaf2ff'};border-color:${isDriver ? '#cce7df' : '#cfe0fb'}}.bubble p{margin:0;font-size:12px;line-height:1.35;white-space:pre-wrap;overflow-wrap:anywhere}.bubble small{display:block;margin-top:4px;font-size:8px;color:#8794a1;text-align:right}.chatPanel form{display:grid;grid-template-columns:1fr auto;gap:8px;padding:11px;border-top:1px solid #e7edf3;background:#fff}.chatPanel input{min-width:0;border:1px solid #dce5ee;border-radius:14px;padding:11px 12px;font-size:13px;outline:none}.chatPanel input:focus{border-color:${isDriver ? '#0f8067' : '#1b70eb'};box-shadow:0 0 0 3px ${isDriver ? 'rgba(15,128,103,.10)' : 'rgba(27,112,235,.10)' }}.chatPanel form button{border:0;border-radius:13px;padding:0 14px;background:${isDriver ? '#0f8067' : '#1b70eb'};color:#fff;font-weight:900}.chatPanel form button:disabled{opacity:.45}
      @media(max-width:600px){.chatShade{padding:0}.chatPanel{width:100%;height:min(78vh,680px);border-radius:24px 24px 0 0}.rideComActions.passenger{bottom:max(22px,calc(env(safe-area-inset-bottom) + 10px))}}
    `}</style>
  </>
}
