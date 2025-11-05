/* ==== helpers ==== */
const qs  = (s, el=document)=>el.querySelector(s);
const qsa = (s, el=document)=>[...el.querySelectorAll(s)];
const r   = (min,max)=> Math.floor(Math.random()*(max-min+1)) + min;
const pick= arr => arr[Math.floor(Math.random()*arr.length)];

/* ==== sounds ==== */
const SND = {
  ok:   new Audio('assets/sounds/correct.mp3'),
  bad:  new Audio('assets/sounds/wrong.mp3'),
  click:new Audio('assets/sounds/click.mp3'),
  fanfare:new Audio('assets/sounds/fanfare.mp3'),
};
Object.values(SND).forEach(a=>{ try{ a.preload='auto'; a.volume=0.7; }catch(e){} });
const safePlay = a => { try{ if(a){ a.currentTime=0; a.play(); } }catch(e){} };

/* ==== i18n ==== */
const I18N = {
  ua: {
    title: "Множення та ділення",
    mode: "Режим",
    digitsToggle: "Обрати числа (на які множимо/ділимо)",
    series: "Серія",
    start: "Почати",
    confirmTitle: "Підтвердження налаштувань",
    back: "Повернутись",
    confirm: "Підтвердити",
    answerPlaceholder: "Відповідь",
    answer: "Відповісти",
    next: "Далі",
    reset: "Скинути",
    finish: "Завершити",
    total: "Всього",
    ok: "Вірно",
    bad: "Помилки",
    prog: "Серія",
    results: "Результати",
    retry: "Спробувати ще",
    toSettings: "Налаштування",
    acc: "Точність",
    modeMul: "Множення",
    modeDiv: "Ділення",
    modeMix: "Змішано (× і ÷)",
    all: "Усі",
  },
  en: {
    title: "Multiplication & Division",
    mode: "Mode",
    digitsToggle: "Choose numbers to multiply/divide",
    series: "Series",
    start: "Start",
    confirmTitle: "Confirm settings",
    back: "Back",
    confirm: "Confirm",
    answerPlaceholder: "Answer",
    answer: "Submit",
    next: "Next",
    reset: "Clear",
    finish: "Finish",
    total: "Total",
    ok: "Correct",
    bad: "Wrong",
    prog: "Progress",
    results: "Results",
    retry: "Try again",
    toSettings: "Settings",
    acc: "Accuracy",
    modeMul: "Multiplication",
    modeDiv: "Division",
    modeMix: "Mixed (× & ÷)",
    all: "All",
  },
  ru: {
    title: "Умножение и Деление",
    mode: "Режим",
    digitsToggle: "Выбрать числа (для умножения/деления)",
    series: "Серия",
    start: "Начать",
    confirmTitle: "Подтверждение настроек",
    back: "Вернуться",
    confirm: "Подтвердить",
    answerPlaceholder: "Ответ",
    answer: "Ответить",
    next: "Далее",
    reset: "Сброс",
    finish: "Завершить",
    total: "Всего",
    ok: "Верно",
    bad: "Ошибки",
    prog: "Серия",
    results: "Результаты",
    retry: "Попробовать ещё",
    toSettings: "Настройки",
    acc: "Точность",
    modeMul: "Умножение",
    modeDiv: "Деление",
    modeMix: "Смешано (× и ÷)",
    all: "Все",
  },
  es: {
    title: "Multiplicación y División",
    mode: "Modo",
    digitsToggle: "Elegir números para multiplicar/dividir",
    series: "Serie",
    start: "Comenzar",
    confirmTitle: "Confirmar ajustes",
    back: "Volver",
    confirm: "Confirmar",
    answerPlaceholder: "Respuesta",
    answer: "Responder",
    next: "Siguiente",
    reset: "Borrar",
    finish: "Terminar",
    total: "Total",
    ok: "Correctas",
    bad: "Incorrectas",
    prog: "Progreso",
    results: "Resultados",
    retry: "Intentar de nuevo",
    toSettings: "Ajustes",
    acc: "Precisión",
    modeMul: "Multiplicación",
    modeDiv: "División",
    modeMix: "Mixto (× y ÷)",
    all: "Todos",
  }
};

