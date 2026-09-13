'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function DriverAvatarUploadPolish() {
  useEffect(() => {
    if (location.pathname !== '/driver/dashboard') return

    const cleanups: Array<() => void> = []

    const apply = async () => {
      const drawer = document.querySelector('.drawer') as HTMLElement | null
      const profile = drawer?.querySelector('.profile, .profileBlock') as HTMLElement | null
      const avatar = profile?.querySelector('.avatar') as HTMLElement | null
      if (!drawer || !profile || !avatar || avatar.dataset.avatarUploadReady === 'true') return
      avatar.dataset.avatarUploadReady = 'true'

      profile.style.justifyContent = 'center'
      profile.style.paddingLeft = '0'
      profile.style.paddingRight = '0'
      Object.assign(avatar.style, {
        cursor: 'pointer',
        flex: '0 0 auto',
        position: 'relative',
        outline: '2px solid transparent',
        outlineOffset: '2px',
      })
      avatar.setAttribute('role', 'button')
      avatar.setAttribute('tabindex', '0')
      avatar.setAttribute('aria-label', 'Changer la photo de profil')
      avatar.title = 'Klike pou mete foto pwofil'

      const badge = document.createElement('span')
      badge.textContent = '📷'
      Object.assign(badge.style, {
        position: 'absolute', right: '-4px', bottom: '-4px', width: '22px', height: '22px',
        borderRadius: '50%', background: '#fff', border: '1px solid #d8e2e8', display: 'grid',
        placeItems: 'center', fontSize: '11px', boxShadow: '0 2px 8px rgba(0,0,0,.12)'
      })
      avatar.appendChild(badge)

      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/jpeg,image/png,image/webp'
      input.setAttribute('capture', 'environment')
      input.style.display = 'none'
      profile.appendChild(input)

      const { data: auth } = await supabase.auth.getUser()
      const user = auth.user
      if (!user) return

      const { data: person } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle()
      const stored = person?.avatar_url || ''
      if (stored) {
        let src = stored
        if (!/^https?:\/\//i.test(stored)) {
          const { data } = await supabase.storage.from('driver-avatars').createSignedUrl(stored, 3600)
          src = data?.signedUrl || ''
        }
        if (src) {
          avatar.querySelector('img')?.remove()
          const img = document.createElement('img')
          img.src = src
          img.alt = ''
          Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'cover' })
          avatar.insertBefore(img, badge)
          Array.from(avatar.childNodes).forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) node.textContent = ''
          })
        }
      }

      const openPicker = () => input.click()
      const keyOpen = (e: Event) => {
        const ke = e as KeyboardEvent
        if (ke.key === 'Enter' || ke.key === ' ') { e.preventDefault(); openPicker() }
      }
      avatar.addEventListener('click', openPicker)
      avatar.addEventListener('keydown', keyOpen)
      cleanups.push(() => {
        avatar.removeEventListener('click', openPicker)
        avatar.removeEventListener('keydown', keyOpen)
      })

      const onFile = async () => {
        const file = input.files?.[0]
        if (!file) return
        if (file.size > 5 * 1024 * 1024) {
          alert('Foto a pa dwe depase 5 MB.')
          input.value = ''
          return
        }

        const mime = file.type
        if (!['image/jpeg','image/png','image/webp'].includes(mime)) {
          alert('Chwazi yon foto JPG, PNG oswa WEBP.')
          input.value = ''
          return
        }

        avatar.style.opacity = '.55'
        const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
        const path = `${user.id}/profile.${ext}`

        if (stored && !/^https?:\/\//i.test(stored) && stored !== path) {
          await supabase.storage.from('driver-avatars').remove([stored])
        }

        const { error: uploadError } = await supabase.storage
          .from('driver-avatars')
          .upload(path, file, { upsert: true, contentType: mime })

        if (uploadError) {
          avatar.style.opacity = '1'
          alert(uploadError.message)
          input.value = ''
          return
        }

        const { error: saveError } = await supabase.from('profiles').update({ avatar_url: path }).eq('id', user.id)
        if (saveError) {
          avatar.style.opacity = '1'
          alert(saveError.message)
          input.value = ''
          return
        }

        const { data } = await supabase.storage.from('driver-avatars').createSignedUrl(path, 3600)
        const src = data?.signedUrl
        if (src) {
          let img = avatar.querySelector('img') as HTMLImageElement | null
          if (!img) {
            img = document.createElement('img')
            img.alt = ''
            Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'cover' })
            avatar.insertBefore(img, badge)
          }
          img.src = src
          Array.from(avatar.childNodes).forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) node.textContent = ''
          })
        }
        avatar.style.opacity = '1'
        input.value = ''
      }

      input.addEventListener('change', onFile)
      cleanups.push(() => input.removeEventListener('change', onFile))
    }

    void apply()
    const observer = new MutationObserver(() => { void apply() })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      cleanups.forEach((fn) => fn())
    }
  }, [])

  return null
}
