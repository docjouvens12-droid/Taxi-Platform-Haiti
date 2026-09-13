'use client'

export default function PassengerCompletionPolish(){
  return <style>{`
    .receiptBackdrop{
      background:rgba(7,24,20,.58)!important;
      backdrop-filter:blur(8px)!important;
      -webkit-backdrop-filter:blur(8px)!important;
    }
    .receiptBackdrop .receiptCard{
      width:min(calc(100vw - 18px),470px)!important;
      border-radius:28px!important;
      border:1px solid #dce9e4!important;
      background:#fff!important;
      box-shadow:0 28px 80px rgba(8,34,27,.30)!important;
    }
    .receiptBackdrop .check{
      width:54px!important;
      height:54px!important;
      background:linear-gradient(145deg,#e9f7f2,#dff2eb)!important;
      color:#0f705a!important;
      box-shadow:0 8px 22px rgba(15,112,90,.14)!important;
    }
    .receiptBackdrop .eyebrow{color:#0f705a!important}
    .receiptBackdrop .route{
      background:#f8fbfa!important;
      border-color:#dfeae6!important;
      border-radius:18px!important;
    }
    .receiptBackdrop .summary{gap:8px!important}
    .receiptBackdrop .summary>div{
      background:#17382f!important;
      border-radius:17px!important;
    }
    .receiptBackdrop .summary .fareBlock{
      background:linear-gradient(135deg,#13836a,#0f705a)!important;
      box-shadow:0 8px 20px rgba(15,112,90,.16)!important;
    }
    .receiptBackdrop .ratingBox{
      background:#f3f8f6!important;
      border:1px solid #deebe6!important;
      border-radius:18px!important;
    }
    .receiptBackdrop .stars button{
      min-height:48px!important;
      border-radius:13px!important;
      box-shadow:inset 0 0 0 1px #dfe9e5!important;
    }
    .receiptBackdrop .stars button.selected{
      background:#fff8df!important;
      box-shadow:inset 0 0 0 1px #efd167!important;
    }
    .receiptBackdrop textarea{
      font-size:16px!important;
      border-color:#d8e6e1!important;
    }
    .receiptBackdrop textarea:focus{
      border-color:#68aa96!important;
      box-shadow:0 0 0 3px rgba(15,112,90,.10)!important;
    }
    .receiptBackdrop .submit{
      min-height:50px!important;
      border-radius:15px!important;
      background:linear-gradient(135deg,#13836a,#0f705a)!important;
      box-shadow:0 10px 22px rgba(15,112,90,.18)!important;
    }
    .receiptBackdrop .close{
      min-height:48px!important;
      border-radius:15px!important;
      background:#eef4f1!important;
      color:#29473e!important;
    }
    .receiptBackdrop .success{color:#0f705a!important}
    @media(max-width:520px){
      .receiptBackdrop{align-items:flex-end!important;padding:7px!important;padding-bottom:calc(7px + env(safe-area-inset-bottom))!important}
      .receiptBackdrop .receiptCard{width:100%!important;max-height:94dvh!important;border-radius:27px 27px 20px 20px!important;padding:16px!important}
      .receiptBackdrop .stars{gap:5px!important}
      .receiptBackdrop .stars button{height:48px!important;font-size:28px!important}
    }
    @media(min-width:700px){
      .receiptBackdrop{align-items:center!important}
      .receiptBackdrop .receiptCard{border-radius:30px!important}
    }
  `}</style>
}
