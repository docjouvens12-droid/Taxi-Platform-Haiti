'use client'

import { useEffect } from 'react'

export default function DriverPayoutEditPolish(){
  useEffect(()=>{
    if(window.location.pathname!=='/driver/dashboard') return

    const apply=()=>{
      const paymentSections=Array.from(document.querySelectorAll<HTMLElement>('.dfm-section'))
      const section=paymentSections.find(el=>{
        const text=(el.querySelector('.dfm-trigger')?.textContent||'').toLowerCase()
        return text.includes('peman')||text.includes('paiements')
      })
      if(!section) return

      section.querySelectorAll<HTMLElement>('.dfm-method').forEach(method=>{
        const inputs=Array.from(method.querySelectorAll<HTMLInputElement>('input'))
        const save=method.querySelector<HTMLButtonElement>('.dfm-primary')
        if(inputs.length<2||!save) return

        let edit=method.querySelector<HTMLButtonElement>('.dfm-payout-edit')
        const hasSavedValues=inputs.every(input=>input.value.trim().length>0)

        if(!edit){
          edit=document.createElement('button')
          edit.type='button'
          edit.className='dfm-primary dfm-payout-edit'
          edit.style.background='#eef5f3'
          edit.style.color='#0f6f59'
          edit.textContent=(localStorage.getItem('taxi-language')==='ht')?'Modifye':'Modifier'
          edit.addEventListener('click',()=>{
            inputs.forEach(input=>{input.disabled=false;input.readOnly=false})
            save.style.display='block'
            if(edit) edit.style.display='none'
            inputs[0]?.focus()
          })
          save.insertAdjacentElement('afterend',edit)
        }

        if(hasSavedValues && !method.dataset.payoutEditing){
          inputs.forEach(input=>{input.disabled=true})
          save.style.display='none'
          edit.style.display='block'
        }else if(!hasSavedValues){
          inputs.forEach(input=>{input.disabled=false})
          save.style.display='block'
          edit.style.display='none'
        }

        if(!save.dataset.payoutEditBound){
          save.dataset.payoutEditBound='true'
          save.addEventListener('click',()=>{
            method.dataset.payoutEditing=''
            window.setTimeout(()=>{
              const filled=inputs.every(input=>input.value.trim().length>0)
              if(filled){
                inputs.forEach(input=>{input.disabled=true})
                save.style.display='none'
                if(edit) edit.style.display='block'
              }
            },700)
          })
        }
      })
    }

    apply()
    const observer=new MutationObserver(apply)
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']})
    return()=>observer.disconnect()
  },[])

  return null
}
