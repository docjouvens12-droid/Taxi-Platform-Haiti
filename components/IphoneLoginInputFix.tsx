'use client'

export default function IphoneLoginInputFix() {
  return <style>{`
    body.unified-public-entry-open .upe-shell,
    body.unified-public-entry-open .upe-card,
    body.unified-public-entry-open .upe-auth-form,
    body.unified-public-entry-open .upe-input {
      pointer-events:auto!important;
    }
    body.unified-public-entry-open .upe-input input {
      pointer-events:auto!important;
      user-select:text!important;
      -webkit-user-select:text!important;
      opacity:1!important;
      color:#102033!important;
      -webkit-text-fill-color:#102033!important;
      caret-color:#0f705a!important;
      font-size:16px!important;
      line-height:1.3!important;
      position:relative!important;
      z-index:2!important;
      touch-action:manipulation!important;
    }
    body.unified-public-entry-open .upe-input input:focus {
      outline:none!important;
    }
  `}</style>
}
