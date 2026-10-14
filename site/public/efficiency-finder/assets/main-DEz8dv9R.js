import{a as e,i as t,o as n,r,s as i,t as a}from"./ui-BghfFf24.js";import{a as o,i as s,t as c}from"./samples-DzMi3zpz.js";import{s as l}from"./math-DzdNnonG.js";var u={1:`Task is in the task map`,2:`Quoted evidence appears word for word in the visitor's answers`,3:`Pattern is in the catalog and every required signal was recorded`,4:`Tool is listed on the pattern, with a working link checked within the limit`,5:`Hours figures are the ones code computed`,6:`Model-written sentences contain no numbers`,7:`A working-habit suggestion carries no hours unless the catalog supplies a share`},d=l.catalog,f=d.filter(e=>e.level!==`habit`),p=d.filter(e=>e.level===`habit`),m=[{who:`you`,title:`Your role`,text:`Job title, industry, typical hours. A job description if you like.`},{who:`ai`,title:`Draft task cards`,text:`A low-cost model suggests likely tasks. A draft, never data.`},{who:`you`,title:`Confirm your week`,text:`Tick what applies; tap how long, how often, and in what tool.`},{who:`code`,title:`Hours check`,text:`Code turns taps into hours and asks you to adjust if they overrun the week.`},{who:`agent`,title:`Drill-down`,text:`The one agent asks up to six questions about your biggest tasks.`},{who:`ai`,title:`Propose matches`,text:`A model proposes a catalog pattern per task and quotes your words.`},{who:`code`,title:`Reviewer`,text:`Seven rule checks in code reject anything that does not hold up.`},{who:`code`,title:`Report`,text:`Ranked by hours saved, every figure computed in code.`}],h={you:`You`,ai:`AI model`,agent:`AI agent`,code:`Code`};a(`#landing`).innerHTML=`
${i({dark:!0,links:[{href:`#how`,label:`How it works`,hideSm:!0},{href:`#ai`,label:`How it uses AI`,hideSm:!0},{href:`#samples`,label:`Samples`},{href:`${r}app/`,label:`Launch`}]})}
<section class="hero">
  <div class="hero-glow" aria-hidden="true"></div>
  <div class="wrap hero-grid">
    <div class="hero-copy">
      <span class="eyebrow on-dark">Portfolio demo · AI workflow</span>
      <h1>Find the hours hiding in a work week.</h1>
      <p class="hero-lead">A five-minute guided interview that maps how you spend your week, then shows where a tool you already have, a simple automation, an AI agent, or a change in working habit would save time.</p>
      <p class="hero-sub">Every recommendation ties to a task you confirmed and to a pattern in my catalog. Hours are computed in code.</p>
      <div class="hero-cta">
        <a class="btn btn-grad" href="${r}app/" id="launch">Launch the demo ${t.arrow}</a>
        <a class="btn btn-light" href="#samples">See sample reports</a>
      </div>
      <ul class="hero-facts"><li>${t.clock} About five minutes</li><li>${t.shield} No sign-up, nothing stored</li><li>${t.calc} Numbers from code, not AI</li></ul>
    </div>
    <div class="hero-art" aria-hidden="true">
      <div class="mock card">
        <div class="mock-top"><span class="badge badge-amber">Sample</span><span class="tiny muted">Illustration</span></div>
        <div class="mock-row"><div class="rank">1</div><div><strong>Build the weekly sales report</strong><div class="tiny muted">Assembling a recurring report</div></div><div class="mock-num">0.6–2.4<small> h/wk</small></div></div>
        <div class="mock-quote">“exports from four store systems”</div>
        <div class="mock-math">
          <span>1 hour</span><span>×</span><span>2–4 / week</span><span>×</span><span>30–60%</span><span>=</span><strong>0.6–2.4 h</strong>
        </div>
        <div class="mock-rules">${[1,2,3,4,5,6,7].map(e=>`<span title="Rule ${e}">${t.check}</span>`).join(``)}<span class="tiny">Reviewer: 7 of 7 rules passed</span></div>
      </div>
      <div class="mock mock-2 card">
        <div class="tiny muted">Question 2 of up to 6</div>
        <strong>Where does the data for the sales report come from?</strong>
        <div class="mock-opts"><span>System exports</span><span>Emailed files</span><span>Typed by hand</span></div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="how">
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">How it works</span><h2>Three steps, about five minutes</h2></div>
    <div class="steps">
      <article class="step card"><span class="step-n">1</span><h3>Tell it your role</h3><p class="muted">Job title and industry, plus a pasted job description if you want sharper cards. A model drafts likely tasks across three screens.</p></article>
      <article class="step card"><span class="step-n">2</span><h3>Confirm your real week</h3><p class="muted">Tick only what you actually do. Tap how long, how often, and the tool. A live meter shows the hours adding up against your week.</p></article>
      <article class="step card"><span class="step-n">3</span><h3>Answer a few questions</h3><p class="muted">The interviewer asks up to six tap-to-answer questions about your biggest tasks, then you get a ranked, checkable report.</p></article>
    </div>
  </div>
</section>