/* ==== end phrases by language & accuracy ==== */
const END_PHRASES = {
  ua: {
    perfect: ["Вау! 100% — чемпіон!", "Без жодної помилки! Так тримати!"],
    great:   ["Супер результат!", "Молодець!"],
    good:    ["Гарна робота!", "Йде чудово!"],
    try:     ["Ти на правильному шляху!", "Ще трішки практики — і буде топ!"]
  },
  en: {
    perfect: ["Wow! 100% — champion!", "Flawless! Keep it up!"],
    great:   ["Awesome result!", "Great job!"],
    good:    ["Nice work!", "You’re doing great!"],
    try:     ["You’re on the right track!", "A bit more practice and you’ll nail it!"]
  },
  ru: {
    perfect: ["Вау! 100% — чемпион!", "Без единой ошибки! Так держать!"],
    great:   ["Отличный результат!", "Молодец!"],
    good:    ["Хорошая работа!", "Здорово идёт!"],
    try:     ["Ты на верном пути!", "Еще чуть-чуть — и будет идеально!"]
  },
  es: {
    perfect: ["¡Guau! ¡100% — campeón!", "¡Sin errores! ¡Sigue así!"],
    great:   ["¡Resultado genial!", "¡Buen trabajo!"],
    good:    ["¡Bien hecho!", "¡Vas muy bien!"],
    try:     ["¡Vas por buen camino!", "¡Un poco más y lo bordas!"]
  }
};
function pickEndPhrase(lang, acc){
  const pack = END_PHRASES[lang] || END_PHRASES.ua;
  const set =
    acc === 100 ? pack.perfect :
    acc >= 80   ? pack.great   :
    acc >= 50   ? pack.good    : pack.try;
  return set[Math.floor(Math.random()*set.length)];
}

function T(key){ const t = I18N[state.lang] || I18N.ua; return t[key] ?? key; }
function applyLang(lang){
  const t = I18N[lang] || I18N.ua;
  document.documentElement.lang = lang;
  document.title = `MindWorld — ${t.title}`;

  qs('#pageTitle')?.replaceChildren(t.title);

  // settings
  qs('#lblMode')?.replaceChildren(t.mode);
  qs('#lblDigitsToggle')?.replaceChildren(t.digitsToggle);
  qs('#lblSeries')?.replaceChildren(t.series);
  const startBtn = qs('#startBtn'); if(startBtn) startBtn.textContent = t.start;

  // подписи опций селекта "Режим"
  if (modeSel) {
    const oMul = modeSel.querySelector('option[value="mul"]');
    const oDiv = modeSel.querySelector('option[value="div"]');
    const oMix = modeSel.querySelector('option[value="rnd"]');
    if (oMul) oMul.textContent = t.modeMul;
    if (oDiv) oDiv.textContent = t.modeDiv;
    if (oMix) oMix.textContent = t.modeMix;
  }
  // чип "Усі/All/..."
  const chipAll = document.querySelector('#digitsGroup .chip[data-digit="all"]');
  if (chipAll) chipAll.textContent = t.all;

  // confirm
  qs('#confirmTitle')?.replaceChildren(t.confirmTitle);
  const backBtn = qs('#backToSettings'); if(backBtn) backBtn.textContent = t.back;
  const confirmBtn = qs('#confirmStart'); if(confirmBtn) confirmBtn.textContent = t.confirm;

  // play
  const ansInput = qs('#ansInput'); ansInput?.setAttribute('placeholder', t.answerPlaceholder);
  const submitBtn = qs('#submitBtn'); if(submitBtn) submitBtn.textContent = t.answer;
  const nextBtn = qs('#nextBtn'); if(nextBtn) nextBtn.textContent = t.next;
  const resetBtn = qs('#resetBtn'); if(resetBtn) resetBtn.textContent = t.reset;
  const finishBtn = qs('#finishBtn'); if(finishBtn) finishBtn.textContent = t.finish;

  // score labels
  const lblTotal = qs('#lblTotal'); if(lblTotal) lblTotal.firstChild.textContent = t.total + ': ';
  const lblOk    = qs('#lblOk');    if(lblOk)    lblOk.firstChild.textContent    = t.ok + ': ';
  const lblBad   = qs('#lblBad');   if(lblBad)   lblBad.firstChild.textContent   = t.bad + ': ';
  const lblProg  = qs('#lblProg');  if(lblProg)  lblProg.firstChild.textContent  = t.prog + ': ';

  // results screen
  qs('#resTitle')?.replaceChildren(t.results);
  qs('#resTotalLabel')?.replaceChildren(t.total);
  qs('#resOkLabel')?.replaceChildren(t.ok);
  qs('#resBadLabel')?.replaceChildren(t.bad);
  qs('#resAccLabel')?.replaceChildren(t.acc);
  const btnRetry = qs('#btnRetry'); if(btnRetry) btnRetry.textContent = t.retry;
  const btnToSettings = qs('#btnToSettings'); if(btnToSettings) btnToSettings.textContent = t.toSettings;

  // active lang capsule
  qsa(".lang-capsule button").forEach(b=> b.classList.toggle("active", b.dataset.lang===lang));
}

