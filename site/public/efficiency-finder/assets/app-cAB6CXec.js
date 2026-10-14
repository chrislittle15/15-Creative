import{a as e,i as t,n,o as r,r as i,s as a,t as o}from"./ui-BghfFf24.js";import{a as s,i as c,o as l,s as u,t as d}from"./math-DzdNnonG.js";/* empty css               */import{n as f,t as p}from"./report-view-LnMDbjWi.js";function m(e){return/^\s*(not sure|unsure|don'?t know|do not know|no idea|n\/?a|it depends|not applicable|skip)\b\.?\s*$/i.test(e)}function h(e,t,n=[]){let r=e.map(e=>({...e,signals:{...e.signals}})),i=new Map(r.map(e=>[e.id,e]));for(let e of t){let t=i.get(e.taskId);if(t&&e.answer.trim()&&!m(e.answer))for(let n of e.fields)t.signals[n]=e.answer.trim()}for(let e of n){let n=i.get(e.taskId),r=t[e.answerNumber-1];n&&r?.answer.trim()&&!m(r.answer)&&!n.signals[e.field]&&(n.signals[e.field]=r.answer.trim())}return r}var g=u.settings,_=`${i}api`,v=`ef-interview-v1`,y=()=>({step:`start`,screen:0,title:``,industry:``,weekHours:g.default_week_hours,jd:``,cards:[],tools:[],history:[],recorded:[],questionsAsked:0,busy:!1}),b=x();function x(){try{let e=sessionStorage.getItem(v);if(!e)return y();let t={...y(),...JSON.parse(e),busy:!1,error:void 0};return t.step===`seeding`&&(t.step=`start`),t.step===`matching`&&(t.step=`drill`),t}catch{return y()}}function S(){try{sessionStorage.setItem(v,JSON.stringify(b))}catch{}}function C(e,t=!0){b={...b,...e},S(),t&&R()}var w=[{key:`most_days`,title:`What fills most of your days?`,sub:`Tick what applies, then tap how long it takes and how often. Use the arrows to put them in morning-to-afternoon order.`,freq:`daily`},{key:`weekly`,title:`What comes around each week?`,sub:`Tick the weekly work that applies to you.`,freq:`weekly`},{key:`monthly`,title:`Monthly or occasional work`,sub:`The things that come up once a month or now and then.`,freq:`monthly`}],T=Object.entries(g.durations),E=Object.entries(g.frequencies);function D(){let e=e=>e.screen===`most_days`?e.order:1e3+b.cards.indexOf(e);return h(b.cards.filter(e=>e.ticked&&e.duration&&e.frequency).sort((t,n)=>e(t)-e(n)).map((e,t)=>({id:e.id,name:e.name,screen:e.screen,order:e.screen===`most_days`?e.order:t,duration:e.duration,frequency:e.frequency,tool:e.tool,kind:e.kind,signals:e.tool?{tool:e.tool}:{}})),b.history,b.recorded)}var O=e=>c(e,e=>d(e,g));async function k(e,t){let n=await fetch(`${_}/${e}`,{method:`POST`,headers:{"content-type":`application/json`},body:JSON.stringify(t),credentials:`omit`}),r=await n.json().catch(()=>({}));if(n.status===429)throw Object.assign(Error(r.error),{code:r.code});if(!n.ok)throw Error(r.error||`Something went wrong. Please try again.`);return r}function A(e,t){let n=e;n.code===`daily_cap`||n.code===`interview_cap`||n.code===`unknown_interview`?C({step:`stopped`,busy:!1,stopped:{code:n.code,message:n.message}}):C({step:t,busy:!1,error:n.message||`Something went wrong. Please try again.`})}async function j(){if(!b.title.trim()||!b.industry.trim())C({error:`Add a job title and an industry to start.`});else{C({step:`seeding`,error:void 0,startedAt:Date.now()});try{let e=await k(`seed`,{title:b.title,industry:b.industry,weekHours:b.weekHours,jobDescription:b.jd||void 0}),t=0,n=e.cards.map(e=>({...e,ticked:!1,order:e.screen===`most_days`?t++:0}));window.scrollTo({top:0}),C({step:`tasks`,screen:0,interviewId:e.interviewId,cards:n,tools:e.tools,history:[],recorded:[],pending:void 0,questionsAsked:0,report:void 0})}catch(e){A(e,`start`)}}}async function M(e=!1){C({busy:!0,error:void 0});try{let t=await k(`interview`,{interviewId:b.interviewId,weekHours:b.weekHours,tasks:D(),history:b.history,finishNow:e}),n=[...b.recorded,...t.recorded];if(t.done)return C({recorded:n,pending:void 0,questionsAsked:t.questionsAsked},!1),P();C({busy:!1,recorded:n,pending:t.question,questionsAsked:t.questionsAsked})}catch(e){A(e,`drill`)}}async function N(e){let t=e.trim();t&&b.pending&&(C({history:[...b.history,{...b.pending,answer:t.slice(0,300)}],pending:void 0},!1),await M())}async function P(){C({step:`matching`,busy:!0,error:void 0}),window.scrollTo({top:0});try{let[e]=await Promise.all([k(`match`,{interviewId:b.interviewId,weekHours:b.weekHours,tasks:D(),history:b.history}),new Promise(e=>setTimeout(e,2600))]);C({step:`report`,busy:!1,report:e,finishedAt:Date.now()}),window.scrollTo({top:0})}catch(e){A(e,`drill`)}}function F(){try{sessionStorage.removeItem(v)}catch{}b=y(),R(),window.scrollTo({top:0})}var I=o(`#app`),L=``;function R(){let e=`${b.step}:${b.screen}:${b.pending?.question??``}`;I.classList.toggle(`no-anim`,e===L),L=e;let t={start:B,seeding:V,tasks:W,check:G,drill:K,matching:q,report:J,stopped:Y};I.innerHTML=`${a({links:[{href:i,label:`About this demo`},{href:`${i}samples/`,label:`Sample reports`,hideSm:!0}]})}
    <main class="main">${t[b.step]()}</main>${b.step===`report`||b.step===`start`?r():``}`,Z()}function z(e){return`<ol class="progress" aria-label="Progress">${[`Your role`,`Your week`,`A few questions`,`Your report`].map((n,r)=>`<li class="${r<e?`done`:r===e?`on`:``}"><span>${r<e?t.check:r+1}</span>${n}</li>`).join(``)}</ol>`}function B(){return`<div class="wrap wrap-narrow start rise">
    ${z(0)}
    <div class="start-head">
      <h1>Map your week. <span class="grad-text">Find the hours.</span></h1>
      <p class="lead">About five minutes. Tick the work you really do, answer a few short questions, and get a ranked list of where a tool you already have, a simple automation, an AI agent, or a habit change would save time.</p>
    </div>
    <form class="panel start-form" novalidate>
      <div class="two">
        <div class="field"><label for="title">Job title</label><input class="input" id="title" name="title" maxlength="${g.seed.title_max_chars}" autocomplete="organization-title" placeholder="e.g. Merchandise buyer" value="${e(b.title)}" required></div>
        <div class="field"><label for="industry">Industry</label><input class="input" id="industry" name="industry" maxlength="${g.seed.industry_max_chars}" placeholder="e.g. Resort retail" value="${e(b.industry)}" required></div>
      </div>
      <div class="field"><span class="label" id="hours-label">Typical hours in your work week</span>
        <div class="chips" role="group" aria-labelledby="hours-label">${[30,35,40,45,50,55,60].map(e=>`<button type="button" class="chip" data-hours="${e}" aria-pressed="${b.weekHours===e}">${e}</button>`).join(``)}</div>
      </div>
      <details class="jd" ${b.jd?`open`:``}>
        <summary>Add a job description <span class="muted">(optional, sharpens the first draft)</span></summary>
        <div class="field"><textarea class="textarea" id="jd" maxlength="${g.job_description_max_chars}" placeholder="Paste the responsibilities section. Leave out names and confidential details.">${e(b.jd)}</textarea>
        <span class="hint"><span id="jd-count">${b.jd.length}</span> / ${g.job_description_max_chars.toLocaleString()} characters</span></div>
      </details>
      <div class="notice slate privacy">${t.shield}<div>
        <strong>Before you start.</strong> Leave out confidential employer details and names of people or customers.
        Your answers are sent to Anthropic's AI service to produce the report, and this site does not keep them
        (<a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer">Anthropic's privacy policy</a>).
        Time savings are estimates from the author's experience, not guarantees.
      </div></div>
      ${b.error?`<div class="notice amber" role="alert">${t.info}<div>${e(b.error)}</div></div>`:``}
      <button class="btn btn-grad btn-block" type="submit">Draft my task cards ${t.arrow}</button>
    </form>
  </div>`}function V(){return`<div class="wrap wrap-narrow rise">
    ${z(1)}
    <div class="seeding panel">
      <div class="seeding-head"><span class="spinner"></span><div><h2>Drafting likely tasks for a ${e(b.title)}</h2>
      <p class="muted small">A low-cost model suggests cards to jog your memory. Nothing counts until you tick it.</p></div></div>
      <div class="skeletons">${Array.from({length:5},(e,t)=>`<div class="skel" style="animation-delay:${t*120}ms"></div>`).join(``)}</div>
    </div>
  </div>`}function H(){let e=D(),t=l(e.map(e=>s(e,g)),b.weekHours),n=Math.min(100,t.sumMidpoint/b.weekHours*100),r=t.overWeek;return`<div class="meter ${r?`over`:``}" aria-live="polite">
    <div class="meter-text"><strong>${e.length?O({low:t.sumLow,high:t.sumHigh}):`0`} h</strong> <span class="muted">of your ${b.weekHours}-hour week</span>${r?`<span class="badge badge-amber">Over your week</span>`:``}</div>
    <div class="meter-bar"><span style="width:${n.toFixed(1)}%"></span></div>
  </div>`}function U(n,r,i){let a=w[b.screen],o=!!b.error&&n.ticked&&(!n.duration||!n.frequency),s=[...new Set([...b.tools,...n.tool&&!b.tools.includes(n.tool)?[n.tool]:[]])],c=i.filter(e=>e.ticked),l=c.indexOf(n);return`<div class="tcard ${n.ticked?`on`:``} ${o?`missing`:``}" data-id="${e(n.id)}">
    <div class="tcard-row">
      <button type="button" class="tick" aria-pressed="${n.ticked}"><span class="box">${t.check}</span><span class="tname">${e(n.name)}</span>${n.custom?`<span class="badge badge-purple">Added by you</span>`:``}</button>
      ${n.ticked&&a.key===`most_days`&&c.length>1?`<div class="reorder"><button type="button" class="iconbtn" data-move="-1" aria-label="Move earlier" ${l===0?`disabled`:``}>${t.up}</button><button type="button" class="iconbtn" data-move="1" aria-label="Move later" ${l===c.length-1?`disabled`:``}>${t.down}</button></div>`:``}
    </div>
    ${n.ticked&&n.duration&&n.frequency&&b.openCard!==n.id?`<button type="button" class="tsummary" data-open>
      <span>${e(g.durations[n.duration].label)} · ${e(g.frequencies[n.frequency].label.toLowerCase())}${n.tool?` · ${e(n.tool)}`:``}</span><span class="tedit">Edit</span></button>`:``}
    ${n.ticked&&(!n.duration||!n.frequency||b.openCard===n.id)?`<div class="tcard-body">
      <div class="q"><span class="qlabel">Each time</span><div class="chips">${T.map(([t,r])=>`<button type="button" class="chip soft" data-dur="${t}" aria-pressed="${n.duration===t}">${e(r.label)}</button>`).join(``)}</div></div>
      <div class="q"><span class="qlabel">How often</span><div class="chips">${E.map(([t,r])=>`<button type="button" class="chip soft" data-freq="${t}" aria-pressed="${n.frequency===t}">${e(r.label)}</button>`).join(``)}</div></div>
      <div class="q"><span class="qlabel">Done in <span class="muted">(optional)</span></span><div class="chips">${s.map(t=>`<button type="button" class="chip soft" data-tool="${e(t)}" aria-pressed="${n.tool===t}">${e(t)}</button>`).join(``)}
        <input class="input tool-input" placeholder="Other tool…" maxlength="60" aria-label="Other tool" value=""></div></div>
      ${n.custom?`<div class="q"><span class="qlabel">Kind of work</span><div class="chips">${[`meeting`,`email`,`other`].map(e=>`<button type="button" class="chip soft" data-kind="${e}" aria-pressed="${n.kind===e}">${e===`other`?`Other work`:e[0].toUpperCase()+e.slice(1)}</button>`).join(``)}</div></div>`:``}
      ${o?`<p class="tiny warn">Tap how long and how often to count this task.</p>`:``}
    </div>`:``}
  </div>`}function W(){let n=w[b.screen],r=b.cards.filter(e=>e.screen===n.key);n.key===`most_days`&&(r=[...r].sort((e,t)=>Number(t.ticked)-Number(e.ticked)||e.order-t.order));let i=r.filter(e=>e.ticked).length,a=b.cards.some(e=>e.ticked&&e.duration&&e.frequency);return`<div class="wrap wrap-narrow tasks rise">
    ${z(1)}
    <div class="screens" role="tablist">${w.map((e,t)=>`<button type="button" role="tab" class="screen-tab ${t===b.screen?`on`:``}" data-screen="${t}" aria-selected="${t===b.screen}"><span>${t+1}</span>${[`Most days`,`Weekly`,`Monthly or occasional`][t]}</button>`).join(``)}</div>
    <div class="tasks-head"><h1>${e(n.title)}</h1><p class="muted">${e(n.sub)}</p></div>
    <div class="tlist">${r.map((e,t)=>U(e,t,r)).join(``)||`<p class="muted">No suggestions here. Add your own below.</p>`}</div>
    <form class="addown"><input class="input" id="addown" maxlength="60" placeholder="Add your own ${[`daily`,`weekly`,`monthly or occasional`][b.screen]} task" aria-label="Add your own task"><button class="btn btn-secondary" type="submit">${t.plus} Add</button></form>
    <p class="tiny muted">${i} ticked on this screen. Cards you leave unticked are dropped and never reach your report.</p>
    ${b.error?`<div class="notice amber" role="alert">${t.info}<div>${e(b.error)}</div></div>`:``}
    <div class="dock"><div class="wrap wrap-narrow dock-inner">
      ${H()}
      <div class="dock-actions">
        ${b.screen>0?`<button type="button" class="btn btn-ghost" data-nav="-1">${t.back} Back</button>`:`<button type="button" class="btn btn-ghost" data-restart>${t.back} Start</button>`}
        <button type="button" class="btn btn-primary" data-nav="1" ${b.screen===2&&!a?`disabled`:``}>${b.screen<2?`Next`:`Done`} ${t.arrow}</button>
      </div>
    </div></div>
  </div>`}function G(){let n=D(),r=l(n.map(e=>s(e,g)),b.weekHours),i=[...n].sort((e,t)=>s(t,g).hoursPerWeek.high-s(e,g).hoursPerWeek.high||0).filter(e=>s(e,g).counted).slice(0,6),a=[45,50,55,60,70,80].filter(e=>e>b.weekHours);return`<div class="wrap wrap-narrow rise">
    ${z(1)}
    <div class="panel check">
      <span class="badge badge-amber">${t.clock} Hours check</span>
      <h1>Your cards add up to more than your ${b.weekHours}-hour week</h1>
      <p class="muted">At the high end they total <strong>${O({low:r.sumHigh,high:r.sumHigh})} hours</strong>. That usually means a duration or frequency is set a bit high. Adjust the cards, or tell us your week is longer.</p>
      <ul class="check-list">${i.map(t=>`<li><span>${e(t.name)}</span><span class="muted">${e(g.durations[t.duration].label)} · ${e(g.frequencies[t.frequency].label.toLowerCase())}</span><strong>${O(s(t,g).hoursPerWeek)} h</strong></li>`).join(``)}</ul>
      <div class="check-actions">
        <button type="button" class="btn btn-primary" data-adjust>${t.back} Adjust my cards</button>
      </div>
      ${a.length?`<div class="field"><span class="label">Or: my week is really</span><div class="chips">${a.map(e=>`<button type="button" class="chip" data-week="${e}">${e} hours</button>`).join(``)}</div></div>`:``}
    </div>
  </div>`}function K(){let n=g.agent.max_questions,r=b.questionsAsked,i=b.pending,a=i?D().find(e=>e.id===i.taskId):void 0;return`<div class="wrap wrap-narrow drill rise">
    ${z(2)}
    <div class="drill-head">
      <div><h1>A few questions about your biggest tasks</h1><p class="muted small">Up to ${n} questions. Facts only, no advice yet.</p></div>
      <button type="button" class="btn btn-secondary btn-sm" data-finish ${b.busy?`disabled`:``}>Finish now</button>
    </div>
    <div class="dots" aria-label="Question ${r} of up to ${n}">${Array.from({length:n},(e,t)=>`<span class="${t<r-+!!i?`done`:t===r-1&&i?`on`:``}"></span>`).join(``)}</div>
    ${b.error?`<div class="notice amber" role="alert">${t.info}<div>${e(b.error)} <button type="button" class="linklike" data-retry>Try again</button></div></div>`:``}
    ${b.busy||!i?`<div class="qcard card thinking"><span class="spinner"></span><div><strong>${r?`Choosing the next question`:`Looking at your biggest tasks`}</strong><p class="small muted">The interviewer picks which task and which gap to ask about next.</p></div></div>`:`
    <div class="qcard card rise">
      ${a?`<span class="badge badge-blue">${t.target} ${e(a.name)}</span>`:``}
      <h2>${e(i.question)}</h2>
      <div class="opts">${i.options.map((t,n)=>`<button type="button" class="opt" data-opt="${n}">${e(t)}</button>`).join(``)}</div>
      <form class="free"><input class="input" id="free" maxlength="300" placeholder="Or type your own answer" aria-label="Your own answer"><button class="btn btn-primary" type="submit" aria-label="Send">${t.arrow}</button></form>
    </div>`}
    ${b.history.length?`<details class="sofar"><summary>Your answers so far (${b.history.length})</summary><ol>${b.history.map(t=>`<li><span class="muted small">${e(t.question)}</span><strong>${e(t.answer)}</strong></li>`).join(``)}</ol></details>`:``}
  </div>`}function q(){let e=[[`AI proposes a catalog pattern for each task`,t.sparkle],[`Code checks each pattern's required details`,t.layers],[`Code computes hours from your taps`,t.calc],[`Reviewer runs seven rule checks`,t.shield]];return`<div class="wrap wrap-narrow rise">
    ${z(3)}
    <div class="panel matching">
      <h1>Building your report</h1>
      <p class="muted">The model only proposes. Code decides what you see.</p>
      <ol class="msteps">${e.map(([e,n],r)=>`<li style="animation-delay:${r*600}ms"><span class="mico">${n}</span><span>${e}</span><span class="mcheck">${t.check}</span></li>`).join(``)}</ol>
    </div>
  </div>`}function J(){let e=b.report,n=b.startedAt&&b.finishedAt?Math.max(1,Math.round((b.finishedAt-b.startedAt)/6e4)):null;return`<div class="wrap rise report-wrap">
    <div class="report-actions no-print">
      <span class="muted small">${n?`Finished in about ${n} minute${n>1?`s`:``}. `:``}Nothing was stored. Print or save as PDF to keep it.</span>
      <div class="ra-btns">
        <button type="button" class="btn btn-secondary btn-sm" data-print>${t.print} Print or save PDF</button>
        <button type="button" class="btn btn-ghost btn-sm" data-restart>${t.refresh} Start over</button>
        <button type="button" class="btn btn-ghost btn-sm" data-private hidden>Save to private folder</button>
      </div>
    </div>
    ${e.thin.length&&b.questionsAsked<g.agent.max_questions?`<div class="more no-print"><div>
      <strong>${e.thin.length} ${e.thin.length===1?`task is`:`tasks are`} one or two answers away from a recommendation.</strong>
      <span class="muted small">You have ${g.agent.max_questions-b.questionsAsked} question${g.agent.max_questions-b.questionsAsked===1?``:`s`} left. Answer a few more and the report rebuilds.</span></div>
      <button type="button" class="btn btn-primary btn-sm" data-more>Answer more ${t.arrow}</button></div>`:``}
    ${p(e,g)}
    <div class="panel next no-print">
      <div><h2>See how it reads for other roles</h2><p class="muted">Eight sample reports and a sample team rollup, built with the same pipeline.</p></div>
      <a class="btn btn-primary" href="${i}samples/">Browse sample reports ${t.arrow}</a>
    </div>
  </div>`}function Y(){let n=b.stopped,r=n.code===`daily_cap`;return`<div class="wrap wrap-narrow rise"><div class="panel stopped">
    <span class="badge badge-amber">${t.info} ${r?`Daily limit reached`:n.code===`interview_cap`?`Cost limit reached`:`Interview expired`}</span>
    <h1>${r?`Today's demo budget is used up`:n.code===`interview_cap`?`This interview hit its cost limit`:`Let's start fresh`}</h1>
    <p class="muted">${r?`This demo caps what it spends on AI each day. It resets at midnight UTC. In the meantime, the sample reports show exactly what a finished report looks like.`:n.code===`interview_cap`?`Each interview has a small spending cap so a public demo stays affordable. The run stopped before going over it. The sample reports show what a finished report looks like.`:e(n.message)}</p>
    <div class="check-actions"><a class="btn btn-primary" href="${i}samples/">See the sample reports ${t.arrow}</a><button type="button" class="btn btn-ghost" data-restart>Start over</button></div>
  </div></div>`}function X(e,t){C({cards:b.cards.map(n=>n.id===e?{...n,...t}:n),error:void 0})}function Z(){if(n(`[data-restart]`).forEach(e=>e.addEventListener(`click`,F)),b.step===`start`){let e=o(`.start-form`),t=()=>{b.title=o(`#title`).value,b.industry=o(`#industry`).value,b.jd=o(`#jd`).value,S()};e.addEventListener(`input`,()=>{t(),o(`#jd-count`).textContent=String(b.jd.length)}),n(`[data-hours]`).forEach(e=>e.addEventListener(`click`,()=>{t(),C({weekHours:Number(e.dataset.hours)})})),e.addEventListener(`submit`,e=>{e.preventDefault(),t(),j()})}b.step===`tasks`&&(n(`.tcard`).forEach(e=>{let t=e.dataset.id,r=b.cards.find(e=>e.id===t);o(`.tick`,e).addEventListener(`click`,()=>{let e=!r.ticked;C({openCard:e?t:void 0},!1),X(t,e?{ticked:e,frequency:r.frequency??w[b.screen].freq}:{ticked:e})}),o(`[data-open]`,e)?.addEventListener(`click`,()=>C({openCard:t})),n(`[data-dur]`,e).forEach(e=>e.addEventListener(`click`,()=>X(t,{duration:e.dataset.dur}))),n(`[data-freq]`,e).forEach(e=>e.addEventListener(`click`,()=>X(t,{frequency:e.dataset.freq}))),n(`[data-tool]`,e).forEach(e=>e.addEventListener(`click`,()=>X(t,{tool:r.tool===e.dataset.tool?void 0:e.dataset.tool}))),n(`[data-kind]`,e).forEach(e=>e.addEventListener(`click`,()=>X(t,{kind:e.dataset.kind})));let i=e.querySelector(`.tool-input`);i?.addEventListener(`keydown`,e=>{if(e.key===`Enter`&&i.value.trim()){e.preventDefault();let n=i.value.trim();C({tools:b.tools.includes(n)?b.tools:[...b.tools,n]},!1),X(t,{tool:n})}}),i?.addEventListener(`blur`,()=>{let e=i.value.trim();e&&(C({tools:b.tools.includes(e)?b.tools:[...b.tools,e]},!1),X(t,{tool:e}))}),n(`[data-move]`,e).forEach(e=>e.addEventListener(`click`,()=>Q(t,Number(e.dataset.move))))}),n(`[data-screen]`).forEach(e=>e.addEventListener(`click`,()=>{C({screen:Number(e.dataset.screen),error:void 0}),window.scrollTo({top:0})})),o(`.addown`).addEventListener(`submit`,e=>{e.preventDefault();let t=o(`#addown`).value.trim();if(!t)return;let n=w[b.screen].key,r=Math.max(-1,...b.cards.filter(e=>e.screen===n).map(e=>e.order))+1,i=`u${Date.now().toString(36)}`;C({openCard:i,cards:[...b.cards,{id:i,name:t,screen:n,kind:`other`,custom:!0,ticked:!0,frequency:w[b.screen].freq,order:r}]}),o(`#addown`)?.focus()}),n(`[data-nav]`).forEach(e=>e.addEventListener(`click`,()=>{let t=Number(e.dataset.nav);if(t>0){let e=b.cards.filter(e=>e.screen===w[b.screen].key&&e.ticked&&(!e.duration||!e.frequency));if(e.length){C({error:`Tap how long and how often for: ${e.map(e=>e.name).join(`, `)}. Or untick ${e.length>1?`them`:`it`}.`});return}}t>0&&b.screen===2?$():(C({screen:b.screen+t,error:void 0}),window.scrollTo({top:0}))}))),b.step===`check`&&(o(`[data-adjust]`).addEventListener(`click`,()=>C({step:`tasks`,screen:0})),n(`[data-week]`).forEach(e=>e.addEventListener(`click`,()=>{C({weekHours:Number(e.dataset.week)},!1),$()}))),b.step===`drill`&&(o(`[data-finish]`)?.addEventListener(`click`,()=>M(!0)),o(`[data-retry]`)?.addEventListener(`click`,()=>M()),n(`[data-opt]`).forEach(e=>e.addEventListener(`click`,()=>N(b.pending.options[Number(e.dataset.opt)]))),o(`.free`)?.addEventListener(`submit`,e=>{e.preventDefault(),N(o(`#free`).value)}),!b.pending&&!b.busy&&!b.error&&M()),b.step===`report`&&(f(I),o(`[data-print]`).addEventListener(`click`,()=>window.print()),o(`[data-more]`)?.addEventListener(`click`,()=>{C({step:`drill`,pending:void 0,busy:!1,error:void 0}),window.scrollTo({top:0})}),o(`[data-private]`))}function Q(e,t){let n=b.cards.filter(e=>e.screen===`most_days`&&e.ticked).sort((e,t)=>e.order-t.order),r=n.findIndex(t=>t.id===e),i=r+t;if(i<0||i>=n.length)return;let a=n[r].order,o=n[i].order;C({cards:b.cards.map(e=>e.id===n[r].id?{...e,order:o}:e.id===n[i].id?{...e,order:a}:e)})}function $(){let e=D();if(!e.length){C({error:`Tick at least one task and tap how long and how often.`});return}let t=l(e.map(e=>s(e,g)),b.weekHours);window.scrollTo({top:0}),t.overWeek?C({step:`check`,error:void 0}):C({step:`drill`,error:void 0,pending:void 0})}R();