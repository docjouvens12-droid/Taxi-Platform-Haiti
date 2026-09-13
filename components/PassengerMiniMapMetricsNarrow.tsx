'use client'

export default function PassengerMiniMapMetricsNarrow() {
  return <style>{`
    .passenger-live-top-map .passenger-live-top-map-metrics{
      left:8px!important;
      top:64px!important;
      width:150px!important;
      grid-template-rows:40px 18px!important;
      border-radius:11px!important;
    }
    .passenger-live-top-map .passenger-live-top-map-metric{
      padding:5px 6px 4px!important;
    }
    .passenger-live-top-map .passenger-live-top-map-metric span{
      font-size:5.2px!important;
      letter-spacing:.01em!important;
    }
    .passenger-live-top-map .passenger-live-top-map-metric strong{
      margin-top:2px!important;
      font-size:12px!important;
    }
    .passenger-live-top-map .trip-endpoints{
      gap:5px!important;
      padding:0 5px!important;
      font-size:5px!important;
    }
    .passenger-live-top-map .trip-endpoints b{
      width:4px!important;
      height:4px!important;
    }
    .passenger-live-top-map .passenger-live-top-map-frame{
      bottom:50px!important;
      display:flex!important;
      align-items:center!important;
      justify-content:center!important;
      padding-top:28px!important;
      box-sizing:border-box!important;
      background:#dfe9e5!important;
    }
    .passenger-live-top-map .passenger-live-top-map-frame img{
      width:100%!important;
      height:calc(100% - 28px)!important;
      object-fit:contain!important;
      object-position:center center!important;
      background:#dfe9e5!important;
    }
    .passenger-live-top-map .passenger-live-top-map-pills{
      bottom:8px!important;
      left:8px!important;
      right:8px!important;
      gap:4px!important;
    }
    .passenger-live-top-map .passenger-live-top-map-pill{
      padding:4px 6px!important;
      font-size:6.5px!important;
    }
  `}</style>
}