/* ==== state ==== */
const state = {
  lang:   localStorage.getItem("mw_lang")   || "ua",
  mode:   localStorage.getItem("mw_mode")   || "mul",  // mul|div|rnd
  series: Number(localStorage.getItem("mw_series") || 10),
  digitsEnabled: localStorage.getItem("mw_digits_enabled")==="1",
  digits: (localStorage.getItem("mw_digits") || "")
            .split(",").map(n=>Number(n)).filter(n=>!Number.isNaN(n)),
  // runtime
  n:0, ok:0, bad:0, q:null,
  revealed:false,
};

/* ==== screens ==== */
const scrSettings = qs('#screen-settings');
const scrConfirm  = qs('#screen-confirm');
const scrPlay     = qs('#screen-play');
const scrResults  = qs('#screen-results');
function showScreen(name){
  scrSettings.hidden = name!=='settings';
  scrConfirm.hidden  = name!=='confirm';
  scrPlay.hidden     = name!=='play';
  if(scrResults) scrResults.hidden = name!=='results';
}

/* ==== language capsule ==== */
qsa(".lang-capsule button").forEach(b=>{
  b.classList.toggle("active", b.dataset.lang===state.lang);
  b.addEventListener("click", ()=>{
    state.lang = b.dataset.lang;
    localStorage.setItem("mw_lang", state.lang);
    applyLang(state.lang);
    safePlay(SND.click);
  }, {capture:true});
});

/* ==== UI refs ==== */
const modeSel      = qs("#modeSel");
const seriesSel    = qs("#seriesSel");
const digitsEnable = qs("#digitsEnable");
const digitsGroup  = qs("#digitsGroup");

const startBtn     = qs("#startBtn");
const backBtn      = qs("#backToSettings");
const confirmBtn   = qs("#confirmStart");
const confirmList  = qs("#confirmList");

const qText        = qs("#qText");
const boardEl      = qs(".board");
const gameControls = qs("#gameControls");
const ansInput     = qs("#ansInput");
const submitBtn    = qs("#submitBtn");
const nextBtn      = qs("#nextBtn");
const resetBtn     = qs("#resetBtn");
const finishBtn    = qs("#finishBtn");
const okEl         = qs("#ok");
const badEl        = qs("#bad");
const totalEl      = qs("#total");
const progEl       = qs("#prog");

// progress bars
const miniProgress  = qs('#miniProgress');
const finalProgress = qs('#finalProgress');

