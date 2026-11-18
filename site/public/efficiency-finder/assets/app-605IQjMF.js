import{a as e,i as t,n,o as r,r as i,s as a,t as o}from"./ui-BghfFf24.js";import{a as s,i as c,o as l,s as u,t as d}from"./math-DzdNnonG.js";/* empty css               */import{n as f,t as p}from"./report-view-LnMDbjWi.js";var m=[`tool`,`volume`,`input`,`output`];function h(e){return/^\s*(not sure|unsure|don'?t know|do not know|no idea|n\/?a|it depends|not applicable|skip)\b\.?\s*$/i.test(e)}function ee(e,t,n=[]){let r=e.map(e=>({...e,signals:{...e.signals}})),i=new Map(r.map(e=>[e.id,e]));for(let e of t){let t=i.get(e.taskId);if(t&&e.answer.trim()&&!h(e.answer))for(let n of e.fields)t.signals[n]=e.answer.trim()}for(let e of n){let n=i.get(e.taskId),r=t[e.answerNumber-1];n&&r?.answer.trim()&&!h(r.answer)&&!n.signals[e.field]&&(n.signals[e.field]=r.answer.trim())}return r}var g=[{group:`Email and calendar`,tools:[`Outlook`,`Gmail`,`Google Calendar`,`Apple Mail`]},{group:`Documents and notes`,tools:[`Word`,`Google Docs`,`Notion`,`Confluence`,`OneNote`]},{group:`Spreadsheets and data`,tools:[`Excel`,`Google Sheets`,`Airtable`,`Power BI`,`Tableau`]},{group:`Chat and meetings`,tools:[`Teams`,`Slack`,`Zoom`,`Google Meet`]},{group:`Files`,tools:[`SharePoint`,`OneDrive`,`Google Drive`,`Dropbox`,`Box`]},{group:`Projects and tasks`,tools:[`Asana`,`Jira`,`Monday.com`,`Trello`,`Smartsheet`]},{group:`Sales and customers`,tools:[`Salesforce`,`HubSpot`,`Zendesk`,`LinkedIn`]},{group:`Finance and operations`,tools:[`QuickBooks`,`NetSuite`,`SAP`,`Workday`,`Shopify`]},{group:`AI assistants`,tools:[`ChatGPT`,`Claude`,`Microsoft Copilot`,`Gemini`]},{group:`Design and content`,tools:[`Canva`,`Figma`,`Adobe Creative Cloud`]}],_=g.flatMap(e=>e.tools);function v(e){let t=` ${e.toLowerCase()} `;return _.filter(e=>{let n=e.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g,`\\$&`);return RegExp(`[^a-z0-9]${n}[^a-z0-9]`).test(t)})}var y=u.settings,b=`${i}api`,x=`ef-interview-v2`,S=()=>({step:`start`,screen:0,title:``,industry:``,weekHours:y.default_week_hours,jd:``,purpose:``,tools:[],toolsFromJd:[],cards:[],history:[],recorded:[],factEdits:{},questionsAsked:0,questionsDone:!1,busy:!1}),C=te();function te(){try{let e=sessionStorage.getItem(x);if(!e)return S();let t={...S(),...JSON.parse(e),busy:!1,error:void 0};return t.step===`seeding`&&(t.step=`tools`),t.step===`matching`&&(t.step=`review`),t}catch{return S()}}function w(){try{sessionStorage.setItem(x,JSON.stringify(C))}catch{}}function T(e,t=!0){C={...C,...e},w(),t&&V()}var E=[{key:`most_days`,tab:`Daily`,title:`Your daily work`,addLabel:`daily`,sub:`Things you do every day or nearly every day. Tick what applies, tap how long and which tools, and use the arrows to put them in morning-to-afternoon order.`,freqs:[{key:`daily`,label:`Every day`},{key:`few_week`,label:`A few days a week`}]},{key:`weekly`,tab:`Weekly`,title:`Your weekly work`,addLabel:`weekly`,sub:`Things that come around once or a few times a week.`,freqs:[{key:`weekly`,label:`Once a week`},{key:`few_week`,label:`A few times a week`}]},{key:`monthly`,tab:`Monthly`,title:`Your monthly work`,addLabel:`monthly`,sub:`Things you do about once a month, like month-end reports or invoices.`,freqs:[{key:`monthly`,label:`Monthly`}]},{key:`occasional`,tab:`Occasional`,title:`Occasional and one-off work`,addLabel:`occasional`,sub:`Quarterly, yearly or now-and-then work, like planning, reviews or audits.`,freqs:[{key:`lt_monthly`,label:`Less than monthly`}],note:`Listed in your report but not counted toward weekly hours.`}],D=Object.entries(y.durations),O={tool:{label:`Tools`,hint:`e.g. Excel and Outlook`},volume:{label:`How much`,hint:`e.g. about 60 emails a day`},input:{label:`Where it comes from`,hint:`e.g. exports from the store system`},output:{label:`Where it goes`,hint:`e.g. emailed to the owner each Monday`}};function k(){let e=e=>e.screen===`most_days`?e.order:1e3+C.cards.indexOf(e);return ee(C.cards.filter(e=>e.ticked&&e.duration&&e.frequency).sort((t,n)=>e(t)-e(n)).map((e,t)=>({id:e.id,name:e.name,screen:e.screen,order:e.screen===`most_days`?e.order:t,duration:e.duration,frequency:e.frequency,kind:e.kind,...e.tools.length?{tool:e.tools.join(`, `),tools:e.tools}:{},signals:e.tools.length?{tool:e.tools.join(`, `)}:{}})),C.history,C.recorded).map(e=>{let t=C.factEdits[e.id]??{},n={...e.signals};for(let[e,r]of Object.entries(t))r&&r.trim()?n[e]=r.trim():delete n[e];return{...e,signals:n}})}var A=e=>c(e,e=>d(e,y));async function j(e,t){let n=await fetch(`${b}/${e}`,{method:`POST`,headers:{"content-type":`application/json`},body:JSON.stringify(t),credentials:`omit`}),r=await n.json().catch(()=>({}));if(n.status===429)throw Object.assign(Error(r.error),{code:r.code});if(!n.ok)throw Error(r.error||`Something went wrong. Please try again.`);return r}function M(e,t){let n=e;n.code===`daily_cap`||n.code===`interview_cap`||n.code===`unknown_interview`?T({step:`stopped`,busy:!1,stopped:{code:n.code,message:n.message}}):T({step:t,busy:!1,error:n.message||`Something went wrong. Please try again.`})}function N(e,t={}){T({step:e,error:void 0,...t}),window.scrollTo({top:0})}async function ne(){N(`seeding`,{startedAt:C.startedAt??Date.now()});try{let e=await j(`seed`,{title:C.title,industry:C.industry,weekHours:C.weekHours,jobDescription:C.path===`jd`&&C.jd||void 0,purpose:C.path===`guided`&&C.purpose||void 0,meetingLoad:C.path===`guided`?C.meetingLoad:void 0,manages:C.path===`guided`?C.manages:void 0,tools:C.tools}),t=0,n=e.cards.map(e=>({...e,tools:[],ticked:!1,order:e.screen===`most_days`?t++:0}));N(`splash`,{screen:0,interviewId:e.interviewId,cards:n,history:[],recorded:[],factEdits:{},pending:void 0,questionsAsked:0,questionsDone:!1,report:void 0})}catch(e){M(e,`tools`)}}async function P(e=!1){T({busy:!0,error:void 0});try{let t=await j(`interview`,{interviewId:C.interviewId,weekHours:C.weekHours,tasks:k(),history:C.history,finishNow:e}),n=[...C.recorded,...t.recorded];if(t.done){N(`review`,{busy:!1,recorded:n,pending:void 0,questionsAsked:t.questionsAsked,questionsDone:!0});return}T({busy:!1,recorded:n,pending:t.question,questionsAsked:t.questionsAsked})}catch(e){M(e,`drill`)}}async function F(e){let t=e.trim();t&&C.pending&&(T({history:[...C.history,{...C.pending,answer:t.slice(0,300)}],pending:void 0},!1),await P())}async function I(){N(`matching`,{busy:!0});try{let[e]=await Promise.all([j(`match`,{interviewId:C.interviewId,weekHours:C.weekHours,tasks:k(),history:C.history}),new Promise(e=>setTimeout(e,2600))]);N(`report`,{busy:!1,report:e,finishedAt:Date.now()})}catch(e){M(e,`review`)}}function L(){try{sessionStorage.removeItem(x)}catch{}C=S(),V(),window.scrollTo({top:0})}function R(e){let t=e.trim().slice(0,40);t&&(C.tools.find(e=>e.toLowerCase()===t.toLowerCase())||T({tools:[...C.tools,t]},!1))}var z=o(`#app`),B=``;function V(){let e=`${C.step}:${C.screen}:${C.pending?.question??``}:${C.path??``}`;z.classList.toggle(`no-anim`,e===B),B=e;let t={start:K,context:q,tools:J,seeding:Y,splash:X,tasks:ae,check:oe,drill:se,review:ce,matching:Z,report:le,stopped:ue};z.innerHTML=`${a({links:[{href:i,label:`About this demo`},{href:`${i}samples/`,label:`Sample reports`,hideSm:!0}]})}
    <main class="main">${t[C.step]()}</main>${C.step===`report`||C.step===`start`?r():``}`,de()}var H=[`Your role`,`Your tasks`,`A few questions`,`Review`,`Report`],U={start:0,context:0,tools:0,seeding:1,splash:1,tasks:1,check:1,drill:2,review:3,matching:4,report:4,stopped:4};function W(){let e=U[C.step];return`<ol class="progress" aria-label="Progress">${H.map((n,r)=>`<li class="${r<e?`done`:r===e?`on`:``}"><span>${r<e?t.check:r+1}</span>${n}</li>`).join(``)}</ol>`}function G(){return C.error?`<div class="notice amber" role="alert">${t.info}<div>${e(C.error)}</div></div>`:``}function K(){return`<div class="wrap wrap-narrow start rise">
    ${W()}
    <div class="start-head">
      <h1>Map your work. <span class="grad-text">Save time and increase ROI.</span></h1>
      <p class="lead">About five minutes. Describe your work and schedule, answer a few short questions, and get a ranked list of where a tool, a simple automation, an AI agent, or a habit change would save time.</p>
    </div>
    <ol class="howto">${[[`Your role`,`Title, industry, and either a job description or three quick questions. Then the tools you use.`],[`Your tasks`,`Daily, weekly, monthly and occasional work. Tick what you do; tap how long and which tools.`],[`A few questions`,`Up to six short questions about your biggest tasks.`],[`Review, then report`,`Check and fix the summary, then get a ranked list of where time could be saved.`]].map(([e,t],n)=>`<li><span class="howto-n">${n+1}</span><div><strong>${e}</strong><span>${t}</span></div></li>`).join(``)}</ol>
    <form class="panel start-form" novalidate>
      <div class="two">
        <div class="field"><label for="title">Job title</label><input class="input" id="title" name="title" maxlength="${y.seed.title_max_chars}" autocomplete="organization-title" placeholder="e.g. Merchandise buyer" value="${e(C.title)}" required></div>
        <div class="field"><label for="industry">Industry</label><input class="input" id="industry" name="industry" maxlength="${y.seed.industry_max_chars}" placeholder="e.g. Resort retail" value="${e(C.industry)}" required></div>
      </div>
      <div class="field"><span class="label" id="hours-label">Typical hours in your work week</span>
        <div class="chips" role="group" aria-labelledby="hours-label">${[30,35,40,45,50,55,60].map(e=>`<button type="button" class="chip" data-hours="${e}" aria-pressed="${C.weekHours===e}">${e}</button>`).join(``)}</div>
      </div>
      <div class="notice slate privacy">${t.shield}<div>
        <strong>Before you start.</strong> Leave out confidential employer details and names of people or customers.
        Your answers are sent to Anthropic's AI service to produce the report, and this site does not keep them
        (<a href="https://www.anthropic.com/legal/privacy" target="_blank" rel="noopener noreferrer">Anthropic's privacy policy</a>).
        Time savings are estimates, not guarantees.
      </div></div>
      ${G()}
      <button class="btn btn-grad btn-block" type="submit">Continue ${t.arrow}</button>
    </form>
  </div>`}function q(){let n=[`Under 5 hours`,`5 to 10 hours`,`10 to 20 hours`,`Over 20 hours`],r=[`No one`,`1 to 3 people`,`4 to 10 people`,`More than 10`],i=C.path;return`<div class="wrap wrap-narrow rise">
    ${W()}
    <div class="step-head"><h1>How does your work run?</h1><p class="muted">Pick one. Either way, nothing counts until you confirm it on the task screens.</p></div>
    <div class="paths">
      <button type="button" class="path card ${i===`jd`?`on`:``}" data-path="jd" aria-pressed="${i===`jd`}">${t.layers}<strong>Paste a job description</strong><span class="muted small">The quickest way. We'll draft tasks from it and spot the tools it names.</span></button>
      <button type="button" class="path card ${i===`guided`?`on`:``}" data-path="guided" aria-pressed="${i===`guided`}">${t.chat}<strong>Answer three quick questions</strong><span class="muted small">No job description handy? Mostly taps.</span></button>
    </div>
    ${i===`jd`?`<form class="panel ctx-form rise">
      <div class="field"><label for="jd">Job description</label>
        <textarea class="textarea tall" id="jd" maxlength="${y.job_description_max_chars}" placeholder="Paste the responsibilities and requirements. Leave out names and confidential details.">${e(C.jd)}</textarea>
        <span class="hint"><span id="jd-count">${C.jd.length}</span> / ${y.job_description_max_chars.toLocaleString()} characters</span></div>
      ${G()}
      <button class="btn btn-primary btn-block" type="submit">Continue to your tools ${t.arrow}</button>
    </form>`:``}
    ${i===`guided`?`<form class="panel ctx-form rise">
      <div class="field"><label for="purpose">What are your role's main responsibilities?</label>
        <textarea class="textarea" id="purpose" maxlength="600" placeholder="The main goals and what you're responsible for, in a sentence or two.">${e(C.purpose)}</textarea></div>
      <div class="field"><span class="label">How much of your week is meetings?</span>
        <div class="chips">${n.map(e=>`<button type="button" class="chip" data-meeting="${e}" aria-pressed="${C.meetingLoad===e}">${e}</button>`).join(``)}</div></div>
      <div class="field"><span class="label">How many people do you manage?</span>
        <div class="chips">${r.map(e=>`<button type="button" class="chip" data-manage="${e}" aria-pressed="${C.manages===e}">${e}</button>`).join(``)}</div></div>
      ${G()}
      <button class="btn btn-primary btn-block" type="submit">Continue to your tools ${t.arrow}</button>
    </form>`:``}
    <div class="back-row"><button type="button" class="btn btn-ghost btn-sm" data-go="start">${t.back} Back</button></div>
  </div>`}function J(){let n=new Set(g.flatMap(e=>e.tools)),r=C.tools.filter(e=>!n.has(e)),i=t=>`<button type="button" class="chip" data-tool="${e(t)}" aria-pressed="${C.tools.includes(t)}">${e(t)}</button>`;return`<div class="wrap wrap-narrow rise">
    ${W()}
    <div class="step-head"><h1>Which tools do you use for work?</h1>
      <p class="muted">Tick everything you use, and add anything missing, including industry systems. These become your options on the task screens, and the report favors tools you already have.</p></div>
    ${C.toolsFromJd.length?`<div class="notice">${t.info}<div>Ticked from your job description: ${C.toolsFromJd.map(e).join(`, `)}. Untick any you don't actually use.</div></div>`:``}
    <div class="panel tools-panel">
      ${g.map(t=>`<div class="tool-group"><span class="qlabel">${e(t.group)}</span><div class="chips">${t.tools.map(i).join(``)}</div></div>`).join(``)}
      <div class="tool-group"><span class="qlabel">Your own</span><div class="chips">${r.map(i).join(``)}
        <form class="add-tool"><input class="input tool-input wide" id="newtool" maxlength="40" placeholder="Add a tool, e.g. our ERP" aria-label="Add a tool"><button class="btn btn-secondary btn-sm" type="submit">${t.plus} Add</button></form></div></div>
    </div>
    ${G()}
    <div class="dock"><div class="wrap wrap-narrow dock-inner">
      <div class="meter"><div class="meter-text"><strong>${C.tools.length}</strong> <span class="muted">tool${C.tools.length===1?``:`s`} selected</span></div></div>
      <div class="dock-actions">
        <button type="button" class="btn btn-ghost" data-go="context">${t.back} Back</button>
        <button type="button" class="btn btn-primary" data-draft>Draft my task cards ${t.arrow}</button>
      </div>
    </div></div>
  </div>`}function Y(){return`<div class="wrap wrap-narrow rise">
    ${W()}
    <div class="seeding panel">
      <div class="seeding-head"><span class="spinner"></span><div><h2>Drafting likely tasks for a ${e(C.title)}</h2>
      <p class="muted small">A low-cost model suggests daily, weekly, monthly and occasional tasks from what you've told us. They're prompts for your memory: nothing counts until you tick it.</p></div></div>
      <div class="skeletons">${Array.from({length:5},(e,t)=>`<div class="skel" style="animation-delay:${t*120}ms"></div>`).join(``)}</div>
    </div>
  </div>`}function X(){let e=E.map(e=>C.cards.filter(t=>t.screen===e.key).length),n=[`Every day or nearly every day. Email, stand-ups, daily checks.`,`Once or a few times a week. Team meetings, weekly reports.`,`About once a month. Month-end reports, invoices, reviews.`,`Quarterly, yearly or now and then. Planning, audits, hiring.`];return`<div class="wrap wrap-narrow rise">
    ${W()}
    <div class="panel splash">
      <span class="badge badge-blue">${t.sparkle} ${C.cards.length} suggested tasks ready</span>
      <h1>Now, your tasks, by how often they happen</h1>
      <p class="muted">Four short screens. Put each task where it really belongs: a weekly report goes under Weekly, even if it takes a whole day.</p>
      <ol class="cadence">${E.map((t,r)=>`<li><span class="cad-n">${r+1}</span><div><strong>${t.tab}</strong><span>${n[r]}</span>${t.note?`<em>${t.note}</em>`:``}</div><span class="cad-count">${e[r]} suggested</span></li>`).join(``)}</ol>
      <p class="small muted">On each screen: tick what you really do, tap how long it takes, and pick the tools you use for it. Add anything we missed.</p>
      <button type="button" class="btn btn-grad btn-block" data-begin>Start with daily tasks ${t.arrow}</button>
    </div>
  </div>`}function re(){let e=k(),t=l(e.map(e=>s(e,y)),C.weekHours),n=Math.min(100,t.sumMidpoint/C.weekHours*100),r=t.overWeek;return`<div class="meter ${r?`over`:``}" aria-live="polite">
    <div class="meter-text"><strong>${t.sumHigh?A({low:t.sumLow,high:t.sumHigh}):`0`} h</strong> <span class="muted">of your ${C.weekHours}-hour week</span>${r?`<span class="badge badge-amber">Over your week</span>`:``}</div>
    <div class="meter-bar"><span style="width:${n.toFixed(1)}%"></span></div>
  </div>`}function ie(n,r){let i=E[C.screen],a=!!C.error&&n.ticked&&!n.duration,o=[...new Set([...C.tools,...n.tools])],s=r.filter(e=>e.ticked),c=s.indexOf(n),l=i.freqs.find(e=>e.key===n.frequency)?.label??``;return`<div class="tcard ${n.ticked?`on`:``} ${a?`missing`:``}" data-id="${e(n.id)}">
    <div class="tcard-row">
      <button type="button" class="tick" aria-pressed="${n.ticked}"><span class="box">${t.check}</span><span class="tname">${e(n.name)}</span>${n.custom?`<span class="badge badge-purple">Added by you</span>`:``}</button>
      ${n.ticked&&i.key===`most_days`&&s.length>1?`<div class="reorder"><button type="button" class="iconbtn" data-move="-1" aria-label="Move earlier" ${c===0?`disabled`:``}>${t.up}</button><button type="button" class="iconbtn" data-move="1" aria-label="Move later" ${c===s.length-1?`disabled`:``}>${t.down}</button></div>`:``}
    </div>
    ${n.ticked&&n.duration&&C.openCard!==n.id?`<button type="button" class="tsummary" data-open>
      <span>${e(y.durations[n.duration].label)} · ${e(l.toLowerCase())}${n.tools.length?` · ${e(n.tools.join(`, `))}`:``}</span><span class="tedit">Edit</span></button>`:``}
    ${n.ticked&&(!n.duration||C.openCard===n.id)?`<div class="tcard-body">
      <div class="q"><span class="qlabel">Each time</span><div class="chips">${D.map(([t,r])=>`<button type="button" class="chip soft" data-dur="${t}" aria-pressed="${n.duration===t}">${e(r.label)}</button>`).join(``)}</div></div>
      ${i.freqs.length>1?`<div class="q"><span class="qlabel">How often</span><div class="chips">${i.freqs.map(t=>`<button type="button" class="chip soft" data-freq="${t.key}" aria-pressed="${n.frequency===t.key}">${e(t.label)}</button>`).join(``)}</div></div>`:``}
      <div class="q"><span class="qlabel">Done in <span class="muted">(pick any)</span></span><div class="chips">${o.map(t=>`<button type="button" class="chip soft" data-tool="${e(t)}" aria-pressed="${n.tools.includes(t)}">${e(t)}</button>`).join(``)}
        <input class="input tool-input" placeholder="Other tool…" maxlength="40" aria-label="Other tool" value=""></div></div>
      ${n.custom?`<div class="q"><span class="qlabel">Kind of work</span><div class="chips">${[`meeting`,`email`,`other`].map(e=>`<button type="button" class="chip soft" data-kind="${e}" aria-pressed="${n.kind===e}">${e===`other`?`Other work`:e[0].toUpperCase()+e.slice(1)}</button>`).join(``)}</div></div>`:``}
      ${a?`<p class="tiny warn">Tap how long this takes to count it.</p>`:``}
    </div>`:``}
  </div>`}function ae(){let n=E[C.screen],r=C.cards.filter(e=>e.screen===n.key);n.key===`most_days`&&(r=[...r].sort((e,t)=>Number(t.ticked)-Number(e.ticked)||e.order-t.order));let i=r.filter(e=>e.ticked).length,a=C.screen===E.length-1;return`<div class="wrap wrap-narrow tasks rise">
    ${W()}
    <div class="screens" role="tablist">${E.map((e,t)=>`<button type="button" role="tab" class="screen-tab ${t===C.screen?`on`:``}" data-screen="${t}" aria-selected="${t===C.screen}"><span>${t+1}</span>${e.tab}</button>`).join(``)}</div>
    <div class="tasks-head"><h1>${e(n.title)}</h1><p class="muted">${e(n.sub)}</p>${n.note?`<p class="small cad-note">${t.info} ${e(n.note)}</p>`:``}</div>
    <div class="tlist">${r.map(e=>ie(e,r)).join(``)||`<p class="muted">No suggestions here. Add your own below, or move on.</p>`}</div>
    <form class="addown"><input class="input" id="addown" maxlength="60" placeholder="Add your own ${n.addLabel} task" aria-label="Add your own task"><button class="btn btn-secondary" type="submit">${t.plus} Add</button></form>
    <p class="tiny muted">${i} ticked on this screen. Cards you leave unticked are dropped and never reach your report.</p>
    ${G()}
    <div class="dock"><div class="wrap wrap-narrow dock-inner">
      ${re()}
      <div class="dock-actions">
        ${C.screen>0?`<button type="button" class="btn btn-ghost" data-nav="-1">${t.back} Back</button>`:`<button type="button" class="btn btn-ghost" data-go="splash">${t.back} Back</button>`}
        <button type="button" class="btn btn-primary" data-nav="1">${a?`Done`:`Next: ${E[C.screen+1].tab}`} ${t.arrow}</button>
      </div>
    </div></div>
  </div>`}function oe(){let n=k(),r=l(n.map(e=>s(e,y)),C.weekHours),i=n.filter(e=>s(e,y).counted).sort((e,t)=>s(t,y).hoursPerWeek.high-s(e,y).hoursPerWeek.high).slice(0,6),a=[45,50,55,60,70,80].filter(e=>e>C.weekHours);return`<div class="wrap wrap-narrow rise">
    ${W()}
    <div class="panel check">
      <span class="badge badge-amber">${t.clock} Hours check</span>
      <h1>Your tasks add up to more than your ${C.weekHours}-hour week</h1>
      <p class="muted">At the high end they total <strong>${A({low:r.sumHigh,high:r.sumHigh})} hours</strong>. That usually means a time or a cadence is set a bit high. Adjust the tasks, or tell us your week is longer.</p>
      <ul class="check-list">${i.map(t=>`<li><span>${e(t.name)}</span><span class="muted">${e(y.durations[t.duration].label)} · ${e(y.frequencies[t.frequency].label.toLowerCase())}</span><strong>${A(s(t,y).hoursPerWeek)} h</strong></li>`).join(``)}</ul>
      <div class="check-actions"><button type="button" class="btn btn-primary" data-adjust>${t.back} Adjust my tasks</button></div>
      ${a.length?`<div class="field"><span class="label">Or: my week is really</span><div class="chips">${a.map(e=>`<button type="button" class="chip" data-week="${e}">${e} hours</button>`).join(``)}</div></div>`:``}
    </div>
  </div>`}function se(){let n=y.agent.max_questions,r=C.questionsAsked,i=C.pending,a=i?k().find(e=>e.id===i.taskId):void 0;return`<div class="wrap wrap-narrow drill rise">
    ${W()}
    <div class="drill-head">
      <div><h1>A few questions about your biggest tasks</h1><p class="muted small">Up to ${n} questions. Facts only, no advice yet. You can fix anything on the next screen.</p></div>
      <button type="button" class="btn btn-secondary btn-sm" data-finish ${C.busy?`disabled`:``}>Finish now</button>
    </div>
    <div class="dots" aria-label="Question ${r} of up to ${n}">${Array.from({length:n},(e,t)=>`<span class="${t<r-+!!i?`done`:t===r-1&&i?`on`:``}"></span>`).join(``)}</div>
    ${C.error?`<div class="notice amber" role="alert">${t.info}<div>${e(C.error)} <button type="button" class="linklike" data-retry>Try again</button></div></div>`:``}
    ${C.busy||!i?`<div class="qcard card thinking"><span class="spinner"></span><div><strong>${r?`Choosing the next question`:`Looking at your biggest tasks`}</strong><p class="small muted">The interviewer picks which task and which gap to ask about next.</p></div></div>`:`
    <div class="qcard card rise">
      ${a?`<span class="badge badge-blue">${t.target} ${e(a.name)}</span>`:``}
      <h2>${e(i.question)}</h2>
      <div class="opts">${i.options.map((t,n)=>`<button type="button" class="opt" data-opt="${n}">${e(t)}</button>`).join(``)}</div>
      <form class="free"><input class="input" id="free" maxlength="300" placeholder="Or type your own answer" aria-label="Your own answer"><button class="btn btn-primary" type="submit" aria-label="Send">${t.arrow}</button></form>
    </div>`}
  </div>`}function ce(){let n=k(),r=E.map(e=>({s:e,items:n.filter(t=>t.screen===e.key)})).filter(e=>e.items.length),i=l(n.map(e=>s(e,y)),C.weekHours),a=n.filter(e=>s(e,y).counted&&m.some(t=>!e.signals[t])).length,o=y.agent.max_questions-C.questionsAsked;return`<div class="wrap wrap-narrow review rise">
    ${W()}
    <div class="step-head"><h1>Review your week</h1>
      <p class="muted">This is everything the report will use. Fix anything that's off, remove what doesn't belong, and fill in blanks: details you add here count as your own answers.</p></div>
    <div class="review-sum card">
      <div><strong>${n.length}</strong><span>tasks</span></div>
      <div><strong>${i.sumHigh?A({low:i.sumLow,high:i.sumHigh}):`0`} h</strong><span>of your ${C.weekHours}-hour week</span></div>
      <div><strong>${a}</strong><span>with details missing</span></div>
    </div>
    ${r.map(({s:n,items:r})=>`<section class="rv-group"><h2>${n.tab}</h2>
      ${r.map(n=>{let r=s(n,y),i=E.flatMap(e=>e.freqs).find(e=>e.key===n.frequency)?.label??y.frequencies[n.frequency].label;return`<article class="rv-task card" data-task="${e(n.id)}">
          <div class="rv-head"><div><h3>${e(n.name)}</h3>
            <span class="small muted">${e(y.durations[n.duration].label)} · ${e(i.toLowerCase())} · ${r.counted?`${A(r.hoursPerWeek)} h a week`:`not counted`}</span></div>
            <div class="rv-actions"><button type="button" class="btn btn-ghost btn-sm" data-edit="${e(n.id)}">Change time</button><button type="button" class="btn btn-ghost btn-sm" data-remove="${e(n.id)}" aria-label="Remove ${e(n.name)}">${t.x} Remove</button></div></div>
          ${r.counted?`<div class="facts">${m.map(t=>`<label class="fact ${n.signals[t]?``:`gap`}"><span>${O[t].label}${n.signals[t]?``:` <em>missing</em>`}</span>
            <input class="input" data-fact="${t}" maxlength="300" placeholder="${e(O[t].hint)}" value="${e(n.signals[t]??``)}"></label>`).join(``)}</div>`:``}
        </article>`}).join(``)}</section>`).join(``)}
    ${G()}
    <div class="dock"><div class="wrap wrap-narrow dock-inner">
      <div class="meter"><div class="meter-text small muted">${a?`${a} task${a===1?``:`s`} with blanks may land in "Not enough detail".`:`Every counted task has its details.`}</div></div>
      <div class="dock-actions">
        ${o>0&&C.questionsDone?`<button type="button" class="btn btn-ghost" data-more>More questions</button>`:``}
        <button type="button" class="btn btn-grad" data-build ${n.length?``:`disabled`}>Build my report ${t.arrow}</button>
      </div>
    </div></div>
  </div>`}function Z(){let e=[[`AI proposes a catalog pattern for each task`,t.sparkle],[`Code checks each pattern's required details`,t.layers],[`Code computes hours from your taps`,t.calc],[`Reviewer runs seven rule checks`,t.shield]];return`<div class="wrap wrap-narrow rise">
    ${W()}
    <div class="panel matching">
      <h1>Building your report</h1>
      <p class="muted">The model only proposes. Code decides what you see.</p>
      <ol class="msteps">${e.map(([e,n],r)=>`<li style="animation-delay:${r*600}ms"><span class="mico">${n}</span><span>${e}</span><span class="mcheck">${t.check}</span></li>`).join(``)}</ol>
    </div>
  </div>`}function le(){let e=C.report,n=C.startedAt&&C.finishedAt?Math.max(1,Math.round((C.finishedAt-C.startedAt)/6e4)):null;return`<div class="wrap rise report-wrap">
    <div class="report-actions no-print">
      <span class="muted small">${n?`Finished in about ${n} minute${n>1?`s`:``}. `:``}Nothing was stored. Print or save as PDF to keep it.</span>
      <div class="ra-btns">
        <button type="button" class="btn btn-secondary btn-sm" data-print>${t.print} Print or save PDF</button>
        <button type="button" class="btn btn-ghost btn-sm" data-go="review">Edit my answers</button>
        <button type="button" class="btn btn-ghost btn-sm" data-restart>${t.refresh} Start over</button>
        <button type="button" class="btn btn-ghost btn-sm" data-private hidden>Save to private folder</button>
      </div>
    </div>
    ${e.thin.length?`<div class="more no-print"><div>
      <strong>${e.thin.length} ${e.thin.length===1?`task is`:`tasks are`} a detail or two away from a recommendation.</strong>
      <span class="muted small">Fill in the blanks on the review screen and the report rebuilds.</span></div>
      <button type="button" class="btn btn-primary btn-sm" data-go="review">Add details ${t.arrow}</button></div>`:``}
    ${p(e,y)}
    <div class="panel next no-print">
      <div><h2>See how it reads for other roles</h2><p class="muted">Eight sample reports and a sample team rollup, built with the same pipeline.</p></div>
      <a class="btn btn-primary" href="${i}samples/">Browse sample reports ${t.arrow}</a>
    </div>
  </div>`}function ue(){let n=C.stopped,r=n.code===`daily_cap`;return`<div class="wrap wrap-narrow rise"><div class="panel stopped">
    <span class="badge badge-amber">${t.info} ${r?`Daily limit reached`:n.code===`interview_cap`?`Cost limit reached`:`Interview expired`}</span>
    <h1>${r?`Today's demo budget is used up`:n.code===`interview_cap`?`This interview hit its cost limit`:`Let's start fresh`}</h1>
    <p class="muted">${r?`This demo caps what it spends on AI each day. It resets at midnight UTC. In the meantime, the sample reports show exactly what a finished report looks like.`:n.code===`interview_cap`?`Each interview has a small spending cap so a public demo stays affordable. The run stopped before going over it. The sample reports show what a finished report looks like.`:e(n.message)}</p>
    <div class="check-actions"><a class="btn btn-primary" href="${i}samples/">See the sample reports ${t.arrow}</a><button type="button" class="btn btn-ghost" data-restart>Start over</button></div>
  </div></div>`}function Q(e,t){T({cards:C.cards.map(n=>n.id===e?{...n,...t}:n),error:void 0})}function de(){if(n(`[data-restart]`).forEach(e=>e.addEventListener(`click`,L)),n(`[data-go]`).forEach(e=>e.addEventListener(`click`,()=>N(e.dataset.go))),C.step===`start`){let e=o(`.start-form`),t=()=>{C.title=o(`#title`).value,C.industry=o(`#industry`).value,w()};e.addEventListener(`input`,t),n(`[data-hours]`).forEach(e=>e.addEventListener(`click`,()=>{t(),T({weekHours:Number(e.dataset.hours)})})),e.addEventListener(`submit`,e=>{e.preventDefault(),t(),!C.title.trim()||!C.industry.trim()?T({error:`Add a job title and an industry to continue.`}):N(`context`)})}if(C.step===`context`){n(`[data-path]`).forEach(e=>e.addEventListener(`click`,()=>T({path:e.dataset.path,error:void 0})));let e=o(`.ctx-form`);if(e){let t=()=>{let e=o(`#jd`),t=o(`#purpose`);e&&(C.jd=e.value,o(`#jd-count`).textContent=String(e.value.length)),t&&(C.purpose=t.value),w()};e.addEventListener(`input`,t),n(`[data-meeting]`).forEach(e=>e.addEventListener(`click`,()=>{t(),T({meetingLoad:e.dataset.meeting})})),n(`[data-manage]`).forEach(e=>e.addEventListener(`click`,()=>{t(),T({manages:e.dataset.manage})})),e.addEventListener(`submit`,e=>{if(e.preventDefault(),t(),C.path===`jd`&&C.jd.trim().length<80){T({error:`Paste a little more of the job description, or answer the three quick questions instead.`});return}if(C.path===`guided`&&(!C.purpose.trim()||!C.meetingLoad||!C.manages)){T({error:`Answer all three to continue.`});return}let n=C.path===`jd`?v(C.jd):[];N(`tools`,{toolsFromJd:n,tools:[...new Set([...C.tools,...n])]})})}}if(C.step===`tools`&&(n(`[data-tool]`).forEach(e=>e.addEventListener(`click`,()=>{let t=e.dataset.tool;T({tools:C.tools.includes(t)?C.tools.filter(e=>e!==t):[...C.tools,t]})})),o(`.add-tool`).addEventListener(`submit`,e=>{e.preventDefault(),R(o(`#newtool`).value),V(),o(`#newtool`)?.focus()}),o(`[data-draft]`).addEventListener(`click`,()=>{let e=o(`#newtool`).value;e.trim()&&R(e),ne()})),C.step===`splash`&&o(`[data-begin]`).addEventListener(`click`,()=>N(`tasks`,{screen:0})),C.step===`tasks`){let e=E[C.screen];n(`.tcard`).forEach(t=>{let r=t.dataset.id,i=C.cards.find(e=>e.id===r);o(`.tick`,t).addEventListener(`click`,()=>{let t=!i.ticked;T({openCard:t?r:void 0},!1),Q(r,t?{ticked:t,frequency:e.freqs.some(e=>e.key===i.frequency)?i.frequency:e.freqs[0].key}:{ticked:t})}),o(`[data-open]`,t)?.addEventListener(`click`,()=>T({openCard:r})),n(`[data-dur]`,t).forEach(e=>e.addEventListener(`click`,()=>Q(r,{duration:e.dataset.dur}))),n(`[data-freq]`,t).forEach(e=>e.addEventListener(`click`,()=>Q(r,{frequency:e.dataset.freq}))),n(`[data-tool]`,t).forEach(e=>e.addEventListener(`click`,()=>{let t=e.dataset.tool;Q(r,{tools:i.tools.includes(t)?i.tools.filter(e=>e!==t):[...i.tools,t]})})),n(`[data-kind]`,t).forEach(e=>e.addEventListener(`click`,()=>Q(r,{kind:e.dataset.kind})));let a=t.querySelector(`.tool-input`),s=()=>{let e=a.value.trim();if(!e)return;R(e);let t=C.tools.find(t=>t.toLowerCase()===e.toLowerCase()),n=C.cards.find(e=>e.id===r);Q(r,{tools:n.tools.includes(t)?n.tools:[...n.tools,t]})};a?.addEventListener(`keydown`,e=>{e.key===`Enter`&&(e.preventDefault(),s())}),a?.addEventListener(`blur`,s),n(`[data-move]`,t).forEach(e=>e.addEventListener(`click`,()=>fe(r,Number(e.dataset.move))))}),n(`[data-screen]`).forEach(e=>e.addEventListener(`click`,()=>N(`tasks`,{screen:Number(e.dataset.screen)}))),o(`.addown`).addEventListener(`submit`,t=>{t.preventDefault();let n=o(`#addown`).value.trim();if(!n)return;let r=Math.max(-1,...C.cards.filter(t=>t.screen===e.key).map(e=>e.order))+1,i=`u${Date.now().toString(36)}`;T({openCard:i,cards:[...C.cards,{id:i,name:n,screen:e.key,kind:`other`,custom:!0,ticked:!0,frequency:e.freqs[0].key,tools:[],order:r}]}),o(`#addown`)?.focus()}),n(`[data-nav]`).forEach(t=>t.addEventListener(`click`,()=>{let n=Number(t.dataset.nav);if(n>0){let t=C.cards.filter(t=>t.screen===e.key&&t.ticked&&!t.duration);if(t.length){T({error:`Tap how long it takes for: ${t.map(e=>e.name).join(`, `)}. Or untick ${t.length>1?`them`:`it`}.`});return}if(C.screen===E.length-1){$();return}}N(`tasks`,{screen:C.screen+n})}))}C.step===`check`&&(o(`[data-adjust]`).addEventListener(`click`,()=>N(`tasks`,{screen:0})),n(`[data-week]`).forEach(e=>e.addEventListener(`click`,()=>{T({weekHours:Number(e.dataset.week)},!1),$()}))),C.step===`drill`&&(o(`[data-finish]`)?.addEventListener(`click`,()=>P(!0)),o(`[data-retry]`)?.addEventListener(`click`,()=>P()),n(`[data-opt]`).forEach(e=>e.addEventListener(`click`,()=>F(C.pending.options[Number(e.dataset.opt)]))),o(`.free`)?.addEventListener(`submit`,e=>{e.preventDefault(),F(o(`#free`).value)}),!C.pending&&!C.busy&&!C.error&&P()),C.step===`review`&&(n(`.rv-task`).forEach(e=>{let t=e.dataset.task;n(`[data-fact]`,e).forEach(e=>e.addEventListener(`change`,()=>{let n=e.dataset.fact;T({factEdits:{...C.factEdits,[t]:{...C.factEdits[t],[n]:e.value}}})}))}),n(`[data-remove]`).forEach(e=>e.addEventListener(`click`,()=>Q(e.dataset.remove,{ticked:!1}))),n(`[data-edit]`).forEach(e=>e.addEventListener(`click`,()=>{let t=C.cards.find(t=>t.id===e.dataset.edit);N(`tasks`,{screen:E.findIndex(e=>e.key===t.screen),openCard:t.id})})),o(`[data-more]`)?.addEventListener(`click`,()=>N(`drill`,{pending:void 0,busy:!1,questionsDone:!1})),o(`[data-build]`).addEventListener(`click`,()=>{let e=document.activeElement;e?.dataset.fact&&e.dispatchEvent(new Event(`change`)),I()})),C.step===`report`&&(f(z),o(`[data-print]`).addEventListener(`click`,()=>window.print()),o(`[data-private]`))}function fe(e,t){let n=C.cards.filter(e=>e.screen===`most_days`&&e.ticked).sort((e,t)=>e.order-t.order),r=n.findIndex(t=>t.id===e),i=r+t;if(i<0||i>=n.length)return;let a=n[r].order,o=n[i].order;T({cards:C.cards.map(e=>e.id===n[r].id?{...e,order:o}:e.id===n[i].id?{...e,order:a}:e)})}function $(){let e=k();e.some(e=>s(e,y).counted)?l(e.map(e=>s(e,y)),C.weekHours).overWeek?N(`check`):N(C.questionsDone?`review`:`drill`,{pending:void 0}):T({error:`Tick at least one daily, weekly or monthly task and tap how long it takes.`})}V();