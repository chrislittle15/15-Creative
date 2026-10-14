import{a as e,i as t,o as n,r,s as i,t as a}from"./ui-BghfFf24.js";import{n as o}from"./samples-DzMi3zpz.js";import{i as s,n as c,s as l}from"./math-DzdNnonG.js";/* empty css               *//* empty css                */var u=l.settings,d=e=>s(e,e=>c(e,u)),f={existing_tool:`Tool you may already have`,automation:`Simple automation`,ai_agent:`AI agent`,habit:`Working habit`};async function p(){let s=await o(),c=i({links:[{href:r,label:`About this demo`,hideSm:!0},{href:`${r}samples/`,label:`All samples`},{href:`${r}app/`,label:`Try it yourself`}]}),l=`<div class="sample-ribbon">${t.flag} Sample team · generated from facts sheets, not real people</div>`;if(!s){a(`#page`).innerHTML=`${c}${l}<main class="wrap samples-main"><div class="panel"><h1>The sample rollup is being prepared</h1><p class="muted">It is built from the five sample team reports once they are generated and reviewed.</p></div></main>`;return}let u=s.members.reduce((e,t)=>({low:e.low+t.saved.low,high:e.high+t.saved.high}),{low:0,high:0}),p=Math.abs(u.low-s.total.low)<1e-9&&Math.abs(u.high-s.total.high)<1e-9;a(`#page`).innerHTML=`${c}${l}<main class="wrap samples-main">
    <div class="samples-head"><span class="eyebrow">Sample team rollup</span><h1>${e(s.team)}</h1>
      <p class="muted">Recommendations from the five sample team reports, grouped by catalog pattern in code. Shows which tasks repeat across people and what they add up to.</p></div>

    <section class="summary">
      <div class="stat card"><div class="stat-big">${s.members.length}</div><div><div class="stat-label">people</div><div class="tiny muted">sample roles</div></div></div>
      <div class="stat card stat-hero"><div class="stat-big">${d(s.total).replace(` to `,`–`)}<small> h</small></div><div><div class="stat-label">could be saved per week, team-wide</div><div class="tiny muted">Sum of members' ranked opportunities.</div></div></div>
      <div class="stat card"><div class="stat-big">${s.shared.length}</div><div><div class="stat-label">patterns shared by two or more people</div><div class="tiny muted">${s.rows.length} patterns in all</div></div></div>
    </section>

    <section class="block"><div class="block-head"><h2>One ranked list for the team</h2><p class="muted small">Most hours saved first; ties go to the smaller effort.</p></div>
      ${s.rows.map((n,r)=>`<article class="card roll-row">
        <div class="roll-row-head"><div class="rank">${r+1}</div><div><h3>${e(n.patternName)}</h3><div class="opp-badges"><span class="badge badge-blue">${e(f[n.level])}</span><span class="badge badge-slate">${n.people.length} ${n.people.length===1?`person`:`people`}</span>${n.people.length>1?`<span class="badge badge-purple">${t.users} Shared</span>`:``}</div></div>
        <div class="saved-num">${d(n.saved)}<small> h/wk</small></div></div>
        <ul class="roll-tasks">${n.tasks.map(t=>`<li><strong>${e(t.person)}</strong>: ${e(t.taskName)} <span class="muted">(${d(t.saved)} h/wk)</span></li>`).join(``)}</ul>
      </article>`).join(``)}
    </section>

    <section class="block"><div class="block-head"><h2>By person</h2></div>
      <div class="card table-wrap"><table class="roll-table">
        <thead><tr><th>Sample role</th><th class="num">Opportunities</th><th class="num">Hours saved per week</th></tr></thead>
        <tbody>${s.members.map(t=>`<tr><td>${e(t.person)}</td><td class="num">${t.opportunities}</td><td class="num">${d(t.saved)}</td></tr>`).join(``)}</tbody>
        <tfoot><tr><td>Team</td><td class="num">${s.members.reduce((e,t)=>e+t.opportunities,0)}</td><td class="num">${d(u)}</td></tr></tfoot>
      </table></div>
      <p class="check-line ${p?``:`bad`}">${p?t.check:t.x} ${p?`Rollup total equals the sum of the members' figures.`:`Rollup total does not match the members' figures.`}</p>
    </section>
  </main>${n()}`}p();