// results refs
const resTotal = qs('#resTotal');
const resOk    = qs('#resOk');
const resBad   = qs('#resBad');
const resAcc   = qs('#resAcc');
const btnRetry = qs('#btnRetry');
const btnToSettings = qs('#btnToSettings');

/* ==== init controls ==== */
if (modeSel)   modeSel.value    = state.mode;
if (seriesSel) seriesSel.value  = String(state.series);
if (digitsEnable) digitsEnable.checked = state.digitsEnabled;
if (digitsGroup)  digitsGroup.classList.toggle("disabled", !state.digitsEnabled);

// важно: Enter не сабмитит форму
if (submitBtn) submitBtn.type = "button";

// restore digits
if (state.digits.length && digitsGroup) {
  state.digits.forEach(d=>{
    const btn = qs(`.chip[data-digit="${d}"]`, digitsGroup);
    if (btn) btn.classList.add("active");
  });
}
syncAllChip();

// apply language on load
applyLang(state.lang);

/* ==== listeners (settings screen) ==== */
modeSel?.addEventListener("change", ()=>{
  state.mode = modeSel.value; localStorage.setItem("mw_mode", state.mode);
});
seriesSel?.addEventListener("change", ()=>{
  state.series = Number(seriesSel.value); localStorage.setItem("mw_series", state.series);
});
digitsEnable?.addEventListener("change", ()=>{
  state.digitsEnabled = digitsEnable.checked;
  localStorage.setItem("mw_digits_enabled", state.digitsEnabled ? "1" : "0");
  digitsGroup?.classList.toggle("disabled", !state.digitsEnabled);
});
digitsGroup?.addEventListener("click", (e)=>{
  const b = e.target.closest(".chip"); if(!b) return;
  const v = b.dataset.digit;

  if (v === "all"){
    const chips = qsa('.chip[data-digit]:not([data-digit="all"])', digitsGroup);
    const allActive = chips.every(ch => ch.classList.contains("active"));
    chips.forEach(ch => ch.classList.toggle("active", !allActive));
    state.digits = !allActive ? chips.map(ch => Number(ch.dataset.digit)) : [];
  } else {
    b.classList.toggle("active");
    const d = Number(v);
    if (b.classList.contains("active")){
      if (!state.digits.includes(d)) state.digits.push(d);
    } else {
      state.digits = state.digits.filter(x=>x!==d);
    }
  }
  localStorage.setItem("mw_digits", state.digits.join(","));
  syncAllChip();
});

/* ==== flow buttons ==== */
startBtn?.addEventListener("click", ()=>{ buildConfirm(); safePlay(SND.click); });
backBtn ?.addEventListener("click", ()=>{ showScreen('settings'); safePlay(SND.click); });
confirmBtn?.addEventListener("click", ()=>{ startGame(); showScreen('play'); safePlay(SND.click); });

/* ==== confirm builder ==== */
function buildConfirm(){
  state.mode   = modeSel?.value ?? state.mode;
  state.series = Number(seriesSel?.value ?? state.series);

  const modeText =
    state.mode === 'mul' ? T('modeMul') :
    state.mode === 'div' ? T('modeDiv') :
                           T('modeMix');

  const digitsText = state.digitsEnabled
    ? (state.digits.length ? state.digits.slice().sort((a,b)=>a-b).join(', ') : '—')
    : T('all');

  if (confirmList){
    confirmList.innerHTML = `
      <li><b>${T('mode')}:</b> ${modeText}</li>
      <li><b>${T('series')}:</b> ${state.series}</li>
      <li style="grid-column:1 / -1;"><b>${T('digitsToggle')}:</b> ${digitsText}</li>
    `;
  }
  showScreen('confirm');
}

/* ==== progress bars ==== */
function setProgressBars(ok, bad, total){
  const pOk  = total ? (ok/total)*100 : 0;
  const pBad = total ? (bad/total)*100 : 0;
  const pRest = Math.max(0, 100 - pOk - pBad);

  function apply(bar){
    if(!bar) return;
    const g    = bar.querySelector('.progress__green');
    const red  = bar.querySelector('.progress__red');
    const rest = bar.querySelector('.progress__rest');
    if (g)   g.style.width = pOk + '%';
    if (red){ red.style.left = pOk + '%'; red.style.width = pBad + '%'; }
    if (rest) rest.style.width = pRest + '%';
  }
  apply(miniProgress);
  apply(finalProgress);
}


