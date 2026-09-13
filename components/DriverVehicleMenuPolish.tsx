'use client'

import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function DriverVehicleMenuPolish() {
  useEffect(() => {
    if (location.pathname !== '/driver/dashboard') return

    let disposed = false

    const apply = async () => {
      const drawer = document.querySelector('.drawer') as HTMLElement | null
      if (!drawer) return

      const sections = Array.from(drawer.querySelectorAll('.menuSection')) as HTMLElement[]
      const oldSection = sections.find((section) => {
        const text = (section.querySelector('h3')?.textContent || '').trim().toLowerCase()
        return text.includes('véhic') || text.includes('veyikil') || text === 'vehicle'
      })
      if (!oldSection || oldSection.dataset.vehicleEditorReady === 'true') return
      oldSection.dataset.vehicleEditorReady = 'true'

      const { data: auth } = await supabase.auth.getUser()
      const user = auth.user
      if (!user || disposed) return

      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('id,vehicle_type,make,model,color,year,plate_number,seats,document_path')
        .eq('driver_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      const ht = localStorage.getItem('taxi-language') === 'ht'
      const title = oldSection.querySelector('h3') as HTMLElement | null
      if (!title) return
      title.childNodes.forEach((node) => { if (node.nodeType === Node.TEXT_NODE) node.textContent = ht ? 'Veyikil' : 'Véhicule' })

      let values = {
        type: vehicle?.vehicle_type || 'standard',
        make: vehicle?.make || '',
        model: vehicle?.model || '',
        color: vehicle?.color || '',
        year: vehicle?.year ? String(vehicle.year) : '',
        plate: vehicle?.plate_number || '',
        seats: vehicle?.seats ? String(vehicle.seats) : '',
      }
      let documentPath = vehicle?.document_path || ''
      let editing = !Boolean(values.make || values.model || values.plate)

      Array.from(oldSection.children).forEach((child) => { if (child !== title) child.remove() })
      const container = document.createElement('div')
      container.style.display = title.getAttribute('aria-expanded') === 'true' ? '' : 'none'
      container.style.paddingTop = '10px'
      oldSection.appendChild(container)

      const inputStyle = (el: HTMLInputElement | HTMLSelectElement) => Object.assign(el.style, {
        width: '100%', boxSizing: 'border-box', padding: '10px 11px', border: '1px solid #d8e2e8',
        borderRadius: '10px', background: '#fff', color: '#173246', fontSize: '14px', marginTop: '4px'
      })
      const buttonStyle = (button: HTMLButtonElement, primary = true) => Object.assign(button.style, {
        width: '100%', marginTop: '12px', padding: '11px 12px', borderRadius: '11px',
        border: primary ? '0' : '1px solid #cbd8df', background: primary ? '#0f765e' : '#fff',
        color: primary ? '#fff' : '#173246', fontWeight: '900', fontSize: '14px'
      })
      const displayRow = (label: string, value: string) => {
        const p = document.createElement('p'); p.style.margin = '7px 0'
        const s = document.createElement('span'); s.textContent = `${label}: `; s.style.color = '#71808f'
        const b = document.createElement('b'); b.textContent = value || '—'; b.style.color = '#173246'
        p.append(s,b); return p
      }
      const field = (label: string, input: HTMLInputElement | HTMLSelectElement) => {
        const wrap = document.createElement('label')
        Object.assign(wrap.style,{display:'block',margin:'9px 0',color:'#617180',fontSize:'12px',fontWeight:'700'})
        wrap.append(document.createTextNode(label),input); return wrap
      }

      const render = () => {
        container.innerHTML = ''
        const langHt = localStorage.getItem('taxi-language') === 'ht'
        if (!editing) {
          container.append(
            displayRow(langHt ? 'Kalite veyikil' : 'Type de véhicule', values.type === 'moto' ? 'Moto' : (langHt ? 'Machin' : 'Voiture')),
            displayRow(langHt ? 'Mak' : 'Marque', values.make),
            displayRow(langHt ? 'Modèl' : 'Modèle', values.model),
            displayRow(langHt ? 'Koulè' : 'Couleur', values.color),
            displayRow(langHt ? 'Ane' : 'Année', values.year),
            displayRow(langHt ? 'Plak' : 'Plaque', values.plate),
            displayRow(langHt ? 'Kantite plas' : 'Nombre de places', values.seats),
          )
          const doc = document.createElement('small')
          doc.textContent = documentPath ? (langHt ? '✓ Papye machin nan anrejistre' : '✓ Document du véhicule enregistré') : ''
          Object.assign(doc.style,{display:'block',marginTop:'8px',color:'#0f765e',fontSize:'11px'})
          container.appendChild(doc)
          const edit = document.createElement('button'); edit.type='button'; edit.textContent=langHt?'Modifye':'Modifier'; buttonStyle(edit)
          edit.onclick=()=>{editing=true;render()}; container.appendChild(edit); return
        }

        const type = document.createElement('select'); inputStyle(type)
        ;[['standard',langHt?'Machin':'Voiture'],['moto','Moto']].forEach(([v,l])=>{const o=document.createElement('option');o.value=v;o.textContent=l;if(values.type===v)o.selected=true;type.appendChild(o)})
        const make=document.createElement('input');make.value=values.make;inputStyle(make)
        const model=document.createElement('input');model.value=values.model;inputStyle(model)
        const color=document.createElement('input');color.value=values.color;inputStyle(color)
        const year=document.createElement('input');year.type='number';year.inputMode='numeric';year.value=values.year;inputStyle(year)
        const plate=document.createElement('input');plate.value=values.plate;inputStyle(plate)
        const seats=document.createElement('input');seats.type='number';seats.inputMode='numeric';seats.value=values.seats;inputStyle(seats)
        container.append(
          field(langHt?'Kalite veyikil':'Type de véhicule',type), field(langHt?'Mak':'Marque',make),
          field(langHt?'Modèl':'Modèle',model), field(langHt?'Koulè':'Couleur',color),
          field(langHt?'Ane':'Année',year), field(langHt?'Plak':'Plaque',plate),
          field(langHt?'Kantite plas':'Nombre de places',seats),
        )

        const file=document.createElement('input');file.type='file';file.accept='image/jpeg,image/png,image/webp,application/pdf';file.style.display='none'
        const upload=document.createElement('button');upload.type='button';upload.textContent=documentPath?(langHt?'Ranplase papye machin':'Remplacer les papiers'):(langHt?'Pran foto / Upload papye machin':'Photo / Fichier du véhicule');buttonStyle(upload,false)
        const status=document.createElement('small');status.textContent=documentPath?(langHt?'✓ Papye machin nan anrejistre':'✓ Document enregistré'):'';Object.assign(status.style,{display:'block',marginTop:'6px',color:'#0f765e',fontSize:'11px'})
        upload.onclick=()=>file.click()
        file.onchange=async()=>{
          const f=file.files?.[0]; if(!f || !vehicle) return
          if(f.size>10*1024*1024){status.textContent=langHt?'Fichye a depase 10 MB.':'Le fichier dépasse 10 Mo.';return}
          const mime=f.type;if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(mime)){status.textContent=langHt?'Fòma fichye a pa valab.':'Format de fichier non valide.';return}
          upload.disabled=true;status.textContent=langHt?'N ap voye…':'Envoi…'
          const ext=mime==='application/pdf'?'pdf':mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg'
          const path=`${user.id}/vehicle-document.${ext}`
          const {error:upErr}=await supabase.storage.from('driver-documents').upload(path,f,{upsert:true,contentType:mime})
          if(upErr){status.textContent=upErr.message;upload.disabled=false;return}
          const {error:saveErr}=await supabase.from('vehicles').update({document_path:path}).eq('id',vehicle.id)
          if(saveErr){status.textContent=saveErr.message;upload.disabled=false;return}
          documentPath=path;status.textContent=langHt?'✓ Papye machin nan anrejistre':'✓ Document enregistré';upload.disabled=false
        }
        container.append(upload,file,status)

        const save=document.createElement('button');save.type='button';save.textContent=langHt?'Anrejistre':'Enregistrer';buttonStyle(save)
        const msg=document.createElement('small');Object.assign(msg.style,{display:'block',minHeight:'16px',marginTop:'7px',fontSize:'11px',fontWeight:'700'})
        save.onclick=async()=>{
          if(!vehicle){msg.style.color='#a33';msg.textContent=langHt?'Pa gen veyikil aktif sou kont sa a.':'Aucun véhicule actif sur ce compte.';return}
          save.disabled=true;save.textContent=langHt?'N ap anrejistre…':'Enregistrement…'
          const next={type:type.value,make:make.value.trim(),model:model.value.trim(),color:color.value.trim(),year:year.value,plate:plate.value.trim(),seats:seats.value}
          const {error}=await supabase.from('vehicles').update({vehicle_type:next.type,make:next.make,model:next.model,color:next.color||null,year:next.year?Number(next.year):null,plate_number:next.plate,seats:next.seats?Number(next.seats):null}).eq('id',vehicle.id)
          if(error){msg.style.color='#a33';msg.textContent=error.message;save.disabled=false;save.textContent=langHt?'Anrejistre':'Enregistrer';return}
          values=next;editing=false;render()
        }
        container.append(save,msg)
      }

      const sync=()=>setTimeout(()=>{container.style.display=title.getAttribute('aria-expanded')==='true'?'':'none'},0)
      title.addEventListener('click',sync); title.addEventListener('keydown',sync)
      render()
    }

    void apply()
    const observer=new MutationObserver(()=>{void apply()})
    observer.observe(document.body,{childList:true,subtree:true})
    return()=>{disposed=true;observer.disconnect()}
  },[])

  return null
}
