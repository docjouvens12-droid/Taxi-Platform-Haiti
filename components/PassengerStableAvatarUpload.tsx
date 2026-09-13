'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const size = 220
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('canvas'))
        const scale = Math.max(size / img.width, size / img.height)
        const w = img.width * scale
        const h = img.height * scale
        ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.onerror = reject
      img.src = String(reader.result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function PassengerStableAvatarUpload() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [avatar, setAvatar] = useState('')

  const paintAvatar = (value = avatar) => {
    const circle = document.querySelector<HTMLElement>('.shell .nav-drawer .drawer-avatar')
    if (!circle) return
    circle.classList.add('passenger-stable-photo')
    circle.setAttribute('role', 'button')
    circle.setAttribute('tabindex', '0')
    circle.setAttribute('aria-label', localStorage.getItem('taxi-language') === 'ht' ? 'Ajoute oswa chanje foto pwofil' : 'Ajouter ou changer la photo de profil')
    if (value) circle.style.backgroundImage = `url(${JSON.stringify(value).slice(1,-1)})`
    else circle.style.removeProperty('background-image')
  }

  useEffect(() => {
    let alive = true
    supabase.auth.getUser().then(({ data }) => {
      if (!alive) return
      const saved = String(data.user?.user_metadata?.avatar_data_url ?? '')
      setAvatar(saved)
    })

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.closest('.shell .nav-drawer .drawer-avatar')) {
        event.preventDefault()
        inputRef.current?.click()
        return
      }
      requestAnimationFrame(() => paintAvatar())
    }

    document.addEventListener('click', onDocumentClick, true)
    const timer = window.setTimeout(() => paintAvatar(), 250)
    return () => {
      alive = false
      window.clearTimeout(timer)
      document.removeEventListener('click', onDocumentClick, true)
    }
  }, [avatar])

  useEffect(() => { requestAnimationFrame(() => paintAvatar(avatar)) }, [avatar])

  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    try {
      const dataUrl = await resizeImage(file)
      setAvatar(dataUrl)
      paintAvatar(dataUrl)
      await supabase.auth.updateUser({ data: { avatar_data_url: dataUrl } })
    } finally {
      event.target.value = ''
    }
  }

  return <>
    <input ref={inputRef} type="file" accept="image/*" onChange={onPick} style={{display:'none'}} />
    <style>{`
      .shell .nav-drawer .drawer-user{
        display:flex!important;
        flex-direction:column!important;
        align-items:center!important;
        justify-content:center!important;
        text-align:center!important;
        min-height:122px!important;
        padding:14px 12px!important;
      }
      .shell .nav-drawer .drawer-user>div:last-child{display:none!important}
      .shell .nav-drawer .drawer-avatar{
        position:relative!important;
        width:82px!important;
        height:82px!important;
        min-width:82px!important;
        margin:0 auto!important;
        border-radius:50%!important;
        background-size:cover!important;
        background-position:center!important;
        background-repeat:no-repeat!important;
        border:4px solid #fff!important;
        box-shadow:0 9px 24px rgba(15,112,90,.20)!important;
        cursor:pointer!important;
        overflow:visible!important;
      }
      .shell .nav-drawer .drawer-avatar.passenger-stable-photo{color:transparent!important;font-size:0!important}
      .shell .nav-drawer .drawer-avatar:after{
        content:'📷';
        position:absolute!important;
        right:-5px!important;
        bottom:-3px!important;
        width:30px!important;
        height:30px!important;
        display:grid!important;
        place-items:center!important;
        border-radius:50%!important;
        background:#fff!important;
        border:1px solid #dce7e2!important;
        box-shadow:0 5px 12px rgba(16,32,51,.14)!important;
        font-size:14px!important;
        color:#10243a!important;
      }
    `}</style>
  </>
}