/* ==== series builder (unique, capped, and mixed-run constraint) ==== */
function buildQuestionPoolsSplit(){
  const usePool = state.digitsEnabled && state.digits.length>0;
  const sel = usePool ? [...state.digits] : null;

  const mkMul = (a,b)=>({a,b,ans:a*b,op:'×'});
  const mkDiv = (d,q)=>({a:d*q, b:d, ans:q, op:'÷'});

  let poolMul = [];
  let poolDiv = [];

  const A = sel ? sel : [...Array(10).keys()];
  for(const a of A){
    for(let b=0;b<=9;b++){
      poolMul.push(mkMul(a,b));
    }
  }
  const D = sel ? sel.filter(d=>d!==0) : [1,2,3,4,5,6,7,8,9];
  for(const d of D){
    for(let q=0;q<=9;q++){
      poolDiv.push(mkDiv(d,q));
    }
  }
  return {poolMul, poolDiv};
}
function shuffle(arr){ return arr.slice().sort(()=>Math.random()-0.5); }
function keyOf(q){ return `${q.op}:${q.a}:${q.b}`; }
function opCode(q){ return q.op==='×' ? 'mul' : 'div'; }

function buildSeriesList(){
  const N = state.series;
  const mode = (state.mode==='rnd') ? 'rnd' : state.mode;

  if (mode !== 'rnd'){
    const {poolMul, poolDiv} = buildQuestionPoolsSplit();
    const base = mode==='mul' ? poolMul : poolDiv;
    const pool = shuffle(base);
    if (N <= pool.length) return pool.slice(0, N);
    const cap = 2;
    const counts = new Map();
    const out = pool.slice(0);
    pool.forEach(q => counts.set(keyOf(q), 1));
    while(out.length < N){
      for(const q of shuffle(base)){
        const k = keyOf(q);
        const c = counts.get(k) || 0;
        if (c < cap){
          out.push(q);
          counts.set(k, c+1);
          if (out.length===N) break;
        }
      }
      if (out.length < N && base.length===0) break;
    }
    return shuffle(out);
  }

  const {poolMul, poolDiv} = buildQuestionPoolsSplit();
  const uniquePoolSize = new Set([...poolMul.map(keyOf), ...poolDiv.map(keyOf)]).size;
  const needUniqueOnly = N <= uniquePoolSize;
  const cap = 2;
  const counts = new Map();
  const used = new Set();

  let availMul = shuffle(poolMul);
  let availDiv = shuffle(poolDiv);

  const take = (pool, allowRepeat) => {
    for(const q of shuffle(pool)){
      const k = keyOf(q);
      const c = counts.get(k) || 0;
      if (c >= cap) continue;
      if (!allowRepeat && used.has(k)) continue;
      // consume once from avail
      return q;
    }
    return null;
  };

  const out = [];
  while(out.length < N){
    const last1 = out.length>=1 ? opCode(out[out.length-1]) : null;
    const last2 = out.length>=2 ? opCode(out[out.length-2]) : null;
    const mustSwitch = (last1 && last2 && last1===last2);

    const order = mustSwitch ? (last1==='mul' ? ['div','mul'] : ['mul','div'])
                             : (Math.random()<0.5 ? ['mul','div'] : ['div','mul']);

    let q = null;
    for(const op of order){
      if (op==='mul'){
        q = take(availMul, !needUniqueOnly);
        if (q){ availMul = availMul.filter(x => keyOf(x)!==keyOf(q)); break; }
      } else {
        q = take(availDiv, !needUniqueOnly);
        if (q){ availDiv = availDiv.filter(x => keyOf(x)!==keyOf(q)); break; }
      }
    }
    if (!q){
      // fallback: allow from full pools under cap/uniqueness
      q = take([...poolMul, ...poolDiv], !needUniqueOnly);
      if (!q) break;
    }

    const k = keyOf(q);
    used.add(k);
    counts.set(k, (counts.get(k) || 0) + 1);
    out.push(q);
  }
  if (out.length > N) out.length = N;
  return out;
}

