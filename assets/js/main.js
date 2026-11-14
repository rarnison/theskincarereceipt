/* TheSkinCareReceipt — interactions and motion.
   Content lives in data.js. This file builds the shelf, the routine printer
   and the returns desk from it, then layers the animation on top.
   Everything still works (just without movement) if GSAP fails to load or the
   visitor prefers reduced motion. */
(() => {
  'use strict';

  window.__tscrBooted = true;

  const D = window.TSCR || { currency: '$', products: [], slips: [] };
  const html = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const deskDrag = matchMedia('(min-width: 901px) and (hover: hover) and (pointer: fine)');
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;
  const MOTION = !!(gsap && ScrollTrigger) && !reduceMotion;
  let lenis = null;

  /* ------------------------------------------------------------------
     helpers
  ------------------------------------------------------------------ */
  const NAMED = ['lilac', 'lilac-deep', 'lilac-soft', 'cream', 'paper', 'sand', 'amber', 'honey', 'ink'];
  const color = c => (NAMED.includes(c) ? `var(--${c})` : c);
  const money = n => D.currency + Number(n).toFixed(2);
  const esc = s => String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

  const row = (l, r, cls = '') => `<p class="r-row ${cls}"><span>${esc(l)}</span><i></i><b>${esc(r)}</b></p>`;
  const center = (t, cls = '') => `<p class="r-center ${cls}">${t}</p>`;
  const RULE = '<div class="r-rule"></div>';
  const BRAND = '<p class="r-brand">The<i>SkinCare</i><br>Receipt</p>';

  const BARS = '3112132211311223121132123113211231121322113112';
  const barcodeHTML = (unit = 1.5) => BARS.split('').map((n, i) =>
    `<i${i % 2 ? ' class="gap"' : ''} style="width:${n * unit}px"></i>`).join('');

  // wrap each word (or character) in spans so it can be animated on its own
  function split(el, { chars = false, mask = true } = {}) {
    const out = [];
    const walk = node => {
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          const parts = chars ? Array.from(child.textContent) : child.textContent.split(/(\s+)/);
          parts.forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const inner = document.createElement('span');
            inner.className = chars ? 'ch' : 'w';
            inner.textContent = part;
            if (mask && !chars) {
              const outer = document.createElement('span');
              outer.className = 'wm';
              outer.appendChild(inner);
              frag.appendChild(outer);
            } else {
              frag.appendChild(inner);
            }
            out.push(inner);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
    return out;
  }

  /* ------------------------------------------------------------------
     small furniture: clock, year, barcodes, starburst
  ------------------------------------------------------------------ */
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const two = n => String(n).padStart(2, '0');
  const dateStamp = d => `${two(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  const timeStamp = (d, secs) => `${two(d.getHours())}:${two(d.getMinutes())}${secs ? ':' + two(d.getSeconds()) : ''}`;

  const clocks = $$('[data-clock]');
  const tick = () => {
    const d = new Date();
    clocks.forEach(el => { el.textContent = `${DAYS[d.getDay()]} ${dateStamp(d)} · ${timeStamp(d, true)}`; });
  };
  tick();
  setInterval(tick, 1000);

  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });
  $$('[data-barcode]').forEach(el => { el.innerHTML = barcodeHTML(); });

  $$('[data-burst]').forEach(el => {
    const [n, R, r] = el.dataset.burst.split(',').map(Number);
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (Math.PI * i) / n - Math.PI / 2;
      const rad = i % 2 ? r : R;
      pts.push(`${(Math.cos(a) * rad).toFixed(2)},${(Math.sin(a) * rad).toFixed(2)}`);
    }
    el.setAttribute('points', pts.join(' '));
  });

  /* ------------------------------------------------------------------
     product drawings (same outline style as the profile picture)
  ------------------------------------------------------------------ */
  function productSVG(p) {
    const c = p.colors || {};
    const B = color(c.body || 'amber');
    const C = color(c.cap || 'paper');
    const L = color(c.label || 'cream');
    const code = esc(p.code || '');
    const fs = code.length > 3 ? 11 : 13;
    const shine = d => `<path d="${d}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="5"/>`;
    const text = (y) => `<text class="pcode" x="60" y="${y}" style="font-size:${fs}px">${code}</text>`;
    const shapes = {
      dropper: `
        <rect x="49" y="5" width="22" height="44" rx="11" fill="${C}"/>
        <path d="M46 62v5c0 13-23 14-23 35v27c0 8.300 6.700 15 15 15h44c8.300 0 15-6.700 15-15v-27c0-21-23-22-23-35v-5z" fill="${B}"/>
        <rect x="37" y="40" width="46" height="22" rx="6" fill="${C}"/>
        ${shine('M32 96c0-9 5-14 12-17')}
        <rect x="33" y="99" width="54" height="34" rx="5" fill="${L}"/>
        ${text(121)}`,
      jar: `
        <path d="M24 90h72v36c0 10-8 18-18 18H42c-10 0-18-8-18-18z" fill="${B}"/>
        <rect x="16" y="64" width="88" height="28" rx="9" fill="${C}"/>
        <path d="M82 72v12M91 72v12" stroke-width="3"/>
        <rect x="36" y="103" width="48" height="29" rx="5" fill="${L}"/>
        ${text(122.5)}`,
      tube: `
        <path d="M33 24l11 96h32l11-96z" fill="${B}"/>
        <rect x="27" y="7" width="66" height="19" rx="5" fill="${B}"/>
        <path d="M39 12v9M48 12v9M57 12v9M66 12v9M75 12v9M84 12v9" stroke-width="2.500"/>
        <rect x="40" y="118" width="40" height="26" rx="7" fill="${C}"/>
        ${shine('M41 38l4 40')}
        <rect x="42" y="50" width="38" height="34" rx="5" fill="${L}"/>
        ${text(72)}`,
      pump: `
        <rect x="27" y="11" width="34" height="11" rx="5.500" fill="${C}"/>
        <rect x="46" y="7" width="36" height="20" rx="7" fill="${C}"/>
        <rect x="55" y="27" width="10" height="20" fill="${C}"/>
        <rect x="28" y="59" width="64" height="85" rx="15" fill="${B}"/>
        <rect x="42" y="45" width="36" height="16" rx="5" fill="${C}"/>
        ${shine('M38 76v30')}
        <rect x="45" y="86" width="40" height="38" rx="5" fill="${L}"/>
        ${text(110)}`,
      bottle: `
        <path d="M48 42h24v8c0 8 18 10 18 26v52c0 8.800-7.200 16-16 16H46c-8.800 0-16-7.200-16-16V76c0-16 18-18 18-26z" fill="${B}"/>
        <rect x="43" y="13" width="34" height="31" rx="7" fill="${C}"/>
        <path d="M52 20v17M60 20v17M68 20v17" stroke-width="2.500"/>
        ${shine('M39 82v26')}
        <rect x="45" y="86" width="38" height="40" rx="5" fill="${L}"/>
        ${text(111)}`,
    };
    return `<svg viewBox="0 0 120 150" aria-hidden="true" focusable="false">
      <g fill="none" stroke="#341A0E" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">${shapes[p.type] || shapes.bottle}</g>
    </svg>`;
  }

  /* ------------------------------------------------------------------
     the shelf
  ------------------------------------------------------------------ */
  const STEPS = [['all', 'All'], ['cleanse', 'Cleanse'], ['treat', 'Treat'], ['moisturize', 'Moisturize'], ['protect', 'Protect']];
  const STEP_NAME = Object.fromEntries(STEPS);
  const VERDICT = { grail: 'Holy grail', worth: 'Worth it', nice: 'Nice to have', skip: 'Skip it' };

  const lasts = days => {
    if (days < 50) return `About ${Math.round(days / 7)} weeks`;
    return `About ${Math.round(days / 30)} months`;
  };

  const grid = $('#shelf-grid');
  const filters = $('#filters');

  if (grid) {
    grid.innerHTML = D.products.map((p, i) => `
      <article class="card" data-step="${esc(p.step)}">
        <div class="card__in">
          <div class="card__stage" style="--stage:${color((p.colors || {}).stage || 'lilac')}">
            <span class="card__no">No. ${two(i + 1)}</span>
            <span class="card__step">${esc(STEP_NAME[p.step] || p.step)}</span>
            <div class="card__product">${productSVG(p)}</div>
            <span class="stamp stamp--${esc(p.verdict)}">${esc(VERDICT[p.verdict] || p.verdict)}</span>
          </div>
          <div class="card__body">
            <h3 class="card__name">${esc(p.name)}</h3>
            <p class="card__note">“${esc(p.note)}”</p>
            <dl class="card__rows">
              <div><dt>Good for</dt><i></i><dd>${esc(p.goodFor)}</dd></div>
              <div><dt>Size</dt><i></i><dd>${esc(p.size)}</dd></div>
              <div><dt>Per day</dt><i></i><dd>${money(p.price / p.days)}</dd></div>
            </dl>
            <div class="card__foot">
              <span class="card__price"><sup>${esc(D.currency)}</sup>${Number.isInteger(p.price) ? p.price : p.price.toFixed(2)}</span>
              <span class="card__lasts">${lasts(p.days)}${p.link ? `<br><a href="${esc(p.link)}" target="_blank" rel="noopener">Where to buy</a>` : ''}</span>
            </div>
          </div>
        </div>
      </article>`).join('');
  }

  const cards = $$('.card', grid || document);
  let cardTriggers = [];

  function applyFilter(step) {
    const show = c => step === 'all' || c.dataset.step === step;
    if (!MOTION || !window.Flip) {
      cards.forEach(c => { c.style.display = show(c) ? '' : 'none'; });
      return;
    }
    // make sure nothing is still waiting on its scroll-in animation
    cardTriggers.forEach(t => t.kill());
    cardTriggers = [];
    gsap.killTweensOf(cards);
    gsap.set(cards, { opacity: 1, y: 0, rotation: 0 });
    gsap.set($$('.stamp', grid), { opacity: 1, scale: 1 });

    const state = Flip.getState(cards);
    cards.forEach(c => { c.style.display = show(c) ? '' : 'none'; });
    Flip.from(state, {
      duration: .7, ease: 'power3.inOut', stagger: .02, absolute: true,
      onEnter: els => gsap.fromTo(els, { opacity: 0, scale: .82 }, { opacity: 1, scale: 1, duration: .5, delay: .12, ease: 'back.out(1.6)' }),
      onLeave: els => gsap.to(els, { opacity: 0, scale: .82, duration: .3 }),
      onComplete: () => ScrollTrigger.refresh(),
    });
  }

  if (filters) {
    filters.innerHTML = STEPS.map(([key, name], i) => {
      const n = key === 'all' ? D.products.length : D.products.filter(p => p.step === key).length;
      return `<button class="chip${i ? '' : ' is-active'}" type="button" data-filter="${key}" aria-pressed="${!i}">${name}<sup>${two(n)}</sup></button>`;
    }).join('');
    filters.addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip || chip.classList.contains('is-active')) return;
      $$('.chip', filters).forEach(c => {
        const on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', String(on));
      });
      applyFilter(chip.dataset.filter);
    });
  }

  /* ------------------------------------------------------------------
     returns desk
  ------------------------------------------------------------------ */
  const desk = $('#desk');
  const SCATTER = [
    [0, .06, -6], [.335, 0, 4], [.67, .14, -3], [1, .02, 6],
    [.15, .94, 5], [.5, 1, -5], [.85, .9, 3],
  ];
  if (desk) {
    desk.innerHTML = D.slips.map((s, i) => {
      const [x, y, r] = SCATTER[i % SCATTER.length];
      return `
      <article class="slip" style="--x:${x};--y:${y};--r:${r}" data-r="${r}">
        <div class="receipt-wrap"><div class="receipt receipt--both">
          <p class="r-center">Return slip No. ${two(i + 1)}</p>
          <div class="r-rule"></div>
          <p class="slip__k">The claim</p>
          <p class="slip__claim">“${esc(s.claim)}”</p>
          <p class="slip__k">The receipt</p>
          <p class="slip__real">${esc(s.reality)}</p>
          <div class="r-rule"></div>
          ${row(s.line[0], s.line[1])}
          <div class="slip__foot"><span class="stamp stamp--${esc(s.tone)}">${esc(s.stamp)}</span></div>
        </div></div>
      </article>`;
    }).join('');
  }
  const slips = $$('.slip', desk || document);

  /* ------------------------------------------------------------------
     routine printer
  ------------------------------------------------------------------ */
  const SKIN = { dry: 'Dry', oily: 'Oily', combo: 'Combination', sensitive: 'Sensitive' };
  const GOAL = { breakouts: 'Calm breakouts', spots: 'Fade dark spots', texture: 'Smooth texture', simple: 'Keep it simple' };

  // Which products go in the routine. Uses the ids from data.js.
  function buildRoutine(skin, goal) {
    const dryish = skin === 'dry' || skin === 'sensitive';
    const oilyish = skin === 'oily' || skin === 'combo';
    const cleanser = dryish ? 'milk-cleanser' : 'gel-cleanser';
    const moisturizer = dryish ? 'ceramide' : 'gelcream';
    const spf = skin === 'sensitive' ? 'mineral' : 'spf50';
    let am = null;
    let pm = null;
    let note = '';

    if (goal === 'breakouts') {
      pm = skin === 'sensitive' ? 'azelaic' : 'bha';
      am = oilyish ? 'niacinamide' : null;
      note = skin === 'sensitive'
        ? 'Azelaic acid every other night to start. Slow and steady wins.'
        : 'Salicylic acid three nights a week to start. More is not faster.';
    } else if (goal === 'spots') {
      am = skin === 'sensitive' ? null : 'vitc';
      pm = 'azelaic';
      note = 'Dark spots fade in months, not days. Skip the SPF and none of this works.';
    } else if (goal === 'texture') {
      pm = 'retinal';
      am = skin === 'dry' ? 'ha' : null;
      note = 'Retinal two nights a week for the first month, moisturizer on top. Never the same night as an acid.';
    } else {
      am = skin === 'dry' ? 'ha' : oilyish ? 'niacinamide' : null;
      note = 'That is the whole routine. Add nothing new for a month.';
    }
    return {
      am: [cleanser, am, moisturizer, spf].filter(Boolean),
      pm: [cleanser, pm, moisturizer].filter(Boolean),
      note,
    };
  }

  function receiptLines(skin, goal) {
    const r = buildRoutine(skin, goal);
    const find = id => D.products.find(p => p.id === id);
    const seen = new Set();
    let total = 0;
    let daily = 0;
    const item = id => {
      const p = find(id);
      if (!p) return '';
      if (seen.has(id)) return row(p.short, 'Again', 'r-row--again');
      seen.add(id);
      total += p.price;
      daily += p.price / p.days;
      return row(`1 × ${p.short}`, p.price.toFixed(2));
    };
    const now = new Date();
    const order = String(Math.floor(100000 + Math.random() * 899999));
    const morning = r.am.map(item);
    const evening = r.pm.map(item);

    return [
      BRAND,
      center('Routine receipt'),
      RULE,
      row('Date', `${dateStamp(now)} ${timeStamp(now)}`),
      row('Order', `#${order}`),
      row('Skin', SKIN[skin]),
      row('Goal', GOAL[goal]),
      RULE,
      center('Morning', 'r-head'),
      ...morning,
      center('Evening', 'r-head'),
      ...evening,
      RULE,
      row('Subtotal', total.toFixed(2)),
      row('Hype', '0.00'),
      row('Ten-step routine', 'Not charged'),
      row('Total', money(total), 'r-total'),
      row('Works out to', `${money(daily)} a day`),
      RULE,
      `<p class="r-note">${esc(r.note)}</p>`,
      '<p class="r-stamp"><span class="stamp">Approved</span></p>',
      `<div class="r-code"><span class="barcode">${barcodeHTML(1.6)}</span></div>`,
      center('Keep this receipt.'),
      center('Your skin keeps the results.'),
    ].filter(Boolean);
  }

  const quiz = $('#quiz');
  const hint = $('#quiz-hint');
  const rig = $('#rig');
  const printout = $('#printout');
  const wrap = $('#printout-wrap');
  const machine = $('#machine');
  const actions = $('#rig-actions');
  let printing = false;
  let hasReceipt = false;

  // the little stub of paper that waits in the slot; it fills in as you choose
  const stubHTML = (skin, goal) => [
    BRAND,
    center('Routine printer ready'),
    RULE,
    row('A. Skin', skin ? SKIN[skin] : '. . .'),
    row('B. Goal', goal ? GOAL[goal] : '. . .'),
    RULE,
    center(`${skin && goal ? 'All set. Hit print' : 'Pick A and B, then print'}<span class="blink">_</span>`),
  ].join('');
  const picks = () => { const f = new FormData(quiz); return [f.get('skin'), f.get('goal')]; };

  function finishPrint() {
    printing = false;
    hasReceipt = true;
    machine.classList.remove('is-printing');
    actions.hidden = false;
    if (MOTION) {
      gsap.fromTo(actions.children, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .5, stagger: .08, clearProps: 'all' });
      ScrollTrigger.refresh();
    }
  }

  function print(lines) {
    printing = true;
    actions.hidden = true;
    machine.classList.add('is-printing');
    printout.innerHTML = lines.join('');
    const stamp = $('.stamp', printout);
    const els = Array.from(printout.children);

    if (!MOTION) { finishPrint(); return; }

    // feed the paper out one printed line at a time
    els.forEach(el => { el.style.display = 'none'; });
    gsap.set(stamp, { opacity: 0 });
    const jitter = gsap.to(machine, { x: 1.5, duration: .045, repeat: -1, yoyo: true, ease: 'none' });
    const STEP = .075;
    const tl = gsap.timeline({
      onComplete: () => { jitter.kill(); gsap.set(machine, { x: 0 }); finishPrint(); },
    });
    els.forEach((el, i) => {
      tl.call(() => {
        el.style.display = '';
        const h = el.getBoundingClientRect().height + parseFloat(getComputedStyle(el).marginTop || 0);
        gsap.fromTo(wrap, { y: h }, { y: 0, duration: STEP * .85, ease: 'none', overwrite: 'auto' });
      }, null, i * STEP);
    });
    tl.fromTo(stamp, { opacity: 0, scale: 2.8 }, { opacity: 1, scale: 1, duration: .26, ease: 'power4.in' }, els.length * STEP + .3)
      .fromTo(wrap, { x: -3 }, { x: 0, duration: .5, ease: 'elastic.out(1.2,.2)' }, '>');
  }

  function tear(then) {
    const reset = () => {
      hasReceipt = false;
      if (then) { then(); return; }
      actions.hidden = true;
      printout.innerHTML = stubHTML(...picks());
      if (MOTION) {
        gsap.fromTo(wrap, { yPercent: 100 }, { yPercent: 0, duration: .5, ease: 'steps(7)' });
        ScrollTrigger.refresh();
      }
    };
    if (!MOTION) { reset(); return; }
    if (then) printing = true; // block double clicks while the old one flies off
    gsap.to(wrap, {
      y: -90, x: 60, rotation: 10, opacity: 0, duration: .5, ease: 'power2.in',
      onComplete: () => { gsap.set(wrap, { clearProps: 'all' }); reset(); },
    });
  }

  if (quiz && printout) {
    printout.innerHTML = stubHTML();

    quiz.addEventListener('change', () => {
      hint.textContent = '';
      $$('.quiz__set', quiz).forEach(s => s.classList.remove('is-missing'));
      if (printing || hasReceipt) return;
      printout.innerHTML = stubHTML(...picks());
      if (MOTION) gsap.fromTo(wrap, { y: 12 }, { y: 0, duration: .22, ease: 'steps(3)' });
    });

    quiz.addEventListener('submit', e => {
      e.preventDefault();
      if (printing) return;
      const data = new FormData(quiz);
      const skin = data.get('skin');
      const goal = data.get('goal');
      if (!skin || !goal) {
        hint.textContent = !skin && !goal ? 'Pick one from A and one from B first.'
          : !skin ? 'Pick your skin type (A) first.' : 'Pick a goal (B) first.';
        $$('.quiz__set', quiz).forEach(s => {
          const missing = !data.get(s.dataset.q);
          s.classList.remove('is-missing');
          if (missing) { void s.offsetWidth; s.classList.add('is-missing'); }
        });
        return;
      }
      hint.textContent = '';
      const go = () => print(receiptLines(skin, goal));
      if (hasReceipt) tear(go); else go();

      // on stacked layouts the printer sits below the form: bring it into view
      const box = machine.getBoundingClientRect();
      if (box.top > innerHeight - 120) scrollToEl(machine, -innerHeight * .6);
    });

    $('#btn-tear').addEventListener('click', () => { if (!printing) tear(); });
    $('#btn-paper').addEventListener('click', () => {
      $('#print-sheet').innerHTML = `<div class="receipt">${printout.innerHTML}</div>`;
      window.print();
    });
  }

  /* ------------------------------------------------------------------
     newsletter form
  ------------------------------------------------------------------ */
  // The form is switched off in index.html ("Opening soon") because it isn't
  // connected to an email provider yet. Once it is (see the TODO below), set
  // this to true and the form starts accepting addresses.
  const SIGNUP_LIVE = false;

  const signup = $('#signup');
  if (signup) {
    const input = $('#email');
    const msg = $('#signup-msg');
    if (SIGNUP_LIVE) {
      input.disabled = false;
      input.placeholder = 'you@email.com';
      $('button', signup).disabled = false;
      msg.textContent = '';
    }
    signup.addEventListener('submit', e => {
      e.preventDefault();
      if (!SIGNUP_LIVE) return;
      if (!input.value.trim() || !input.checkValidity()) {
        msg.textContent = "That doesn't look like an email address. Try again?";
        input.focus();
        return;
      }
      // TODO: send input.value to your email provider here (Beehiiv, Mailchimp,
      // ConvertKit…). Until then nothing is stored or sent.
      msg.textContent = 'Received. Your first receipt lands on Sunday.';
      signup.classList.remove('is-done');
      void signup.offsetWidth;
      signup.classList.add('is-done');
      input.value = '';
    });
  }

  /* ------------------------------------------------------------------
     nav, menu, anchors, scroll meter
  ------------------------------------------------------------------ */
  const nav = $('#nav');
  const toggle = $('#nav-toggle');
  const menu = $('#menu');
  const meter = $('#meter');
  const meterVal = $('#meter-val');
  let menuOpen = false;

  function setMenu(open) {
    menuOpen = open;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    toggle.setAttribute('aria-expanded', String(open));
    $('.nav__toggle-label', toggle).textContent = open ? 'Close' : 'Menu';
    html.style.overflow = open ? 'hidden' : '';
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
  }
  toggle.addEventListener('click', () => setMenu(!menuOpen));
  addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) setMenu(false); });

  function scrollToEl(el, offset = 0) {
    if (lenis) { lenis.scrollTo(el, { offset, duration: 1.3 }); return; }
    const y = el.getBoundingClientRect().top + scrollY + offset;
    scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    e.preventDefault();
    if (id === '#') return; // placeholder links
    const target = $(id);
    if (!target) return;
    if (menuOpen) setMenu(false);
    scrollToEl(target);
  });

  let lastY = scrollY;
  const PX_PER_METRE = 3779.53; // CSS pixels in a metre of paper
  function onScroll() {
    const y = scrollY;
    if (Math.abs(y - lastY) > 4) {
      nav.classList.toggle('is-hidden', y > 320 && y > lastY && !menuOpen);
      lastY = y;
    }
    const nearEnd = y + innerHeight > html.scrollHeight - 140;
    meter.classList.toggle('is-on', y > 160 && !nearEnd);
    meterVal.textContent = `${(y / PX_PER_METRE).toFixed(2)} m`;
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------
     footer wordmark: scale to fill the row exactly
  ------------------------------------------------------------------ */
  const mark = $('#footer-mark');
  if (mark) {
    const fit = document.createElement('span');
    fit.className = 'fit';
    while (mark.firstChild) fit.appendChild(mark.firstChild);
    mark.appendChild(fit);
  }
  function fitMark() {
    if (!mark) return;
    const fit = mark.firstElementChild;
    // Fraunces changes its letter widths with size (optical sizing), so the
    // text doesn't scale in a straight line: measure, correct, repeat.
    let size = parseFloat(getComputedStyle(mark).fontSize) || 100;
    for (let i = 0; i < 4; i++) {
      mark.style.fontSize = `${size}px`;
      const w = fit.getBoundingClientRect().width;
      if (!w) return;
      size *= (mark.clientWidth * .995) / w;
    }
    mark.style.fontSize = `${size}px`;
  }
  let resizeTimer;
  addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(fitMark, 120); });
  fontsReady.then(fitMark);

  /* ------------------------------------------------------------------
     no motion? we're done.
  ------------------------------------------------------------------ */
  const loader = $('#loader');
  if (!MOTION) {
    html.classList.add('no-motion');
    if (loader) loader.remove();
    return;
  }

  /* ==================================================================
     MOTION
  ================================================================== */
  gsap.registerPlugin(ScrollTrigger);
  if (window.Flip) gsap.registerPlugin(window.Flip);
  if (window.Draggable) gsap.registerPlugin(window.Draggable);
  if (window.InertiaPlugin) gsap.registerPlugin(window.InertiaPlugin);
  gsap.defaults({ ease: 'power3.out', duration: .9 });

  const scroll = { vel: 0, dir: 1, last: scrollY };

  function initSmoothScroll() {
    if (!window.Lenis || !finePointer) return;
    lenis = new window.Lenis({ lerp: .11 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(time => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  function heroIntro() {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    tl.from('.hero__title .ln', { yPercent: 120, duration: 1.2, stagger: .1 }, 0)
      .from('.nav', { yPercent: -200, duration: 1.1, clearProps: 'transform' }, .1)
      .from('.hero__meta', { opacity: 0, y: -12, duration: .8 }, .25)
      .from('.art__bottle', { yPercent: 45, scale: .55, rotation: -14, opacity: 0, duration: 1.4, ease: 'elastic.out(1,.72)', transformOrigin: '50% 100%' }, .2)
      .from('.art__jar', { yPercent: 70, scale: .55, rotation: 12, opacity: 0, duration: 1.4, ease: 'elastic.out(1,.72)', transformOrigin: '50% 100%' }, .34)
      .from('.art__receipt .receipt-wrap', { yPercent: 96, duration: 1.5, ease: 'steps(18)' }, .7)
      .from('.hero__sub > *', { y: 28, opacity: 0, duration: .9, stagger: .1 }, .65)
      .from('.sticker', { scale: 0, rotation: -50, duration: .9, ease: 'back.out(2.2)', stagger: .14 }, 1.25);
    return tl;
  }

  function initHero() {
    const hero = $('.hero');
    const art = $('#hero-art');
    if (!hero || !art) return;

    // idle life
    gsap.to('.j-swirl', { y: -8, rotation: -2.500, svgOrigin: '260 182', duration: 2.3, ease: 'sine.inOut', repeat: -1, yoyo: true });
    gsap.to('.b-drop', { scaleY: 1.1, scaleX: .93, svgOrigin: '210 774', duration: 1.2, ease: 'sine.inOut', repeat: -1, yoyo: true });
    const spin = gsap.to('.spin', { rotation: 360, svgOrigin: '100 100', duration: 18, ease: 'none', repeat: -1 });
    gsap.ticker.add(() => spin.timeScale(1 + Math.min(Math.abs(scroll.vel) / 250, 9)));

    // the receipt keeps feeding out as you scroll away
    gsap.to('.art__receipt .receipt-wrap', {
      y: -54, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .5 },
    });
    gsap.to('.hero__title', {
      yPercent: -9, ease: 'none',
      scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: .5 },
    });

    // poke the products
    $$('.art__bottle, .art__jar', art).forEach(el => {
      el.addEventListener('click', () => {
        gsap.timeline({ defaults: { transformOrigin: '50% 100%', overwrite: 'auto' } })
          .to(el, { scaleY: .88, scaleX: 1.08, duration: .12, ease: 'power2.out' })
          .to(el, { scaleY: 1, scaleX: 1, duration: 1, ease: 'elastic.out(1.1,.32)' });
      });
    });

    // pointer parallax
    if (finePointer) {
      const layers = $$('[data-depth]', art).map(el => ({
        d: parseFloat(el.dataset.depth),
        x: gsap.quickTo(el, 'x', { duration: .9, ease: 'power3' }),
        y: gsap.quickTo(el, 'y', { duration: .9, ease: 'power3' }),
      }));
      hero.addEventListener('pointermove', e => {
        const nx = e.clientX / innerWidth - .5;
        const ny = e.clientY / innerHeight - .5;
        layers.forEach(l => { l.x(nx * -34 * l.d); l.y(ny * -20 * l.d); });
      });
      hero.addEventListener('pointerleave', () => layers.forEach(l => { l.x(0); l.y(0); }));
    }
  }

  function initMarquee() {
    const track = $('.marquee__track');
    if (!track) return;
    const group = track.firstElementChild;
    let w = 0;
    const fill = () => {
      w = group.getBoundingClientRect().width;
      if (!w) return;
      const need = Math.ceil(innerWidth / w) + 2;
      while (track.children.length < need) track.appendChild(group.cloneNode(true));
    };
    fill();
    addEventListener('resize', fill);
    let x = 0;
    gsap.ticker.add((time, delta) => {
      if (!w) return;
      const boost = Math.min(Math.abs(scroll.vel) / 55, 26);
      x -= scroll.dir * (1.15 + boost) * (delta / 16.67);
      x = gsap.utils.wrap(-w, 0, x);
      const skew = gsap.utils.clamp(-9, 9, scroll.vel / -180);
      track.style.transform = `translate3d(${x.toFixed(2)}px,0,0) skewX(${skew.toFixed(2)}deg)`;
    });
  }

  function initText() {
    // manifesto: ink fills in as you read
    $$('[data-fill]').forEach(el => {
      const words = split(el, { mask: false });
      gsap.set(words, { opacity: .14 });
      gsap.to(words, {
        opacity: 1, ease: 'none', stagger: .08,
        scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: .5 },
      });
    });

    // section headings: words rise out of the line
    $$('[data-words]').forEach(el => {
      const words = split(el);
      gsap.set(words, { yPercent: 125, rotation: 7 });
      ScrollTrigger.create({
        trigger: el, start: 'top 88%', once: true,
        onEnter: () => gsap.to(words, { yPercent: 0, rotation: 0, duration: 1.05, ease: 'power4.out', stagger: .06 }),
      });
    });

    const fade = $$('.label, [data-reveal], .fineprint, .sec-head__aside, .filters, .weekly__stars').filter(el => !el.closest('.hero'));
    gsap.set(fade, { opacity: 0, y: 26 });
    ScrollTrigger.batch(fade, {
      start: 'top 90%', once: true,
      onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: .9, stagger: .08, overwrite: true }),
    });
  }

  function initLedger() {
    const rows = $$('.ledger__row');
    gsap.set(rows, { opacity: 0, y: 46 });
    ScrollTrigger.batch(rows, {
      start: 'top 88%', once: true,
      onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: 1, stagger: .12, overwrite: true }),
    });
  }

  function initShelf() {
    if (!cards.length) return;
    const stamps = $$('.stamp', grid);
    gsap.set(cards, { opacity: 0, y: 80, rotation: i => (i % 2 ? 3 : -3) });
    gsap.set(stamps, { opacity: 0, scale: 2.6 });
    cardTriggers = ScrollTrigger.batch(cards, {
      start: 'top 92%', once: true,
      onEnter: els => {
        gsap.to(els, { opacity: 1, y: 0, rotation: 0, duration: 1, ease: 'power3.out', stagger: .08, overwrite: true });
        els.forEach((el, i) => {
          gsap.to($('.stamp', el), { opacity: 1, scale: 1, duration: .24, ease: 'power4.in', delay: .5 + i * .08 });
        });
      },
    });
  }

  function initPrinter() {
    if (!rig) return;
    gsap.set(machine, { y: 70, opacity: 0 });
    gsap.set(wrap, { yPercent: 100 });
    gsap.set('.pick', { opacity: 0, y: 18, scale: .9 });
    ScrollTrigger.create({
      trigger: rig, start: 'top 82%', once: true,
      onEnter: () => {
        gsap.to(machine, { y: 0, opacity: 1, duration: 1, ease: 'back.out(1.5)' });
        gsap.to(wrap, { yPercent: 0, duration: .7, ease: 'steps(9)', delay: .55 });
      },
    });
    ScrollTrigger.create({
      trigger: quiz, start: 'top 85%', once: true,
      onEnter: () => gsap.to('.pick', { opacity: 1, y: 0, scale: 1, duration: .6, ease: 'back.out(1.8)', stagger: .05, clearProps: 'transform' }),
    });
  }

  function initDesk() {
    if (!desk || !slips.length) return;
    const cursor = $('#cursor');

    if (!deskDrag.matches) {
      gsap.set(slips, { opacity: 0, y: 50 });
      ScrollTrigger.batch(slips, {
        start: 'top 92%', once: true,
        onEnter: els => gsap.to(els, { opacity: 1, y: 0, duration: .9, stagger: .08, overwrite: true }),
      });
      return;
    }

    slips.forEach(s => gsap.set(s, { rotation: Number(s.dataset.r) * 3, y: -200, opacity: 0 }));
    let z = 10;
    const makeDraggable = () => {
      if (!window.Draggable) return;
      window.Draggable.create(slips, {
        type: 'x,y', bounds: desk, inertia: !!window.InertiaPlugin, edgeResistance: .78, zIndexBoost: false,
        onPress() {
          this.target.style.zIndex = ++z;
          gsap.to(this.target, { scale: 1.05, rotation: 0, duration: .3, ease: 'power3.out' });
        },
        onRelease() {
          gsap.to(this.target, { scale: 1, rotation: gsap.utils.random(-7, 7), duration: .7, ease: 'back.out(2.4)' });
        },
      });
    };
    ScrollTrigger.create({
      trigger: desk, start: 'top 72%', once: true,
      onEnter: () => {
        gsap.to(slips, {
          y: 0, opacity: 1, rotation: i => Number(slips[i].dataset.r),
          duration: 1.1, ease: 'back.out(1.25)', stagger: .09,
          onComplete: makeDraggable,
        });
      },
    });

    // "Drag" label that follows the pointer over the tray
    const cx = gsap.quickTo(cursor, 'x', { duration: .3, ease: 'power3' });
    const cy = gsap.quickTo(cursor, 'y', { duration: .3, ease: 'power3' });
    addEventListener('pointermove', e => {
      cx(e.clientX); cy(e.clientY);
      cursor.classList.toggle('is-on', !!e.target.closest && !!e.target.closest('#desk'));
    }, { passive: true });
    addEventListener('scroll', () => cursor.classList.remove('is-on'), { passive: true });
  }

  function initAbout() {
    const media = $('.about__media');
    if (!media) return;
    gsap.to('.about__ring', {
      rotation: 150, ease: 'none', transformOrigin: '50% 50%',
      scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: .8 },
    });
    gsap.set(media, { scale: .5, rotation: -30, opacity: 0 });
    ScrollTrigger.create({
      trigger: media, start: 'top 85%', once: true,
      onEnter: () => gsap.to(media, { scale: 1, rotation: 0, opacity: 1, duration: 1.4, ease: 'elastic.out(1,.7)' }),
    });
    const links = $$('.socials li');
    gsap.set(links, { opacity: 0, x: -40 });
    ScrollTrigger.batch(links, {
      start: 'top 92%', once: true,
      onEnter: els => gsap.to(els, { opacity: 1, x: 0, duration: .9, stagger: .1, overwrite: true }),
    });
  }

  function initFooter() {
    if (!mark) return;
    const chars = split(mark.firstElementChild, { chars: true });
    fitMark(); // letters are separate boxes now, so measure again
    gsap.set(chars, { yPercent: 115 });
    ScrollTrigger.create({
      trigger: mark, start: 'top 96%', once: true,
      onEnter: () => gsap.to(chars, { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: .035 }),
    });
    gsap.from('.footer .barcode i', {
      scaleY: 0, transformOrigin: '50% 100%', duration: .5, stagger: .012, ease: 'power2.out',
      scrollTrigger: { trigger: '.footer__base', start: 'top 100%', once: true },
    });
  }

  function initMotion() {
    initSmoothScroll();

    // one shared read of scroll speed for the marquee and the spinning badge
    gsap.ticker.add((time, delta) => {
      const y = scrollY;
      const raw = ((y - scroll.last) / Math.max(delta, 1)) * 1000;
      scroll.last = y;
      scroll.vel += (raw - scroll.vel) * .14;
      if (Math.abs(raw) > 40) scroll.dir = raw > 0 ? 1 : -1;
    });

    initHero();
    initMarquee();
    initText();
    initLedger();
    initShelf();
    initPrinter();
    initDesk();
    initAbout();
    initFooter();

    addEventListener('load', () => ScrollTrigger.refresh());
  }

  /* ------------------------------------------------------------------
     boot: count the loader up, wait for the fonts, lift the curtain
  ------------------------------------------------------------------ */
  const pct = $('#loader-pct');
  const counter = { v: 0 };
  const counted = new Promise(resolve => {
    gsap.to(counter, {
      v: 100, duration: 1.5, ease: 'power2.inOut',
      onUpdate: () => { if (pct) pct.textContent = String(Math.round(counter.v)).padStart(3, '0'); },
      onComplete: resolve,
    });
  });
  gsap.from('.loader .barcode i', { scaleY: 0, transformOrigin: '50% 100%', duration: .4, stagger: .02, ease: 'power2.out' });

  Promise.all([Promise.race([fontsReady, wait(3000)]), counted]).then(() => {
    fitMark();
    initMotion();
    const intro = heroIntro().pause();
    if (!loader) { intro.play(); return; }
    gsap.to(loader, {
      yPercent: -100, duration: 1.05, ease: 'power4.inOut', delay: .12,
      onStart: () => gsap.delayedCall(.5, () => intro.play()),
      onComplete: () => loader.remove(),
    });
  });
})();
