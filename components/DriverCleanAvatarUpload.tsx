'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function DriverCleanAvatarUpload(){
  useEffect(()=>{
    if(!window.location.pathname.startsWith('/driver/dashboard-v2')) return

    let disposed=false
    const cleanups:Array<()=>void>=[]

    const apply=async()=>{
      if(disposed) return
      const avatar=document.querySelector<HTMLElement>('.dcm-avatar')
      const head=document.querySelector<HTMLElement>('.dcm-head')
      if(!avatar||!head||avatar.dataset.avatarUploadReady==='true') return

      avatar.dataset.avatarUploadReady='true'
      avatar.style.cursor='pointer'
      avatar.style.position='relative'
      avatar.style.overflow='visible'
      avatar.setAttribute('role','button')
      avatar.setAttribute('tabindex','0')
      avatar.setAttribute('aria-label','Changer la photo de profil')
      avatar.title='Klike pou mete foto pwofil'

      const badge=document.createElement('span')
      badge.className='dcm-camera-badge'
      badge.textContent='📷'
      Object.assign(badge.style,{
        position:'absolute',right:'-5px',bottom:'-5px',width:'23px',height:'23px',
        borderRadius:'50%',background:'#fff',border:'1px solid #d8e2e8',display:'grid',
        placeItems:'center',fontSize:'11px',boxShadow:'0 2px 8px rgba(0,0,0,.14)',zIndex:'3'
      })
      avatar.appendChild(badge)

      const input=document.createElement('input')
      input.type='file'
      input.accept='image/jpeg,image/png,image/webp'
      input.setAttribute('capture','environment')
      input.style.display='none'
      head.appendChild(input)

      const {data:auth}=await supabase.auth.getUser()
      const user=auth.user
      if(!user) return

      const showPhoto=async(stored:string)=>{
        if(!stored) return
        let src=stored
        if(!/^https?:\/\//i.test(stored)){
          const {data}=await supabase.storage.from('driver-avatars').createSignedUrl(stored,3600)
          src=data?.signedUrl||''
        }
        if(!src) return
        let img=avatar.querySelector<HTMLImageElement>('img.dcm-avatar-photo')
        if(!img){
          img=document.createElement('img')
          img.className='dcm-avatar-photo'
          img.alt=''
          Object.assign(img.style,{position:'absolute',inset:'0',width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%',zIndex:'1'})
          avatar.insertBefore(img,badge)
        }
        img.src=src
        Array.from(avatar.childNodes).forEach(node=>{
          if(node.nodeType===Node.TEXT_NODE) node.textContent=''
        })
      }

      const {data:person}=await supabase.from('profiles').select('avatar_url').eq('id',user.id).maybeSingle()
      let stored=person?.avatar_url||''
      await showPhoto(stored)

      const openPicker=()=>input.click()
      const onKey=(event:KeyboardEvent)=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();openPicker()}
      }
      avatar.addEventListener('click',openPicker)
      avatar.addEventListener('keydown',onKey)
      cleanups.push(()=>avatar.removeEventListener('click',openPicker))
      cleanups.push(()=>avatar.removeEventListener('keydown',onKey))

      const onFile=async()=>{
        const file=input.files?.[0]
        if(!file) return
        if(file.size>5*1024*1024){alert('Foto a pa dwe depase 5 MB.');input.value='';return}
        if(!['image/jpeg','image/png','image/webp'].includes(file.type)){alert('Chwazi yon foto JPG, PNG oswa WEBP.');input.value='';return}

        avatar.style.opacity='.55'
        const ext=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg'
        const path=`${user.id}/profile.${ext}`

        if(stored&&!/^https?:\/\//i.test(stored)&&stored!==path){
          await supabase.storage.from('driver-avatars').remove([stored])
        }
        const {error:uploadError}=await supabase.storage.from('driver-avatars').upload(path,file,{upsert:true,contentType:file.type})
        if(uploadError){avatar.style.opacity='1';alert(uploadError.message);input.value='';return}

        const {error:saveError}=await supabase.from('profiles').update({avatar_url:path}).eq('id',user.id)
        if(saveError){avatar.style.opacity='1';alert(saveError.message);input.value='';return}

        stored=path
        await showPhoto(path)
        avatar.style.opacity='1'
        input.value=''
      }
      input.addEventListener('change',onFile)
      cleanups.push(()=>input.removeEventListener('change',onFile))
    }

    void apply()
    const observer=new MutationObserver(()=>{void apply()})
    observer.observe(document.body,{childList:true,subtree:true})

    return()=>{
      disposed=true
      observer.disconnect()
      cleanups.forEach(fn=>fn())
    }
  },[])

  return null
}