/* ==== game flow ==== */
function startGame(){
  state.n=0; state.ok=0; state.bad=0; state.q=null; state.revealed=false;
  if (totalEl) totalEl.textContent = state.series;
  clearBoardHighlight();
  setProgressBars(0,0,state.series);
  state.queue = buildSeriesList();
  next();
}

submitBtn?.addEventListener("click", ()=>{ check(); safePlay(SND.click); });
nextBtn  ?.addEventListener("click", ()=>{ next();  safePlay(SND.click); });
resetBtn ?.addEventListener("click", ()=>{ if(ansInput){ ansInput.value=''; ansInput.focus(); } safePlay(SND.click); });
finishBtn?.addEventListener("click", ()=>{
  clearBoardHighlight();
  showScreen('settings');
  safePlay(SND.click);
});

// Enter: сначала показать ответ, второй Enter — следующий пример
ansInput?.addEventListener("keydown", (e)=>{
  if (e.key === 'Enter') {
    e.preventDefault();
    if (!state.revealed) check();
    else next();
  }
});

function next(){
  state.revealed = false;
  clearBoardHighlight();

  if (state.n >= state.series){
    const total = state.series;
    const ok = state.ok;
    const bad = state.bad;
    const acc = total ? Math.round((ok/total)*100) : 0;

    if (resTotal) resTotal.textContent = total;
    if (resOk)    resOk.textContent    = ok;
    if (resBad)   resBad.textContent   = bad;
    if (resAcc)   resAcc.textContent   = acc + '%';
    setProgressBars(ok, bad, total);

    // умная фраза вместо "Готово"
    const phrase = pickEndPhrase(state.lang, acc);
    const titleEl = document.getElementById('resTitle');
    if (titleEl) titleEl.textContent = phrase;

    showScreen('results');
    safePlay(SND.fanfare);
    runConfetti(3500);
    return;
  }

  state.n++;
  state.q = (state.queue && state.queue[state.n-1]) || genQ();
  if (qText) qText.textContent = `${state.q.a} ${state.q.op} ${state.q.b} = ?`;
  if (ansInput){ ansInput.value = ''; ansInput.focus(); }
  updateScore();
}

function genQ(){
  const mode = (state.mode==='rnd') ? (Math.random()<0.5?'mul':'div') : state.mode;

  const usePool = state.digitsEnabled && state.digits.length>0;
  const pool    = usePool ? [...state.digits] : null;

  if (mode==='mul'){
    const a = pool ? pick(pool) : r(0,9);
    const b = r(0,9);
    return {a,b,ans:a*b,op:'×'};
  }else{
    let divPool = pool ? pool.filter(n=>n!==0) : null;
    if(!divPool || !divPool.length) divPool = [1,2,3,4,5,6,7,8,9];
    const d  = pick(divPool);
    const qv = r(0,9);
    return {a:d*qv, b:d, ans:qv, op:'÷'};
  }
}

function check(){
  if(!state.q || state.revealed) return;

  const s = ansInput?.value.trim() ?? '';
  const v = Number(s);
  if(s==='' || Number.isNaN(v)){ ansInput?.focus(); return; }

  state.revealed = true;

  const isRight = (v === state.q.ans);
  if (isRight){
    state.ok++;
    highlightBoard(true);
    safePlay(SND.ok);
  } else {
    state.bad++;
    highlightBoard(false);
    safePlay(SND.bad);
  }

  // показываем правильный ответ
  if (qText) qText.textContent = `${state.q.a} ${state.q.op} ${state.q.b} = ${state.q.ans}`;

  updateScore();
  nextBtn?.focus();
}

