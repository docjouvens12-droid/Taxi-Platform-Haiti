'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function PassengerAvatarUploadPolish() {
  useEffect(() => {
    if (window.location.pathname !== '/passenger/dashboard') return

    const cleanups: Array<() => void> = []

    const apply = async () => {
      const drawer = document.querySelector<HTMLElement>('.nav-drawer')
      const avatar = drawer?.querySelector<HTMLElement>('.drawer-avatar')
      const userBlock = drawer?.querySelector<HTMLElement>('.drawer-user')
      if (!drawer || !avatar || !userBlock) return

      Array.from(userBlock.children).forEach((child) => {
        const element = child as HTMLElement
        if (element === avatar || element.tagName === 'INPUT') return
        element.style.setProperty('display', 'none', 'important')
      })
      Array.from(userBlock.childNodes).forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) node.textContent = ''
      })
      userBlock.style.setProperty('justify-content', 'flex-start', 'important')
      userBlock.style.setProperty('gap', '0', 'important')

      if (avatar.dataset.passengerAvatarReady === 'true') return
      avatar.dataset.passengerAvatarReady = 'true'
      avatar.setAttribute('role', 'button')
      avatar.setAttribute('tabindex', '0')
      avatar.setAttribute('aria-label', 'Chanje foto pwofil')
      avatar.title = 'Klike pou mete foto pwofil'
      Object.assign(avatar.style, {
        cursor: 'pointer',
        position: 'relative',
        overflow: 'visible',
      })

      const badge = document.createElement('span')
      badge.textContent = '📷'
      badge.dataset.passengerAvatarBadge = 'true'
      Object.assign(badge.style, {
        position: 'absolute',
        right: '-4px',
        bottom: '-4px',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: '#fff',
        border: '1px solid #d8e2e8',
        display: 'grid',
        placeItems: 'center',
        fontSize: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,.12)',
        zIndex: '3',
      })
      avatar.appendChild(badge)

      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/jpeg,image/png,image/webp'
      input.style.display = 'none'
      userBlock.appendChild(input)

      const { data: auth } = await supabase.auth.getUser()
      const user = auth.user
      if (!user) return

      const { data: person } = await supabase.from('profiles').select('avatar_url').eq('id', user.id).maybeSingle()
      let stored = person?.avatar_url || ''

      const showImage = async (value: string) => {
        if (!value) return
        let src = value
        if (!/^https?:\/\//i.test(value)) {
          const { data } = await supabase.storage.from('driver-avatars').createSignedUrl(value, 3600)
          src = data?.signedUrl || ''
        }
        if (!src) return

        avatar.querySelector('img')?.remove()
        const img = document.createElement('img')
        img.src = src
        img.alt = ''
        Object.assign(img.style, {
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '50%',
          display: 'block',
        })
        avatar.insertBefore(img, badge)
        Array.from(avatar.childNodes).forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) node.textContent = ''
        })
      }

      await showImage(stored)

      const openPicker = (event?: Event) => {
        event?.preventDefault()
        event?.stopPropagation()
        input.click()
      }
      const keyOpen = (event: Event) => {
        const keyEvent = event as KeyboardEvent
        if (keyEvent.key === 'Enter' || keyEvent.key === ' ') openPicker(event)
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
          window.alert('Foto a pa dwe depase 5 MB.')
          input.value = ''
          return
        }

        const mime = file.type
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) {
          window.alert('Chwazi yon foto JPG, PNG oswa WEBP.')
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
          window.alert(uploadError.message)
          input.value = ''
          return
        }

        const { error: saveError } = await supabase.from('profiles').update({ avatar_url: path }).eq('id', user.id)
        if (saveError) {
          avatar.style.opacity = '1'
          window.alert(saveError.message)
          input.value = ''
          return
        }

        stored = path
        await showImage(path)
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
