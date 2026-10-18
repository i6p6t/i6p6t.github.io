(() => {
  'use strict';

  const GLYPHS = {
    '6': [' ████ ', '██    ', '█████ ', '██  ██', '██  ██', ' ████ ', '      '],
    'p': ['      ', '█████ ', '██  ██', '██  ██', '█████ ', '██    ', '██    '],
    't': [' ██   ', '█████ ', ' ██   ', ' ██   ', ' ██ ██', '  ███ ', '      ']
  };
  const BRAND = '6p6t';

  const TAGLINES = [
    'Python developer.',
    'Self-hosted storage, terminal video, subtitle tooling.',
    'Few dependencies. Simple to deploy.'
  ];

  const BOOT_LINES = [
    '6p6t v1.0',
    '[ ok ] loading glyphs',
    '[ ok ] starting interface',
    '[ ok ] ready',
    ''
  ];

  const ROUTES = ['about', 'projects', 'stack', 'timeline', 'contact'];
  const GH_USER = 'i6p6t';
  const CLOCK = { zone: 'Asia/Karachi', label: 'PKT', asleepFrom: 0, asleepTo: 10 };

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js');

  const sfx = (() => {
    let ctx = null, on = true, last = 0;
    try { on = localStorage.getItem('6p6t-sound') !== '0'; } catch (e) {}
    const play = (freq, dur, vol, type, delay) => {
      if (!on || !ctx || ctx.state !== 'running') return;
      const t = ctx.currentTime + (delay || 0);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(ctx.destination);
      o.start(t);
      o.stop(t + dur + 0.03);
    };
    return {
      enabled: () => on,
      set(v) {
        on = v;
        try { localStorage.setItem('6p6t-sound', v ? '1' : '0'); } catch (e) {}
      },
      unlock() {
        if (!ctx) {
          const A = window.AudioContext || window.webkitAudioContext;
          if (!A) return;
          ctx = new A();
        }
        if (ctx.state === 'suspended') ctx.resume();
      },
      hover() {
        const n = performance.now();
        if (n - last < 60) return;
        last = n;
        play(2400, 0.025, 0.008);
      },
      click() { play(900, 0.045, 0.025); },
      nav() {
        play(620, 0.05, 0.025);
        play(930, 0.07, 0.025, 'square', 0.055);
      }
    };
  })();

  function initSound() {
    const btn = $('#snd');
    const label = () => {
      if (!btn) return;
      btn.textContent = '[ sound: ' + (sfx.enabled() ? 'on' : 'off') + ' ]';
      btn.setAttribute('aria-pressed', String(sfx.enabled()));
    };
    label();

    addEventListener('pointerdown', () => sfx.unlock(), true);
    addEventListener('keydown', () => sfx.unlock(), true);

    if (btn) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        sfx.set(!sfx.enabled());
        label();
        sfx.click();
      });
    }

    document.addEventListener('pointerover', (e) => {
      if (e.pointerType !== 'mouse') return;
      const t = e.target.closest('a, button');
      if (!t || t.contains(e.relatedTarget)) return;
      sfx.hover();
    });

    document.addEventListener('click', (e) => {
      if (e.defaultPrevented) return;
      if (e.target.closest('a, button')) sfx.click();
    });
  }

  function boot() {
    const el = $('#boot');
    const pre = $('#boot-text');
    let seen = false;
    try { seen = sessionStorage.getItem('6p6t-booted') === '1'; } catch (e) {}

    if (!el || reduce || seen) {
      if (el) el.remove();
      document.body.classList.remove('loading');
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        el.classList.add('out');
        document.body.classList.remove('loading');
        try { sessionStorage.setItem('6p6t-booted', '1'); } catch (e) {}
        setTimeout(() => el.remove(), 480);
        resolve();
      };
      addEventListener('keydown', finish, { once: true });
      el.addEventListener('pointerdown', finish, { once: true });

      (async () => {
        let text = '';
        for (const line of BOOT_LINES) {
          text += line + '\n';
          pre.textContent = text;
          await sleep(120);
          if (done) return;
        }
        const W = 24;
        for (let i = 0; i <= W; i++) {
          const pct = Math.round((i / W) * 100);
          pre.textContent = text + '[' + '█'.repeat(i) + '░'.repeat(W - i) + '] ' + pct + '%';
          await sleep(28);
          if (done) return;
        }
        pre.textContent = text + '[' + '█'.repeat(W) + '] 100%\n\nready_';
        await sleep(380);
        finish();
      })();
    });
  }

  function buildArt(word) {
    const rows = [];
    for (let y = 0; y < 7; y++) {
      rows.push(Array.from(word).map((c) => (GLYPHS[c] || GLYPHS['6'])[y]).join('  '));
    }
    return rows;
  }

  function playArt(pre, rows, dur = 1500) {
    if (reduce) { pre.textContent = rows.join('\n'); return Promise.resolve(); }
    const noise = '░▒▓';
    const h = rows.length, w = rows[0].length;
    const settle = rows.map((r, y) => Array.from(r).map((_, x) => (x / w) * dur * 0.6 + y * 40 + Math.random() * dur * 0.25));
    const t0 = performance.now();
    return new Promise((res) => {
      (function frame(now) {
        const t = now - t0;
        let out = '', done = true;
        for (let y = 0; y < h; y++) {
          let line = '';
          for (let x = 0; x < w; x++) {
            const c = rows[y][x];
            if (c === ' ') line += ' ';
            else if (t >= settle[y][x]) line += c;
            else { line += noise[(Math.random() * 3) | 0]; done = false; }
          }
          out += line + (y < h - 1 ? '\n' : '');
        }
        pre.textContent = out;
        if (done) res(); else requestAnimationFrame(frame);
      })(t0);
    });
  }

  async function typeLoop(el, phrases) {
    if (reduce) { el.textContent = phrases[0]; return; }
    let i = 0;
    for (;;) {
      const p = phrases[i % phrases.length];
      for (let k = 1; k <= p.length; k++) { el.textContent = p.slice(0, k); await sleep(34 + Math.random() * 40); }
      await sleep(2400);
      for (let k = p.length; k >= 0; k--) { el.textContent = p.slice(0, k); await sleep(16); }
      await sleep(380);
      i++;
    }
  }

  const SCRAMBLE = '░▒▓█▄▀<>/\\|_-=+*#%&@$0123456789';
  function scramble(el, duration = 700) {
    if (!el) return;
    if (!el.dataset.text) {
      el.dataset.text = el.textContent;
      el.setAttribute('aria-label', el.textContent);
    }
    const final = el.dataset.text;
    if (reduce) { el.textContent = final; return; }
    cancelAnimationFrame(el._sr);
    const chars = Array.from(final);
    const settle = chars.map((_, i) => (i / chars.length) * duration * 0.6 + Math.random() * duration * 0.4);
    const t0 = performance.now();
    (function tick(now) {
      const t = now - t0;
      let out = '', done = true;
      for (let i = 0; i < chars.length; i++) {
        if (chars[i] === ' ' || t >= settle[i]) out += chars[i];
        else { out += SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0]; done = false; }
      }
      el.textContent = out;
      if (!done) el._sr = requestAnimationFrame(tick);
    })(t0);
  }

  function initLinks() {
    $$('.lnk').forEach((a) => {
      if (!a.querySelector('.t')) {
        const s = document.createElement('span');
        s.className = 't';
        while (a.firstChild) s.appendChild(a.firstChild);
        a.appendChild(s);
      }
      const t = a.querySelector('.t');
      a.addEventListener('pointerenter', () => scramble(t, 380));
      a.addEventListener('focus', () => scramble(t, 380));
    });
    const logo = $('.logo');
    if (logo && !reduce) {
      (function loop() {
        setTimeout(() => {
          logo.classList.add('glitch');
          setTimeout(() => logo.classList.remove('glitch'), 200);
          loop();
        }, 6000 + Math.random() * 5000);
      })();
    }
  }

  function buildFrames() {
    const run = '─'.repeat(300);
    const col = '│\n'.repeat(200);
    $$('.frame').forEach((f) => {
      const title = f.dataset.title;
      f.insertAdjacentHTML('beforeend',
        '<span class="fr fr-t" aria-hidden="true">' + run + '</span>' +
        '<span class="fr fr-b" aria-hidden="true">' + run + '</span>' +
        '<span class="fr fr-l" aria-hidden="true">' + col + '</span>' +
        '<span class="fr fr-r" aria-hidden="true">' + col + '</span>' +
        '<span class="fr fr-tl" aria-hidden="true">┌</span><span class="fr fr-tr" aria-hidden="true">┐</span>' +
        '<span class="fr fr-bl" aria-hidden="true">└</span><span class="fr fr-br" aria-hidden="true">┘</span>' +
        (title ? '<span class="fr-title" aria-hidden="true"></span>' : ''));
      if (title) f.querySelector('.fr-title').textContent = title;
    });
    $$('[data-rule]').forEach((r) => { r.textContent = r.dataset.rule.repeat(400); });
  }

  function initBG() {
    const cv = $('#bg');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const CH = ['·', '.', ':', '+', '='];
    const CW = 14, CHT = 20;
    let W = 0, H = 0, cols = 0, rows = 0, last = 0, raf = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(W / CW); rows = Math.ceil(H / CHT);
      draw(performance.now());
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.textBaseline = 'top';
      ctx.fillStyle = 'rgba(232,232,232,0.085)';
      const shift = scrollY / CHT * 0.25;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const yy = y + shift;
          const v = (Math.sin(x * 0.17 + t * 0.00035) + Math.sin(yy * 0.21 - t * 0.00028) + Math.sin((x + yy * 0.8) * 0.09 + t * 0.0002)) / 3;
          if (v > 0.15) ctx.fillText(CH[Math.min(4, Math.floor((v - 0.15) / 0.85 * 5))], x * CW, y * CHT);
        }
      }
    }

    function loop(now) {
      raf = requestAnimationFrame(loop);
      if (now - last < 45) return;
      last = now;
      draw(now);
    }

    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
    resize();
    if (reduce) return;
    raf = requestAnimationFrame(loop);
    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(loop);
    });
  }

  function initCursor() {
    if (!fine || reduce) return;
    const root = $('#cursor');
    const TRAIL = ['+', '·', '·', '.', '.', '.', '.'];
    const nodes = TRAIL.map((c, i) => {
      const s = document.createElement('span');
      s.textContent = c;
      s.style.opacity = String(1 - i / TRAIL.length);
      root.appendChild(s);
      return s;
    });
    const pos = nodes.map(() => ({ x: -50, y: -50 }));
    let tx = -50, ty = -50, active = false, over = false;

    addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      tx = e.clientX; ty = e.clientY;
      if (!active) {
        active = true;
        root.hidden = false;
        document.body.classList.add('ascii-cursor');
        pos.forEach((p) => { p.x = tx; p.y = ty; });
      }
      const hot = !!e.target.closest('a, button, [data-hot]');
      if (hot !== over) { over = hot; nodes[0].textContent = hot ? '[ ]' : '+'; }
      root.style.opacity = '1';
    }, { passive: true });
    document.addEventListener('mouseleave', () => { root.style.opacity = '0'; });

    (function loop() {
      requestAnimationFrame(loop);
      if (!active) return;
      pos.forEach((p, i) => {
        const tgt = i === 0 ? { x: tx, y: ty } : pos[i - 1];
        const k = i === 0 ? 0.55 : 0.42;
        p.x += (tgt.x - p.x) * k;
        p.y += (tgt.y - p.y) * k;
        nodes[i].style.transform = 'translate(' + p.x.toFixed(1) + 'px,' + p.y.toFixed(1) + 'px) translate(-50%,-50%)';
      });
    })();
  }

  const TW = 36, TH = 10;
  const THUMBS = {
    storage(t) {
      const L = Array.from({ length: TH }, () => Array(TW).fill(' '));
      const put = (y, x, s) => { for (let i = 0; i < s.length && x + i < TW; i++) L[y][x + i] = s[i]; };
      const levels = [0.72, 0.45, 0.58, 0.31], N = 20;
      put(0, 1, '6p6t-storage-service');
      levels.forEach((lv, i) => {
        const fill = Math.round(lv * N), head = Math.floor(t * 6 + i * 5) % N;
        let bar = '';
        for (let k = 0; k < N; k++) bar += k === head ? '▒' : k < fill ? '█' : '░';
        put(2 + i * 2, 1, 'd' + i + ' [' + bar + '] ' + Math.round(lv * 100) + '%');
      });
      put(9, 1, 'standard library only');
      return L.map((r) => r.join('')).join('\n');
    },
    player(t) {
      const ramp = ' .:-=+*#%@', rows = [];
      for (let y = 0; y < TH - 1; y++) {
        let l = '';
        for (let x = 0; x < TW; x++) {
          const v = (Math.sin(x * 0.28 + t) + Math.sin(y * 0.9 - t * 1.3) + Math.sin((x + y * 2) * 0.17 + t * 0.7)) / 3;
          l += ramp[Math.min(9, Math.floor(((v + 1) / 2) * 10))];
        }
        rows.push(l);
      }
      const W = 24, p = Math.max(0, Math.floor(t * 2)) % W, sec = Math.max(0, Math.floor(t * 3)) % 60;
      rows.push('▶ ' + '━'.repeat(p) + '●' + '─'.repeat(W - p - 1) + ' 0:' + String(sec).padStart(2, '0'));
      return rows.join('\n');
    },
    subs(t) {
      const L = Array.from({ length: TH }, () => Array(TW).fill(' '));
      const put = (y, x, s) => { for (let i = 0; i < s.length && x + i < TW; i++) L[y][x + i] = s[i]; };
      const msgs = ['Example subtitle.', 'Burned into the video.'];
      const msg = msgs[Math.floor(t / 4) % 2];
      const n = t === 0 ? msg.length : Math.min(msg.length, Math.floor((t % 4) * 7));
      const typed = msg.slice(0, n) + (n < msg.length ? '_' : '');
      put(0, 1, '1');
      put(1, 1, '00:00:01,000 --> 00:00:03,200');
      put(2, 1, typed);
      put(4, 7, '▼  burn-in  ▼');
      put(5, 1, '┌' + '─'.repeat(32) + '┐');
      for (let y = 6; y < 9; y++) put(y, 1, '│' + ' '.repeat(32) + '│');
      put(9, 1, '└' + '─'.repeat(32) + '┘');
      put(8, 2 + Math.floor((32 - typed.length) / 2), typed);
      return L.map((r) => r.join('')).join('\n');
    },
    wave(t) {
      const out = [];
      const tops = [];
      for (let x = 0; x < TW; x++) {
        tops.push(Math.round(4.5 + 2.6 * Math.sin(x * 0.3 + t) + 1.4 * Math.sin(x * 0.11 - t * 0.6)));
      }
      for (let y = 0; y < TH; y++) {
        let l = '';
        for (let x = 0; x < TW; x++) l += y === tops[x] ? '█' : y > tops[x] ? (y === tops[x] + 1 ? '▓' : '░') : ' ';
        out.push(l);
      }
      return out.join('\n');
    },
    net(t) {
      const g = Array.from({ length: TH }, () => Array(TW).fill(' '));
      const nodes = [[4, 2], [16, 1], [30, 3], [9, 7], [23, 6], [33, 8]];
      const edges = [[0, 1], [1, 2], [0, 3], [1, 4], [3, 4], [4, 5], [2, 5]];
      edges.forEach(([a, b]) => {
        const [x0, y0] = nodes[a], [x1, y1] = nodes[b];
        const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
        for (let i = 1; i < n; i++) {
          const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n);
          g[y][x] = Math.abs(y1 - y0) > Math.abs(x1 - x0) ? '│' : (y1 - y0) * (x1 - x0) === 0 ? '─' : '·';
        }
      });
      nodes.forEach(([x, y], i) => {
        const on = Math.sin(t * 1.6 + i) > 0;
        g[y][x] = on ? '◉' : '○';
        if (x > 0) g[y][x - 1] = '[';
        if (x < TW - 1) g[y][x + 1] = ']';
      });
      return g.map((r) => r.join('')).join('\n');
    },
    dither(t) {
      const ramp = ' .:-=+*#%@';
      const bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
      const cx = TW / 2, cy = TH / 2, R = 4.2 + Math.sin(t) * 0.7;
      let out = '';
      for (let y = 0; y < TH; y++) {
        for (let x = 0; x < TW; x++) {
          const d = Math.hypot((x - cx) * 0.5, y - cy);
          let v = Math.max(0, 1 - d / R) + Math.sin(x * 0.4 + t) * 0.04;
          v = Math.min(1, Math.max(0, v + (bayer[y % 4][x % 4] / 16 - 0.5) * 0.35));
          out += ramp[Math.floor(v * (ramp.length - 1))];
        }
        out += y < TH - 1 ? '\n' : '';
      }
      return out;
    }
  };

  function initThumbs() {
    $$('.thumb').forEach((pre) => {
      const fn = THUMBS[pre.dataset.thumb] || THUMBS.wave;
      pre.textContent = fn(0);
      if (reduce) return;
      const card = pre.closest('.card');
      let raf = 0;
      const start = () => {
        if (raf) return;
        const t0 = performance.now();
        (function f(now) {
          pre.textContent = fn(Math.max(0, (now - t0) / 700));
          raf = requestAnimationFrame(f);
        })(t0);
      };
      const stop = () => { cancelAnimationFrame(raf); raf = 0; pre.textContent = fn(0); };
      card.addEventListener('pointerenter', start);
      card.addEventListener('pointerleave', stop);
      card.addEventListener('focusin', start);
      card.addEventListener('focusout', stop);
    });
  }

  function initBars() {
    const N = 20;
    const render = (el, pct) => {
      const n = Math.round((pct / 100) * N);
      el.textContent = '[' + '█'.repeat(n) + '░'.repeat(N - n) + '] ' + String(Math.round(pct)).padStart(3, ' ') + '%';
    };
    const bars = $$('.bar');
    bars.forEach((b) => render(b, reduce ? +b.dataset.level : 0));
    if (reduce) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const target = +e.target.dataset.level, t0 = performance.now(), dur = 900;
        (function f(now) {
          const p = Math.min(1, (now - t0) / dur);
          render(e.target, target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(f);
        })(t0);
      });
    }, { threshold: 0.6 });
    bars.forEach((b) => io.observe(b));
  }

  function initFace() {
    const pre = $('#face');
    if (!pre) return;
    const slots = ['o  ', ' o ', '  o'];
    let look = 1, blink = false;
    const draw = () => {
      const s = slots[look].replace('o', blink ? '-' : 'o');
      pre.textContent = [
        '    .----------.    ',
        '   /            \\   ',
        '  |  (' + s + ')(' + s + ')  |  ',
        '  |      ..      |  ',
        '  |    \\____/    |  ',
        '   \\            /   ',
        "    '----------'    "
      ].join('\n');
    };
    draw();
    if (reduce) return;
    addEventListener('pointermove', (e) => {
      const r = pre.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth;
      const n = dx < -0.08 ? 0 : dx > 0.08 ? 2 : 1;
      if (n !== look) { look = n; draw(); }
    }, { passive: true });
    setInterval(() => { blink = true; draw(); setTimeout(() => { blink = false; draw(); }, 140); }, 4200);
  }

  function initReveal() {
    const targets = $$('.reveal, .frame, .sec-head, .foot .rule');
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.classList.add('in');
        io.unobserve(el);
        $$('[data-scramble]', el).forEach((h) => scramble(h, 800));
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    targets.forEach((t) => io.observe(t));
  }

  let current = '';
  let ready = false;
  let busy = false;
  let busyT = 0;

  const pathId = (p) => {
    const s = String(p || '').split(/[?#]/)[0].replace(/^\/+|\/+$/g, '');
    return ROUTES.indexOf(s) !== -1 ? s : '';
  };
  const routePath = (id) => (id ? '/' + id : '/');

  function lock() {
    busy = true;
    clearTimeout(busyT);
    busyT = setTimeout(() => { busy = false; }, 1100);
  }

  function setCurrent(id, push) {
    const path = routePath(id);
    if (location.pathname !== path) {
      try { history[push ? 'pushState' : 'replaceState'](null, '', path); } catch (e) {}
    }
    current = id;
    document.title = id ? id + ' — 6p6t' : '6p6t';
    $$('nav a[href^="/"]').forEach((a) => {
      if (a.getAttribute('href') === path) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  function scrollToId(id, smooth) {
    const behavior = smooth && !reduce ? 'smooth' : 'auto';
    const el = id ? document.getElementById(id) : null;
    if (el) el.scrollIntoView({ behavior, block: 'start' });
    else scrollTo({ top: 0, behavior });
  }

  function navigate(id) {
    lock();
    setCurrent(id, true);
    scrollToId(id, true);
    sfx.nav();
    const sec = id ? document.getElementById(id) : null;
    if (sec) setTimeout(() => $$('[data-scramble]', sec).forEach((h) => scramble(h, 700)), 350);
  }

  function initRouter() {
    try { history.scrollRestoration = 'manual'; } catch (e) {}

    const q = new URLSearchParams(location.search).get('p');
    if (q && location.pathname === '/') {
      try { history.replaceState(null, '', routePath(pathId(q))); } catch (e) {}
    }

    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      if (e.target.closest('.skip')) {
        e.preventDefault();
        const main = $('#main');
        if (main) main.focus({ preventScroll: true });
        return;
      }

      const a = e.target.closest('a[href^="/"]');
      if (!a) return;
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin) return;
      const id = pathId(u.pathname);
      if (u.pathname !== '/' && !id) return;
      e.preventDefault();
      navigate(id);
    });

    addEventListener('popstate', () => {
      const id = pathId(location.pathname);
      lock();
      setCurrent(id, false);
      scrollToId(id, true);
    });

    addEventListener('scrollend', () => {
      if (!busy) return;
      clearTimeout(busyT);
      busy = false;
    });

    const secs = ['top'].concat(ROUTES).map((id) => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting || !ready || busy) return;
        const id = e.target.id === 'top' ? '' : e.target.id;
        if (id !== current) setCurrent(id, false);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach((s) => io.observe(s));
  }

  function enterRoute() {
    const id = pathId(location.pathname);
    lock();
    setCurrent(id, false);
    if (id) scrollToId(id, false);
    ready = true;
  }

  function initProgress() {
    const el = $('#prog');
    if (!el) return;
    const N = 12;
    let last = -1;
    const update = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
      const pct = Math.round(p * 100);
      if (pct === last) return;
      last = pct;
      const n = Math.round(p * N);
      el.textContent = '[' + '█'.repeat(n) + '░'.repeat(N - n) + '] ' + String(pct).padStart(3, ' ') + '%';
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  }

  function initClock() {
    const el = $('#ltime');
    if (!el) return;
    const base = { hour: 'numeric', minute: '2-digit', hour12: true };
    const owner = new Intl.DateTimeFormat('en-US', Object.assign({ timeZone: CLOCK.zone }, base));
    const visitor = new Intl.DateTimeFormat('en-US', base);
    const ownerHour = new Intl.DateTimeFormat('en-GB', { timeZone: CLOCK.zone, hour: '2-digit', hourCycle: 'h23' });
    const same = Intl.DateTimeFormat().resolvedOptions().timeZone === CLOCK.zone;
    const tick = () => {
      const d = new Date();
      const h = +ownerHour.format(d);
      const status = 'likely ' + (h >= CLOCK.asleepFrom && h < CLOCK.asleepTo ? 'asleep' : 'awake');
      el.textContent = same
        ? owner.format(d) + ' ' + CLOCK.label + ' · ' + status
        : visitor.format(d) + ' your time · ' + owner.format(d) + ' ' + CLOCK.label + ' · ' + status;
    };
    tick();
    setInterval(tick, 20000);
  }

  function initNeofetch() {
    const logo = $('#nf-logo');
    const info = $('#nf-info');
    if (!logo || !info) return;
    logo.textContent = GLYPHS['6'].join('\n');

    const ua = navigator.userAgent;
    const known = [['Edg', 'Edge'], ['OPR', 'Opera'], ['FxiOS', 'Firefox'], ['Firefox', 'Firefox'], ['CriOS', 'Chrome'], ['Chrome', 'Chrome'], ['Version', 'Safari']];
    let browser = 'unknown';
    for (const [key, name] of known) {
      const m = ua.match(new RegExp(key + '/(\\d+)'));
      if (m) { browser = name + ' ' + m[1]; break; }
    }

    const nav = navigator;
    const conn = nav.connection || {};
    const rows = [
      ['os', (nav.userAgentData && nav.userAgentData.platform) || nav.platform],
      ['browser', browser],
      ['cpu', nav.hardwareConcurrency ? nav.hardwareConcurrency + ' threads' : ''],
      ['memory', nav.deviceMemory ? nav.deviceMemory + ' GB' : ''],
      ['screen', screen.width + 'x' + screen.height + ' @' + devicePixelRatio + 'x'],
      ['language', nav.language],
      ['timezone', Intl.DateTimeFormat().resolvedOptions().timeZone],
      ['network', conn.effectiveType || ''],
      ['theme', matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark']
    ].filter((r) => r[1]);

    const frag = document.createDocumentFragment();
    const head = document.createElement('strong');
    head.className = 'nf-head';
    head.textContent = 'visitor@browser';
    frag.append(head, '\n' + '─'.repeat(15) + '\n');
    rows.forEach(([k, v]) => {
      const key = document.createElement('span');
      key.className = 'k';
      key.textContent = k;
      frag.append(key, v + '\n');
    });
    frag.append('\nProcessed locally. Nothing is sent.');
    info.append(frag);
  }

  async function loadActivity() {
    const key = '6p6t-gh';
    const ttl = 30 * 60 * 1000;
    try {
      const c = JSON.parse(sessionStorage.getItem(key));
      if (c && Date.now() - c.t < ttl) return c.days;
    } catch (e) {}

    const pages = await Promise.all([1, 2, 3].map((p) =>
      fetch('https://api.github.com/users/' + GH_USER + '/events/public?per_page=100&page=' + p)
        .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
    ));
    const days = {};
    pages.forEach((list) => list.forEach((ev) => {
      const d = String(ev.created_at).slice(0, 10);
      days[d] = (days[d] || 0) + 1;
    }));
    try { sessionStorage.setItem(key, JSON.stringify({ t: Date.now(), days })); } catch (e) {}
    return days;
  }

  function renderActivity(days) {
    const pre = $('#heat');
    const WEEKS = 13, DAY = 864e5, PAD = 4;
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
    const now = new Date();
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const start = today - (new Date(today).getUTCDay() + (WEEKS - 1) * 7) * DAY;
    const level = (n) => (n === 0 ? '·' : n === 1 ? '░' : n < 4 ? '▒' : n < 7 ? '▓' : '█');

    const head = ' '.repeat(PAD + WEEKS * 2).split('');
    const rows = LABELS.map((l) => l.padEnd(PAD));
    let total = 0, prevMonth = -1;

    for (let c = 0; c < WEEKS; c++) {
      const colStart = start + c * 7 * DAY;
      const month = new Date(colStart).getUTCMonth();
      if (month !== prevMonth) {
        const nextSame = c + 1 < WEEKS && new Date(colStart + 7 * DAY).getUTCMonth() === month;
        const fits = PAD + c * 2 + 3 <= head.length;
        if ((c !== 0 || nextSame) && fits) {
          MONTHS[month].split('').forEach((ch, i) => { head[PAD + c * 2 + i] = ch; });
        }
        prevMonth = month;
      }
      for (let r = 0; r < 7; r++) {
        const t = colStart + r * DAY;
        if (t > today) { rows[r] += '  '; continue; }
        const n = days[new Date(t).toISOString().slice(0, 10)] || 0;
        total += n;
        rows[r] += level(n) + ' ';
      }
    }

    pre.textContent = head.join('') + '\n' + rows.join('\n') + '\n\n' +
      total + ' public events · last ' + WEEKS + ' weeks\nless ░ ▒ ▓ █ more';
    pre.setAttribute('aria-label', total + ' public GitHub events in the last ' + WEEKS + ' weeks');
  }

  function initActivity() {
    const box = $('#activity');
    if (!box || !$('#heat')) return;
    loadActivity().then(renderActivity).catch(() => { box.hidden = true; });
  }

  function initConsole() {
    console.log('%c6p6t', 'font:700 28px monospace');
    console.log('%cSource: github.com/' + GH_USER + '\nContact: hello@6p6t.lol', 'font:12px monospace;color:#888');
  }

  async function start() {
    initConsole();
    buildFrames();
    initLinks();
    initBG();
    initCursor();
    initThumbs();
    initBars();
    initFace();
    initReveal();
    initProgress();
    initClock();
    initNeofetch();
    initActivity();
    initRouter();
    initSound();

    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();

    await boot();
    enterRoute();

    const art = $('#hero-art');
    if (art) await playArt(art, buildArt(BRAND));
    const tag = $('#tagline');
    if (tag) typeLoop(tag, TAGLINES);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
