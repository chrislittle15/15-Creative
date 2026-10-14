import{a as e,i as t,o as n,r,s as i,t as a}from"./ui-BghfFf24.js";import{a as o,i as s,r as c,t as l}from"./samples-DzMi3zpz.js";import{s as u}from"./math-DzdNnonG.js";/* empty css               */import{n as d,t as f}from"./report-view-LnMDbjWi.js";/* empty css                */var p=u.settings,m=new URLSearchParams(location.search).get(`role`),h=a(`#page`),g=`<div class="sample-ribbon">${t.flag} Sample · generated from a facts sheet, not a real person's answers</div>`,_=i({links:[{href:r,label:`About this demo`,hideSm:!0},{href:`${r}samples/`,label:`All samples`},{href:`${r}app/`,label:`Try it yourself`}]});async function v(){if(!m){let e=await s();h.innerHTML=`${_}${g}<main class="wrap samples-main">
      <div class="samples-head"><span class="eyebrow">Samples</span><h1>Sample reports</h1>
      <p class="muted">Eight generalized roles, each answered by a low-cost model from ${l(e)}, then run through the same interview, matching and reviewer as the live demo. Some roles carry planted traps to show what the tool refuses to claim.</p></div>
      <div class="sample-grid">${o(e)}</div>
    </main>${n()}`;return}let i=await c(m);i?(h.innerHTML=`${_}${g}<main class="wrap samples-main">
    <div class="no-print back"><a href="${r}samples/">${t.back} All samples</a></div>
    ${f(i.report,p,{sample:{title:i.meta.title,blurb:`${i.meta.industry}. ${i.meta.blurb}`}})}
    <section class="block made">
      <div class="block-head"><h2>How this sample was made</h2></div>
      <div class="made-grid">
        <div class="card made-col"><h3>${t.chat} The interview</h3>
          <p class="small muted">The drill-down agent asked ${i.run.questions} question${i.run.questions===1?``:`s`}. A low-cost model answered each one using only this role's facts sheet.</p>
          <ol class="transcript">${i.transcript.map(t=>`<li><span class="tiny muted">${e(t.taskName)}</span><span>${e(t.question)}</span><strong>${e(t.answer)}</strong></li>`).join(``)}</ol>
        </div>
        <div class="card made-col"><h3>${t.flag} Planted traps</h3>
          ${i.meta.traps.length?`<ul>${i.meta.traps.map(t=>`<li>${e(t)}</li>`).join(``)}</ul>`:`<p class="small muted">None for this role.</p>`}
          ${i.run.overWeek?`<p class="small"><span class="badge badge-amber">${t.clock} Hours check triggered</span> The cards added up to more than the stated week, so the visitor was asked to adjust.</p>`:``}
          <p class="tiny muted">${i.meta.approved?`Facts sheet approved by the author.`:`Facts sheet is a draft awaiting the author's review.`}</p>
        </div>
      </div>
    </section>
  </main>${n()}`,d(h)):h.innerHTML=`${_}${g}<main class="wrap samples-main"><div class="panel"><h1>Sample not found</h1><p class="muted"><a href="${r}samples/">Back to all samples</a></p></div></main>`}v();