<section class="section alt" id="ai">
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">How it uses AI</span><h2>The model proposes. Code decides.</h2>
      <p class="muted section-lead">A workflow with one bounded agent (the drill-down interviewer) and a reviewer that is rule checks in code. It is not a multi-agent system. It does not run on a schedule and it keeps no memory of visitors. It is built and demonstrated on sample data, with one real user.</p></div>
    <ol class="pipeline">${m.map((t,n)=>`<li class="pipe pipe-${t.who}"><span class="pipe-who">${h[t.who]}</span><span class="pipe-n">${n+1}</span><strong>${e(t.title)}</strong><span class="small muted">${e(t.text)}</span></li>`).join(``)}</ol>
    <div class="split">
      <div class="card split-col"><h3><span class="dot dot-ai"></span>Where a model is used</h3>
        <ul>
          <li><strong>Drafting task cards.</strong> The lowest-cost model suggests likely tasks from your title and industry. Nothing counts until you tick it.</li>
          <li><strong>The drill-down agent.</strong> Given a goal and a few tools (ask a question, record an answer against a task, list missing facts, finish), it chooses which task and which gap to ask about, and decides when it has enough. Bounded in code: at most six questions, a cost cap, and finish is refused until the top three tasks are covered.</li>
          <li><strong>Proposing pattern matches.</strong> For each task it proposes one catalog pattern and quotes your words as evidence.</li>
        </ul></div>
      <div class="card split-col"><h3><span class="dot dot-code"></span>Where code is used</h3>
        <ul>
          <li><strong>Hours math.</strong> Duration × frequency, times the catalog's savings range. No number shown to you comes from a model.</li>
          <li><strong>The reviewer.</strong> Seven rule checks reject any recommendation that fails, with the reason shown in your report.</li>
          <li><strong>Ranking.</strong> Most hours saved first; ties go to the smaller effort.</li>
          <li><strong>Working-habit triggers, cost caps and the tool-link checker.</strong> All plain rules.</li>
        </ul></div>
    </div>
    <div class="rules-card card">
      <div><span class="eyebrow">The reviewer</span><h3>Seven rules every recommendation must pass</h3><p class="small muted">A recommendation that fails any rule is rejected, and the report says why. Tasks with thin answers go to "Not enough detail" and tasks with no pattern go to "No pattern fit". Neither is stretched to fit.</p></div>
      <ol>${Object.values(u).map(t=>`<li>${e(t)}</li>`).join(``)}</ol>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">The catalog</span><h2>${f.length+p.length} patterns: the only source of recommendations</h2>
      <p class="muted section-lead">Patterns describe task shapes, not jobs, so they fit any role. Each lists the facts that must be recorded for a match, named tools with checked links, a savings range from the author's experience, the effort, a first step, and how it tends to fail.</p></div>
    <div class="catalog">
      <div><h3 class="small">Technology (${f.length})</h3><div class="chips">${f.map(t=>`<span class="badge badge-blue">${e(t.name)}</span>`).join(``)}</div></div>
      <div><h3 class="small">Working habits (${p.length})</h3><div class="chips">${p.map(t=>`<span class="badge badge-green">${e(t.name)}</span>`).join(``)}</div></div>
    </div>
  </div>
</section>

<section class="section alt" id="samples">
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">Samples</span><h2>Sample reports and a sample team rollup</h2>
      <p class="muted section-lead">Eight generalized roles, each answered by a low-cost model from <span id="facts-phrase">a facts sheet written for the role</span>, and run through the same pipeline. Each is labeled as sample.</p></div>
    <div id="sample-grid" class="sample-grid"><p class="muted">Loading samples…</p></div>
  </div>
</section>

<section class="section" id="scope">
  <div class="wrap">
    <div class="section-head"><span class="eyebrow">Scope</span><h2>What is in this demo, and what is not yet</h2></div>
    <div class="scope">
      <div class="card scope-col"><h3>${t.check} In this demo</h3><ul>
        <li>Guided interview: seed, three tap screens, hours check</li>
        <li>Drill-down agent, bounded in code</li>
        <li>Pattern matching checked by a seven-rule reviewer</li>
        <li>Savings math and ranking in code, with the math one tap away</li>
        <li>A catalog of ${f.length+p.length} patterns with a link and date checker</li>
        <li>Eight sample reports and one sample team rollup</li>
        <li>Print layout, privacy notice, cost caps and a usage page</li>
      </ul></div>
      <div class="card scope-col planned"><h3>${t.flag} Planned for the full build</h3><ul>
        <li>Three-week check-in on what was tried</li>
        <li>Rollup for real teams</li>
        <li>Calendar import</li>
        <li>A larger catalog</li>
      </ul><p class="tiny muted">Not built. Listed so the scope is clear.</p></div>
    </div>
  </div>
</section>

<section class="section cta-band">
  <div class="wrap cta-inner">
    <div><h2>Try it on your own week</h2><p>About five minutes. No sign-up. Your answers are not kept.</p></div>
    <a class="btn btn-grad" href="${r}app/">Launch the demo ${t.arrow}</a>
  </div>
</section>
${n()}
`,s().then(e=>{a(`#sample-grid`).innerHTML=o(e),a(`#facts-phrase`).textContent=c(e)}),fetch(`${r}api/usage`,{method:`GET`,credentials:`omit`}).then(e=>{e.ok&&document.querySelector(`.footer .wrap`)?.insertAdjacentHTML(`beforeend`,`<a href="${r}usage/">Usage and cost</a>`)}).catch(()=>{});var g=document.querySelector(`.topbar`),_=document.querySelector(`.hero`),v=()=>g.classList.toggle(`dark`,_.getBoundingClientRect().bottom>60);addEventListener(`scroll`,v,{passive:!0}),v();