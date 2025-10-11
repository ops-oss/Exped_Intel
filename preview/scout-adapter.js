// /preview/scout-adapter.js
(function(){
  'use strict';
  const qs = new URLSearchParams(location.search);
  const clean = s => String(s||'').trim();

  function readScoutArray(){
    const el = document.getElementById('scout-data');
    if (el && el.textContent?.trim()) { try { return JSON.parse(el.textContent); } catch{} }
    const b64 = qs.get('scout');
    if (b64){ try { return JSON.parse(atob(b64)); } catch {} }
    return null;
  }
  function selectOption(list){
    if (!Array.isArray(list) || !list.length) return null;
    const want = qs.get('opt');
    return list.find(x => x.id === want) || list[0];
  }
  const split = (total,n) => Array.from({length:n},(_,i)=> i===n-1 ? +(total - (Math.round(total/n*10)/10)*(n-1)).toFixed(1)
                                                                : +(total/n).toFixed(1));
  const ft = n => (parseInt(n||0,10)||0).toLocaleString();

  function buildEI(o){
    const L=o.logistics||{}, S=o.intel_score||{};
    const days=+o.days||1, miles=+o.miles||0, up=+o.gain_ft||0, dn=+o.loss_ft||0;
    const mi=split(miles,days), ups=split(up,days), dns=split(dn,days);
    const hazards = Array.isArray(o.hazards)?o.hazards:[];
    const hazardsText = hazards.length?`Hazards: ${hazards.join(', ')}`:'';

    const ei = {
      title: clean(o.title),
      category: 'Backpacking',
      season: o.season_hint || 'Best in fall',
      location: clean(o.region),
      date: '',
      expedition_itinerary:{
        route: `${clean(o.title)}${o.route_type?` (${o.route_type})`:''}`,
        objective: 'Loop Hike',
        duration: `${days} day${days>1?'s':''}`,
        mileage: `${miles} miles`,
        experience: (S.physical_challenge>=7?'Advanced':S.physical_challenge>=5?'Intermediate':'Beginner–Friendly'),
        terrain: clean(o.terrain || 'Mixed forest & river'),
        elevation: `+${ft(up)} ft / -${ft(dn)} ft`,
        trailheads: 'Loop start = same as finish',
        gps: ''
      },
      permits_entry: (L.permit && /yes/i.test(L.permit)) ? `Overnight permit required: ${L.permit}`
                     : (L.permit ? `Permits: ${L.permit}` : 'No overnight permit required.'),
      shuttle_transportation: clean(L.transportation)||'',
      permit_timeline: `${L.permit_pressure?`Permit pressure: ${L.permit_pressure}.`:''}${L.trailhead_access?` Trailhead access: ${L.trailhead_access}.`:''}`,
      multi_trailhead: (o.route_type==='Loop')?'Not applicable (loop).':'',
      key_considerations: hazardsText || 'Standard backcountry risks; check weather.',
      campsite_intel: clean(L.campsites)||'',
      weather_altitude: `Season hint: ${o.season_hint||'—'}. ${hazards.includes('Weather changes')?'Weather can shift quickly near water; pack rain layers.':''}`,
      gear_checklist: '- Rain layer\n- Warm layers\n- Water treatment\n- Food storage as required\n- Map + compass/GPS\n- Trekking poles',
      optional_mod: '',
      risk_matrix: hazardsText || '',
      conditions_watch: hazardsText || 'Recent rain can make river-adjacent trails slick; check local reports.',
      bailout_summary: clean(L.exit_strategy)||'',
      emergency: 'Dial 911 (US). Know your trailhead/forest road names.',
      final_brief: `Two-day loop preview for ${o.title}. ~${miles} miles total, ~${ft(up)} ft climb. ${hazardsText}`,
      field_disclaimer: 'Preview only. Verify with official sources. Don’t rely on a single nav source.'
    };

    ei.days = Array.from({length:days},(_,i)=>({
      title: `Day ${i+1}: ${ i===0?'Trailhead → Riverside Camp' : (i===days-1?'Riverside Camp → Trailhead':`Camp ${i} → Camp ${i+1}`) }`,
      preview: i===0 ? 'Scenic river corridor; bridges/boardwalks. Peak fall color.'
              : i===days-1 ? 'Climb away from river benches; close the loop.'
              : 'Rolling hardwoods with occasional overlooks.',
      chips:{
        distance:`${mi[i]} miles`,
        elevation:`+${ft(ups[i])} ft / -${ft(dns[i])} ft`,
        campsite: (i<days-1) ? (/(abundant|plentiful)/i.test(L.campsites||'')?'Riverside dispersed':'Backcountry camp') : '',
        trail: clean(o.title),
        terrain: clean(o.terrain || 'Forest, river benches'),
        water: clean(L.water || 'Reliable along the river'),
        safety: hazards.join(', ')
      }
    }));
    return ei;
  }

  if (qs.has('src')) return;               // if you’re using ?src=… EI JSON, do nothing
  const scout = readScoutArray();          // inline or ?scout=
  if (!scout) return;
  const chosen = selectOption(scout);
  if (!chosen) return;

  window.EI_DATA = buildEI(chosen);        // hand to the viewer
  window.dispatchEvent(new CustomEvent('ei:data-ready'));
})();
