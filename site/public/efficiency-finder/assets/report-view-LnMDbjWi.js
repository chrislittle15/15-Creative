import{a as e,i as t}from"./ui-BghfFf24.js";import{i as n,n as r,r as i,t as a}from"./math-DzdNnonG.js";var o={existing_tool:{label:`Tool you may already have`,cls:`badge-blue`},automation:{label:`Simple automation`,cls:`badge-purple`},ai_agent:{label:`AI agent`,cls:`badge-navy`},habit:{label:`Working habit`,cls:`badge-green`}},s={small:`Small effort`,medium:`Medium effort`,large:`Large effort`},c=e=>new Date(`${e}T12:00:00Z`).toLocaleDateString(`en-US`,{month:`short`,day:`numeric`,year:`numeric`});function l(e,t){return n(e,e=>r(e,t))}function u(t,n){let r=Math.max(0,Math.min(1,t)),a=2*Math.PI*42;return`<svg class="ring" viewBox="0 0 100 100" aria-hidden="true">
    <defs><linearGradient id="ringg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f46e5"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs>
    <circle cx="50" cy="50" r="42" fill="none" stroke="#e0e7ff" stroke-width="10"/>
    <circle cx="50" cy="50" r="42" fill="none" stroke="url(#ringg)" stroke-width="10" stroke-linecap="round"
      stroke-dasharray="${(a*r).toFixed(2)} ${a.toFixed(2)}" transform="rotate(-90 50 50)"/>
    <text x="50" y="55" text-anchor="middle" class="ring-text">${e(i(t,n).replace(/\.0%$/,`%`))}</text>
  </svg>`}function d(t,r){let i=t.math,o=e=>n(e,e=>a(e,r)),s=e=>Number.isInteger(e)?String(e):e<1?e.toFixed(2).replace(/0$/,``):e.toFixed(2).replace(/\.?0+$/,``),c=e=>e.low===e.high?s(e.low):`${s(e.low)}–${s(e.high)}`;return`<div class="math" hidden>
    <table>
      <tr><th>Each time</th><td>${e(i.durationLabel)}</td><td class="num">${c(i.duration)} h</td></tr>
      <tr><th>How often</th><td>${e(i.frequencyLabel)}</td><td class="num">× ${c(i.frequency)} per week</td></tr>
      <tr class="sum"><th>Hours per week</th><td>duration × frequency</td><td class="num">${o(i.hoursPerWeek)} h</td></tr>
      <tr><th>Share that can be saved</th><td>${i.sharePlaceholder?`Draft catalog value`:`Author's estimate from experience`}</td><td class="num">× ${(e=>`${Math.round(e.low*100)}–${Math.round(e.high*100)}%`)(i.share)}</td></tr>
      <tr class="sum total"><th>Hours saved per week</th><td>low × low, high × high</td><td class="num">${l(i.saved,r)} h</td></tr>
    </table>
    <p class="tiny muted">Computed in code from your taps and the catalog's range. No model produced these numbers.</p>
  </div>`}function f(n,r){let i=o[n.level];return`<article class="opp card rise">
    <div class="opp-head">
      <div class="rank" aria-label="Rank ${n.rank}">${n.rank}</div>
      <div class="opp-title">
        <h3>${e(n.taskName)}</h3>
        <div class="opp-badges"><span class="badge ${i.cls}">${e(i.label)}</span><span class="badge badge-slate">${e(s[n.effort])}</span></div>
      </div>
      <button class="saved" type="button" aria-expanded="false" title="Show the math">
        <span class="saved-num">${l(n.saved,r)}<small> h/wk</small></span>
        <span class="saved-label">${t.calc} See the math</span>
      </button>
    </div>
    ${d(n,r)}
    <blockquote class="quote"><span class="tiny muted">You said</span>“${e(n.quote)}”</blockquote>
    <div class="opp-grid">
      <div><div class="k">Pattern</div><div class="v">${e(n.patternName)}</div>${n.why?`<p class="small muted why">${e(n.why)}</p>`:``}</div>
      <div><div class="k">Tool${n.tool.owned?` <span class="badge badge-green">${t.check} You already use this</span>`:``}</div>
        <div class="v"><a href="${e(n.tool.url)}" target="_blank" rel="noopener noreferrer">${e(n.tool.name)} ${t.ext}</a></div>
        <div class="tiny muted">Link checked ${e(c(n.tool.checked))}</div></div>
      <div><div class="k">First step</div><div class="v small">${e(n.firstStep)}</div></div>
      <div><div class="k">Watch out for</div><div class="v small">${e(n.failureMode)}</div></div>
    </div>
  </article>`}function p(r,i,o={}){let c=r.opportunities,d=r.checked.rejected.length;return`<div class="report">
    <section class="report-hero">
      <div class="eyebrow">${o.sample?`Sample report`:`Your report`}</div>
      <h1>${o.sample?e(o.sample.title):`Here's where your week could get lighter`}</h1>
      ${o.sample?`<p class="muted">${e(o.sample.blurb)}</p>`:`<p class="muted">Every recommendation below ties to a task you confirmed and a pattern in the author's catalog. Hours are computed in code.</p>`}
      ${r.catalogDraft?`<div class="notice amber">${t.info}<div><strong>Draft catalog.</strong> Savings ranges and tool entries are working values awaiting the author's review, so treat the figures as placeholders.</div></div>`:``}
    </section>

    <section class="summary">
      <div class="stat card">${u(r.summary.weekCovered,i)}<div><div class="stat-label">of your ${e(r.weekHours)}-hour week mapped</div><div class="tiny muted">${e(r.summary.tasksMapped)} tasks, ${e(n(r.summary.mapped,e=>a(e,i)))} h per week</div></div></div>
      <div class="stat card stat-hero"><div class="stat-big">${c.length?l(r.summary.saved,i).replace(` to `,`–`):`0`}<small> h</small></div><div><div class="stat-label">could be saved per week</div><div class="tiny muted">Sum of the ranked opportunities. Estimates, not a guarantee.</div></div></div>
      <div class="stat card"><div class="stat-big">${c.length}</div><div><div class="stat-label">ranked ${c.length===1?`opportunity`:`opportunities`}</div><div class="tiny muted">${r.habits.length} working ${r.habits.length===1?`habit`:`habits`} to consider</div></div></div>
    </section>

    <section class="block">
      <div class="block-head"><h2>Ranked opportunities</h2><p class="muted small">Most hours saved first. Ties go to the smaller effort.</p></div>
      ${c.length?c.map(e=>f(e,i)).join(``):`<div class="empty card">No task had enough detail and a catalog fit to recommend. See below for what was held back and why.</div>`}
    </section>

    ${r.habits.length?`<section class="block">
      <div class="block-head"><h2>Working habits to consider</h2><p class="muted small">Suggested by simple rules on your cards, outside the ranking. No hours claimed.</p></div>
      <div class="habits">${r.habits.map(n=>`<article class="habit card rise">
        <div class="habit-top"><span class="badge badge-green">${t.heart} Working habit</span><span class="badge badge-slate">${e(s[n.effort])}</span></div>
        <h3>${e(n.name)}</h3>
        <div class="small muted because"><span>Because of</span>${n.becauseTasks.map(t=>`<span>${e(t)}</span>`).join(``)}</div>
        <p class="small"><strong>First step.</strong> ${e(n.firstStep)}</p>
        <p class="small muted"><strong>Watch out for.</strong> ${e(n.failureMode)}</p>
      </article>`).join(``)}</div></section>`:``}

    ${r.thin.length||r.noFit.length||r.notCounted.length?`<section class="block">
      <div class="block-head"><h2>Held back, on purpose</h2><p class="muted small">Nothing is stretched to fit. These tasks stay visible so you can see what the tool chose not to claim.</p></div>
      <div class="held">
        ${r.thin.length?`<div class="card held-col"><h3>${t.info} Not enough detail</h3><ul>${r.thin.map(t=>`<li><strong>${e(t.taskName)}</strong><span class="tiny muted">Might fit "${e(t.patternName)}", but ${e(t.missing.join(` and `))} ${t.missing.length>1?`were`:`was`} not recorded.</span></li>`).join(``)}</ul></div>`:``}
        ${r.noFit.length?`<div class="card held-col"><h3>${t.x} No pattern fit</h3><ul>${r.noFit.map(t=>`<li><strong>${e(t.taskName)}</strong><span class="tiny muted">No pattern in the catalog matches what you described.</span></li>`).join(``)}</ul></div>`:``}
        ${r.notCounted.length?`<div class="card held-col"><h3>${t.clock} Not counted</h3><ul>${r.notCounted.map(t=>`<li><strong>${e(t.taskName)}</strong><span class="tiny muted">Less than monthly, so it adds no weekly hours.</span></li>`).join(``)}</ul></div>`:``}
      </div></section>`:``}

    <section class="block">
      <div class="block-head"><h2>How this was checked</h2><p class="muted small">A reviewer made of rule checks in code read every proposed match before it reached this page.</p></div>
      <div class="checked card">
        <div class="checked-stats">
          <div><strong>${r.checked.proposals}</strong><span>matches proposed by the AI</span></div>
          <div><strong>${r.checked.passed}</strong><span>passed all seven rules</span></div>
          <div><strong>${r.checked.heldForDetail}</strong><span>held for missing detail</span></div>
          <div><strong>${d}</strong><span>rejected by the reviewer</span></div>
        </div>
        <ol class="rules">${r.checked.rules.map(n=>`<li><span>${e(n.name)}</span>${n.failures?`<span class="badge badge-amber">${n.failures} rejected</span>`:``}${n.id===3&&r.checked.heldForDetail?`<span class="badge badge-slate">${r.checked.heldForDetail} held for detail</span>`:``}${!n.failures&&!(n.id===3&&r.checked.heldForDetail)?`<span class="badge badge-green">${t.check} passed</span>`:``}</li>`).join(``)}</ol>
        ${d?`<div class="rejected"><div class="k">Rejected</div><ul>${r.checked.rejected.map(t=>`<li><strong>${e(t.taskName)}</strong> → ${e(t.patternName)}: ${t.reasons.map(t=>e(t.reason)).join(`; `)}</li>`).join(``)}</ul></div>`:``}
      </div>
    </section>
  </div>`}function m(e){e.querySelectorAll(`.opp .saved`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.closest(`.opp`).querySelector(`.math`),n=t.hidden;t.hidden=!n,e.setAttribute(`aria-expanded`,String(n))})})}export{m as n,p as t};