function updateScore(){
  if (okEl)   okEl.textContent   = state.ok;
  if (badEl)  badEl.textContent  = state.bad;
  if (progEl) progEl.textContent = `${Math.min(state.n,state.series)}/${state.series}`;
  setProgressBars(state.ok, state.bad, state.series);
}

/* Подсветка всей доски */
function highlightBoard(ok){
  if(!boardEl) return;
  boardEl.classList.remove('is-correct','is-wrong');
  boardEl.classList.add(ok ? 'is-correct' : 'is-wrong');
}
function clearBoardHighlight(){
  if(!boardEl) return;
  boardEl.classList.remove('is-correct','is-wrong');
}

/* вспомогательное для чипа "Усі" */
function syncAllChip(){
  if(!digitsGroup) return;
  const allBtn = qs('.chip[data-digit="all"]', digitsGroup);
  if(!allBtn) return;
  const chips = qsa('.chip[data-digit]:not([data-digit="all"])', digitsGroup);
  const allActive = chips.length>0 && chips.every(ch=>ch.classList.contains("active"));
  allBtn.classList.toggle("active", allActive);
}

/* ==== default screen ==== */
showScreen('settings');

/* результаты: делегирование + стоп конфетти */
document.addEventListener('click', (e) => {
  const el = e.target.closest('button');
  if (!el) return;

  if (el.id === 'btnRetry') {
    e.preventDefault();
    stopConfetti();
    startGame();
    showScreen('play');
    safePlay?.(SND?.click);
  }

  if (el.id === 'btnToSettings') {
    e.preventDefault();
    stopConfetti();
    showScreen('settings');
    safePlay?.(SND?.click);
  }
});

/* ==== confetti ==== */
let confettiRAF = null;
function runConfetti(duration=3000){
  const cvs = document.getElementById('confettiCanvas');
  if(!cvs) return;
  const ctx = cvs.getContext('2d');
  const DPR = Math.max(1, window.devicePixelRatio || 1);

  function resize(){
    cvs.width  = Math.floor(window.innerWidth  * DPR);
    cvs.height = Math.floor(window.innerHeight * DPR);
    cvs.style.display = 'block';
  }
  resize();
  window.addEventListener('resize', resize, { once:true });

  const colors = ['#FDD835','#FF7043','#66BB6A','#42A5F5','#AB47BC'];
  const N = Math.round((cvs.width/DPR) * 0.2);
  const P = Array.from({length:N}, ()=>({
    x: Math.random()*cvs.width,
    y: -Math.random()*cvs.height*0.5,
    r: 2 + Math.random()*4,
    vx: -1 + Math.random()*2,
    vy: 2 + Math.random()*3,
    col: colors[Math.floor(Math.random()*colors.length)],
    rot: Math.random()*Math.PI,
    vr: -0.1 + Math.random()*0.2
  }));

  const t0 = performance.now();
  cancelAnimationFrame(confettiRAF);

  function tick(t){
    const dt = (t - (tick.prev||t))/16.7; tick.prev = t;
    ctx.clearRect(0,0,cvs.width,cvs.height);

    for(const p of P){
      p.x += p.vx * DPR;
      p.y += p.vy * DPR;
      p.rot += p.vr*dt;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.col;
      ctx.fillRect(-p.r*DPR, -p.r*DPR, p.r*2*DPR, p.r*2*DPR);
      ctx.restore();

      if(p.y > cvs.height + 20*DPR) {
        p.y = -10*DPR; p.x = Math.random()*cvs.width;
      }
    }

    if (t - t0 < duration){
      confettiRAF = requestAnimationFrame(tick);
    } else {
      stopConfetti();
    }
  }
  confettiRAF = requestAnimationFrame(tick);
}
function stopConfetti(){
  cancelAnimationFrame(confettiRAF);
  confettiRAF = null;
  const cvs = document.getElementById('confettiCanvas');
  if(cvs) cvs.style.display = 'none';
}
