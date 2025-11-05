// --- utilità
const mmPerUnit = { mm:1, cm:10, dm:100, m:1_000, dam:10_000, hm:100_000, km:1_000_000 };

function gcd(a, b){ a=Math.abs(a); b=Math.abs(b); while(b){ const t=a%b; a=b; b=t } return a||1; }

function parseScale(s) {
  if (!s) return null;
  const t = s.trim().replaceAll(',', '.');

  // normalizza eventuali spazi attorno a ":" e "/"
  const clean = t.replace(/\s*:\s*/g, ':').replace(/\s*\/\s*/g, '/');

  if (clean.includes(':')) {
    const [A, B] = clean.split(':').map(p => p.trim());
    const a = Number(A), b = Number(B);
    if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return { a, b };
  }

  if (clean.includes('/')) {
    const [A, B] = clean.split('/').map(p => p.trim());
    const a = Number(A), b = Number(B);
    if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return { a, b };
  }

  const f = Number(clean);
  if (Number.isFinite(f)) return { a: f, b: 1 };
  return null;
}

function formatScale(a, b){
  // prova a ridurre a/b a interi se possibile con fino a 6 decimali
  const fix = (x)=> Number(x.toFixed(6));
  a = fix(a); b = fix(b);
  const k = 10**6;
  const Ai = Math.round(a*k), Bi = Math.round(b*k);
  const g = gcd(Ai, Bi);
  const ar = Ai/g, br = Bi/g;
  return `${ar} : ${br}`;
}

function formatDecimal(x){
  return new Intl.NumberFormat('it-IT', { minimumFractionDigits:0, maximumFractionDigits:6 }).format(x);
}

function formatWithDecimal(a,b){
  return `${formatScale(a,b)}  (${formatDecimal(a/b)})`;
}

// --- DOM
const unitSel = document.getElementById('unit');
const real = document.getElementById('real');
const acad = document.getElementById('acad');
const calc = document.getElementById('calc');
const resetBtn = document.getElementById('reset');
const errorEl = document.getElementById('error');

// traccia la sorgente: 'real' | 'acad' | null
let source = null;

function updateReadOnly(){
  if (source === 'real') {
    real.classList.remove('readonly');
    acad.classList.add('readonly');
  } else if (source === 'acad') {
    acad.classList.remove('readonly');
    real.classList.add('readonly');
  } else {
    real.classList.remove('readonly');
    acad.classList.remove('readonly');
  }
}

real.addEventListener('focus', ()=> { source='real'; updateReadOnly(); });
acad.addEventListener('focus', ()=> { source='acad'; updateReadOnly(); });
unitSel.addEventListener('change', ()=> updateReadOnly());

// permette di calcolare anche premendo Invio
function onEnter(e){ if (e.key === 'Enter') calc.click(); }
real.addEventListener('keydown', onEnter);
acad.addEventListener('keydown', onEnter);

calc.addEventListener('click', ()=>{
  errorEl.textContent = '';
  const u = mmPerUnit[unitSel.value];

  if (source === 'real') {
    const p = parseScale(real.value);
    if (!p){ errorEl.textContent = 'Scala reale non valida'; return; }
    const Lnum = p.a * u;
    const Lden = p.b;
    acad.value = formatWithDecimal(Lnum, Lden);
    updateReadOnly();
  } else if (source === 'acad') {
    const p = parseScale(acad.value);
    if (!p){ errorEl.textContent = 'Scala AutoCAD non valida'; return; }
    const Rnum = p.a / u;
    const Rden = p.b;
    real.value = formatWithDecimal(Rnum, Rden);
    updateReadOnly();
  } else {
    errorEl.textContent = 'Inserisci una scala in uno dei due campi';
  }
});

resetBtn.addEventListener('click', ()=>{
  real.value = '';
  acad.value = '';
  source = null;
  errorEl.textContent = '';
  updateReadOnly();
});

// stato iniziale: unità = m, nessuna sorgente
updateReadOnly();
