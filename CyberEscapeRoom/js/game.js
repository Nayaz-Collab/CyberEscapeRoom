/* ============================================
   GAME.JS — core engine shared by every page
   ============================================ */

const Game = (function(){

  let state = GameStorage.load();

  const ROOM_META = {
    room1: { title: 'Cipher Challenge',    file: 'room1.html', badge: 'CIPHER_BREAKER',  badgeLabel: '🔓 Cipher Breaker' },
    room2: { title: 'Phishing Detective',  file: 'room2.html', badge: 'PHISH_SNIPER',    badgeLabel: '🎣 Phishing Sniper' },
    room3: { title: 'Password Vault',      file: 'room3.html', badge: 'PASSWORD_PRO',    badgeLabel: '🔑 Password Pro' },
    room4: { title: 'SQL Injection',       file: 'room4.html', badge: 'SQL_GUARDIAN',    badgeLabel: '🛡 SQL Guardian' },
    room5: { title: 'Log Analysis',        file: 'room5.html', badge: 'LOG_DETECTIVE',   badgeLabel: '🕵 Log Detective' },
    room6: { title: 'URL Detective',       file: 'room6.html', badge: 'URL_HUNTER',      badgeLabel: '🌐 URL Hunter' }
  };

  /* ---------------- persistence helpers ---------------- */
  function persist(){ GameStorage.save(state); }
  function getState(){ return state; }

  function ensureStarted(){
    if(!state.started){
      state.started = true;
      state.timerEnd = Date.now() + TOTAL_TIME_SECONDS * 1000;
      persist();
    }
  }

  function hardReset(){
    state = GameStorage.reset();
  }

  /* ---------------- sound effects (synthesized, no audio files needed) ---------------- */
  let actx = null;
  function audioCtx(){
    if(!state.soundOn) return null;
    if(!actx){
      try{ actx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch(e){ return null; }
    }
    return actx;
  }

  function beep({freq=440, duration=0.08, type='square', gain=0.03, sweepTo=null}={}){
    const ctx = audioCtx();
    if(!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if(sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, ctx.currentTime + duration);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(g); g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  }

  const Sound = {
    key(){ beep({freq: 700 + Math.random()*300, duration:0.03, type:'square', gain:0.02}); },
    success(){ beep({freq:520, duration:0.12, type:'triangle', gain:0.05, sweepTo:880}); },
    error(){ beep({freq:220, duration:0.22, type:'sawtooth', gain:0.05, sweepTo:90}); },
    alert(){ beep({freq:180, duration:0.3, type:'square', gain:0.06, sweepTo:60}); },
    unlock(){ beep({freq:440, duration:0.1, type:'sine', gain:0.05, sweepTo:1200}); },
    toggle(){ state.soundOn = !state.soundOn; persist(); return state.soundOn; }
  };

  /* background typing sound while typewriter effect runs */
  function playTypingBurst(charCount){
    if(!state.soundOn) return;
    let i = 0;
    const iv = setInterval(()=>{
      if(i >= charCount){ clearInterval(iv); return; }
      if(Math.random() > 0.5) Sound.key();
      i += 2;
    }, 40);
  }

  /* ---------------- typewriter text effect ---------------- */
  function typeWriter(el, text, speed=18){
    return new Promise(resolve=>{
      el.textContent = '';
      let i = 0;
      playTypingBurst(text.length);
      const iv = setInterval(()=>{
        el.textContent += text.charAt(i);
        i++;
        if(i >= text.length){ clearInterval(iv); resolve(); }
      }, speed);
    });
  }

  /* ---------------- breach / glitch feedback ---------------- */
  function triggerBreachFlash(){
    const overlay = document.getElementById('breachOverlay');
    if(!overlay) return;
    overlay.classList.add('active');
    setTimeout(()=> overlay.classList.remove('active'), 550);
  }
  function shakeGlitch(el){
    if(!el) return;
    el.classList.remove('shake'); void el.offsetWidth;
    el.classList.add('shake');
  }

  /* ---------------- matrix rain background ---------------- */
  function startMatrixRain(canvasId='matrixRain'){
    const canvas = document.getElementById(canvasId);
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, cols, drops;
    const chars = 'アイウエオカキクケコ01{}<>/\\SECURITY'.split('');

    function resize(){
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      cols = Math.floor(w / 16);
      drops = new Array(cols).fill(1);
    }
    resize();
    window.addEventListener('resize', resize);

    function draw(){
      ctx.fillStyle = 'rgba(2,4,3,0.08)';
      ctx.fillRect(0,0,w,h);
      ctx.fillStyle = '#33ff66';
      ctx.font = '14px monospace';
      for(let i=0;i<drops.length;i++){
        const text = chars[Math.floor(Math.random()*chars.length)];
        ctx.fillText(text, i*16, drops[i]*16);
        if(drops[i]*16 > h && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ---------------- scoring ---------------- */
  function computeRoomScore(roomKey){
    const hints = state.hintsUsed[roomKey] || 0;
    const wrongs = state.attempts[roomKey] || 0;
    let score = 100 - (hints * 25) - (wrongs * 10);
    return Math.max(score, 20);
  }

  function registerHint(roomKey){
    state.hintsUsed[roomKey] = (state.hintsUsed[roomKey] || 0) + 1;
    persist();
    return state.hintsUsed[roomKey];
  }

  function registerWrongAttempt(roomKey){
    state.attempts[roomKey] = (state.attempts[roomKey] || 0) + 1;
    persist();
    return state.attempts[roomKey];
  }

  function awardAchievement(id, label){
    if(!state.achievements.includes(id)){
      state.achievements.push(id);
      persist();
      return true; // newly earned
    }
    return false;
  }

  function completeRoom(roomKey){
    if(state.roomsCompleted[roomKey]) return; // already done, avoid double scoring
    const pts = computeRoomScore(roomKey);
    state.score += pts;
    state.maxScore += 100;
    state.roomsCompleted[roomKey] = true;
    state.inventory[roomKey] = KEY_FRAGMENTS[roomKey];

    // perfect-run achievement (no hints, no wrong attempts)
    const hints = state.hintsUsed[roomKey] || 0;
    const wrongs = state.attempts[roomKey] || 0;
    if(hints === 0 && wrongs === 0){
      awardAchievement(ROOM_META[roomKey].badge, ROOM_META[roomKey].badgeLabel);
    }
    persist();
    return pts;
  }

  function nextRoomFile(currentKey){
    const idx = ROOM_ORDER.indexOf(currentKey);
    if(idx === -1 || idx === ROOM_ORDER.length - 1) return 'escape.html';
    return ROOM_META[ROOM_ORDER[idx+1]].file;
  }

  function isRoomUnlocked(roomKey){
    const idx = ROOM_ORDER.indexOf(roomKey);
    if(idx <= 0) return state.started;
    const prevKey = ROOM_ORDER[idx-1];
    return !!state.roomsCompleted[prevKey];
  }

  /* ---------------- HUD rendering ---------------- */
  function renderHUD(mountId='hud', currentRoomKey=null){
    const mount = document.getElementById(mountId);
    if(!mount) return;

    const dots = ROOM_ORDER.map(key=>{
      let cls = 'dot';
      if(state.roomsCompleted[key]) cls += ' done';
      else if(key === currentRoomKey) cls += ' current';
      return `<span class="${cls}" title="${ROOM_META[key].title}"></span>`;
    }).join('');

    const chips = ROOM_ORDER.map(key=>{
      const frag = state.inventory[key];
      return frag
        ? `<span class="inv-chip" title="${ROOM_META[key].title}">${frag}</span>`
        : `<span class="inv-chip empty">?</span>`;
    }).join('');

    mount.innerHTML = `
      <div class="hud-group">
        <div class="hud-item"><span class="hud-label">Score</span><span class="hud-value" id="hudScore">${state.score}</span></div>
        <div class="hud-item"><span class="hud-label">Time Left</span><span class="hud-value" id="hudTimer">--:--</span></div>
      </div>
      <div class="hud-group">
        <div class="hud-item"><span class="hud-label">Progress</span><div class="progress-dots">${dots}</div></div>
      </div>
      <div class="hud-group">
        <div class="hud-item"><span class="hud-label">Inventory</span><div class="inventory-strip">${chips}</div></div>
        <a class="btn-term" href="glossary.html${currentRoomKey ? '#'+currentRoomKey : ''}" style="padding:4px 10px;font-size:11px;text-decoration:none;">📖 Learn</a>
        <button class="btn-term" id="soundToggleBtn" style="padding:4px 10px;font-size:11px;">${state.soundOn ? '🔊 SND' : '🔇 SND'}</button>
      </div>
    `;

    const btn = document.getElementById('soundToggleBtn');
    if(btn){
      btn.addEventListener('click', ()=>{
        const on = Sound.toggle();
        btn.textContent = on ? '🔊 SND' : '🔇 SND';
      });
    }
  }

  function updateHudScore(){
    const el = document.getElementById('hudScore');
    if(el) el.textContent = state.score;
  }

  return {
    getState, persist, ensureStarted, hardReset,
    Sound, typeWriter, triggerBreachFlash, shakeGlitch, startMatrixRain,
    computeRoomScore, registerHint, registerWrongAttempt, awardAchievement,
    completeRoom, nextRoomFile, isRoomUnlocked, renderHUD, updateHudScore,
    ROOM_META, ROOM_ORDER
  };
})();
