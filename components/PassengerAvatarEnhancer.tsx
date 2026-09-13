'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const size = 180
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('canvas'))
        const scale = Math.max(size / img.width, size / img.height)
        const w = img.width * scale
        const h = img.height * scale
        const x = (size - w) / 2
        const y = (size - h) / 2
        ctx.drawImage(img, x, y, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.72))
      }
      img.onerror = reject
      img.src = String(reader.result)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function PassengerAvatarEnhancer() {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [avatar, setAvatar] = useState('')

  useEffect(() => {
    let mounted = true
    void supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      const saved = String(data.user?.user_metadata?.avatar_data_url ?? '')
      setAvatar(saved)
    })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    const decorate = () => {
      const drawer = document.querySelector('.nav-drawer') as HTMLElement | null
      if (!drawer) return

      const ht = localStorage.getItem('taxi-language') === 'ht'
      const brand = drawer.querySelector('.drawer-brand') as HTMLElement | null
      if (brand) brand.style.setProperty('display', 'none', 'important')

      const head = drawer.querySelector('.drawer-head') as HTMLElement | null
      if (head) {
        head.style.setProperty('justify-content', 'flex-end', 'important')
        head.style.setProperty('border-bottom', '0', 'important')
        head.style.setProperty('padding-bottom', '0', 'important')
        head.style.setProperty('min-height', '52px', 'important')
      }

      const user = drawer.querySelector('.drawer-user') as HTMLElement | null
      if (user) {
        user.classList.add('passenger-premium-user')
        const details = user.querySelector(':scope > div:last-child') as HTMLElement | null
        if (details) details.style.setProperty('display', 'none', 'important')
      }

      const nav = drawer.querySelector('.drawer-nav') as HTMLElement | null
      if (nav) {
        const buttons = Array.from(nav.querySelectorAll<HTMLButtonElement>(':scope > button'))
        const byText = (terms: string[]) => buttons.find((button) => {
          const text = (button.textContent || '').toLowerCase()
          return terms.some((term) => text.includes(term))
        }) || null

        const homeButton = byText(['accueil', 'akèy'])
        if (homeButton) homeButton.style.setProperty('display', 'none', 'important')

        const becomeDriverButton = byText(['devenir chauffeur', 'vin chofè', 'vin chofe'])
        if (becomeDriverButton) becomeDriverButton.style.setProperty('display', 'none', 'important')

        const profileButton = byText(['profil', 'pwofil'])
        const tripsButton = byText(['mes trajets', 'trajè mwen yo'])
        const paymentButton = byText(['paiement', 'peman'])
        const helpButton = byText(['aide', 'èd'])
        const languageBlock = nav.querySelector(':scope > .drawer-language') as HTMLElement | null
        const profileTarget = nav.querySelector(':scope > .drawer-profile-inline-target') as HTMLElement | null
        const tripsTarget = nav.querySelector(':scope > .drawer-trips-inline-target') as HTMLElement | null

        if (profileButton) profileButton.style.order = '10'
        if (profileTarget) profileTarget.style.order = '11'
        if (tripsButton) tripsButton.style.order = '20'
        if (tripsTarget) tripsTarget.style.order = '21'
        if (paymentButton) paymentButton.style.order = '30'
        if (languageBlock) languageBlock.style.order = '40'
        if (helpButton) helpButton.style.order = '50'
      }

      const circle = drawer.querySelector('.drawer-avatar') as HTMLElement | null
      if (circle) {
        circle.classList.add('passenger-photo-avatar')
        circle.setAttribute('role', 'button')
        circle.setAttribute('aria-label', ht ? 'Ajoute oswa chanje foto pwofil' : 'Ajouter ou changer la photo de profil')
        circle.setAttribute('title', ht ? 'Chanje foto' : 'Changer la photo')
        circle.onclick = () => inputRef.current?.click()
        if (avatar) {
          circle.innerHTML = ''
          const img = document.createElement('img')
          img.src = avatar
          img.alt = ht ? 'Foto pwofil' : 'Photo de profil'
          circle.appendChild(img)
        }
        if (!circle.querySelector('.passenger-avatar-camera')) {
          const camera = document.createElement('span')
          camera.className = 'passenger-avatar-camera'
          camera.textContent = '📷'
          circle.appendChild(camera)
        }
      }
    }

    decorate()
    const observer = new MutationObserver(decorate)
    observer.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('storage', decorate)
    return () => {
      observer.disconnect()
      window.removeEventListener('storage', decorate)
    }
  }, [avatar])

  async function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return
    try {
      const dataUrl = await resizeImage(file)
      setAvatar(dataUrl)
      await supabase.auth.updateUser({ data: { avatar_data_url: dataUrl } })
    } finally {
      event.target.value = ''
    }
  }

  return <>
    <input ref={inputRef} type="file" accept="image/*" onChange={onPick} style={{ display: 'none' }} />
    <style>{`
      .nav-drawer .drawer-brand{display:none!important}
      .nav-drawer .drawer-head{justify-content:flex-end!important;border-bottom:0!important;padding-bottom:0!important;min-height:52px!important}
      .nav-drawer .drawer-user.passenger-premium-user{
        display:flex!important;
        flex-direction:column!important;
        align-items:center!important;
        justify-content:center!important;
        gap:0!important;
        margin:2px 2px 14px!important;
        padding:14px 12px!important;
        min-height:108px!important;
        border:1px solid #e2ebe7!important;
        border-radius:20px!important;
        background:linear-gradient(180deg,#ffffff 0%,#f5faf8 100%)!important;
        box-shadow:0 8px 24px rgba(16,32,51,.06)!important;
        text-align:center!important;
      }
      .nav-drawer .drawer-user.passenger-premium-user>div:last-child{display:none!important}
      .nav-drawer .drawer-avatar.passenger-photo-avatar{
        position:relative!important;
        width:68px!important;
        height:68px!important;
        min-width:68px!important;
        border-radius:22px!important;
        display:grid!important;
        place-items:center!important;
        overflow:visible!important;
        background:#0f705a!important;
        color:#fff!important;
        font-size:25px!important;
        font-weight:900!important;
        border:4px solid #fff!important;
        box-shadow:0 8px 22px rgba(15,112,90,.2)!important;
        cursor:pointer!important;
      }
      .nav-drawer .drawer-avatar.passenger-photo-avatar img{
        width:100%!important;height:100%!important;object-fit:cover!important;border-radius:18px!important;display:block!important;
      }
      .nav-drawer .passenger-avatar-camera{
        position:absolute!important;right:-6px!important;bottom:-5px!important;
        width:27px!important;height:27px!important;border-radius:10px!important;
        display:grid!important;place-items:center!important;background:#fff!important;border:1px solid #dce7e2!important;
        box-shadow:0 5px 12px rgba(16,32,51,.14)!important;font-size:12px!important;
      }
    `}</style>
  </>
}
