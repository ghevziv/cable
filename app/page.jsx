‘use client‘


import { useState, useRef, useEffect } from ‘react’;

const CLARIFYING_QUESTIONS_PROMPT = `אתה פסיכיאטר בכיר מנחה. קיבלת תיאור גולמי של מקרה פסיכיאטרי ממיון. צור 6-10 שאלות הבהרה קריטיות.

חלקן שאלות רב-ברירה (mcq) וחלקן פתוחות (open).
שאל רק על מידע שלא ברור מהקלט. התמקד בדגלים אדומים, אבחנה, סיכון, וטיפול.

החזר JSON בדיוק בפורמט הזה, ללא טקסט נוסף:
{
“questions”: [
{“id”:“q1”,“text”:“שאלה?”,“type”:“mcq”,“options”:[“אפשרות א”,“אפשרות ב”,“אפשרות ג”]},
{“id”:“q2”,“text”:“שאלה פתוחה?”,“type”:“open”}
]
}`;

const INTAKE_PROMPT = `אתה עוזר קליני לפסיכיאטר מתמחה בתורנות מיון בישראל. הפק קבלת מיון פסיכיאטרית מקצועית בעברית רפואית.

⚠️ פרטיות: אין שמות, ת.ז., תאריכי לידה, כתובות. השתמש ב-[שם המטופל] וכו’.
⚠️ תרופות: אסור להמציא מינונים. ⚠️לאימות בסוף כל שורת תרופה.
⚠️ דגלים: 🚩 בפתיח הסיכום אם יש סיכון.
⚠️ מידע חסר: “לבירור” — לא להמציא.

פורמט:

התקבל במסגרת תורנות מיון.
[הגיע עם הפנייה / ללא הפנייה]
[מוכר / לא מוכר למוסדנו]
הגיע [בליווי / בגפו]

[רקע דמוגרפי — גיל, משפחה, מגורים, תעסוקה, ביטוח לאומי]

[היסטוריה פסיכיאטרית + תרופות ⚠️לאימות]

ברקע —

- גופני —
- פסיכופתולוגיה משפחתית —
- שימוש בחומרים —

מחלה נוכחית —
[התפתחות, ציטוטים בגרשיים, תשאול ייעודי]
שולל [תסמינים] בעבר ובהווה.
אובדנות — [בעבר ובהווה, תכנית, אמצעי]

תולדות המחלה —

תולדות עבר —

בדיקת מצב נפשי —
הופעה: | דיבור: | מצב רוח: | אפקט: | חשיבה: | תפיסה: | תובנה: | שיפוט:

לסיכום,
[רושם קליני, אבחנה מבדלת, רמת סיכון]

בייעוץ עם כונן ד״ר ___ —
א.
ב.
ג.

📌 חוסרים לבירור:`;

const MONOLOGUE_PROMPT = `אתה עוזר לפסיכיאטר מתמחה בישראל. כתוב מונולוג פורמלי ורהוט להצגה בעל פה לבכיר/כונן.

⚠️ פרטיות: אין פרטים מזהים.
⚠️ אורך: 8-12 משפטים. פסקה אחת רצופה, ללא כותרות.
⚠️ מבנה: מי המטופל ← למה הגיע ← מה מתרשם ← מה מתוכנן ← מה ההתלבטויות.

התחל ב”הגיע מטופל…” וסיים ב”…ורציתי להתייעץ בנוגע ל[ההתלבטות המרכזית].”
טון פורמלי, בטוח, קליני. כאילו עומד מול בכיר.`;

const TREATMENT_PROMPT = `אתה פסיכיאטר בכיר מנוסה. כתוב תוכנית טיפול מעמיקה ויצירתית בשלושה צירים.

⚠️ פרטיות: אין פרטים מזהים.
⚠️ תרופות: ⚠️לאימות על כל המלצה. שיקולים ומשפחות — לא מינונים ספציפיים.

💊 ציר תרופתי
[היגיון קליני לפי המקרה הספציפי]
• [תרופה/משפחה] ⚠️לאימות — [מנגנון, יעילות, שיקולי בטיחות, ניטור]
PRN: [אם רלוונטי]

🤝 ציר סוציאלי
[הערכת המצב הסוציאלי]
• ביטוח לאומי / זכויות: [ספציפי]
• סל שיקום: [אפשרויות — דיור, תעסוקה, לימודים, מועדון]
• מעורבות משפחתית: [כיצד]
• המשך טיפול: [מרפאה, מסגרת, עמותות]

💬 ציר שיחתי/פסיכותרפויטי
• גישה מומלצת: [CBT/DBT/פסיכודינמי/EMDR/Schema/IPT/MBCT] — [למה מתאים כאן]
• פוקוס: [מה לעבד]
• תדירות ומשך: [מסגרת ריאלית]
• שיקולים: [אליאנס, טראומה, מוטיבציה]

🌱 רעיון יצירתי
[גישה לא שגרתית אבל מבוססת ראיות]

📌 לבירור לפני סופיות התוכנית:`;

const PRIVACY_PATTERNS = [
{ pattern: /\b\d{9}\b/g, replacement: ‘[ת.ז.]’ },
{ pattern: /\b0\d{1,2}-?\d{7}\b/g, replacement: ‘[טלפון]’ },
{ pattern: /+972-?\d{1,2}-?\d{7}\b/g, replacement: ‘[טלפון]’ },
{ pattern: /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/g, replacement: ‘[תאריך]’ },
];

function deidentify(text) {
let out = text;
PRIVACY_PATTERNS.forEach(({ pattern, replacement }) => { out = out.replace(pattern, replacement); });
return out;
}

async function callClaude(system, user, maxTokens = 2500) {
const res = await fetch(’/api/claude’, {
method: ‘POST’,
headers: { ‘Content-Type’: ‘application/json’ },
body: JSON.stringify({
model: ‘claude-opus-4-6’,
max_tokens: maxTokens,
system,
messages: [{ role: ‘user’, content: user }]
})
});
if (!res.ok) throw new Error(‘API ’ + res.status);
const data = await res.json();
if (data.error) throw new Error(data.error.message);
return data.content.filter(b => b.type === ‘text’).map(b => b.text).join(’\n’);
}

const TABS = {
intake:    { label: ‘קבלת מיון’, icon: ‘📋’ },
monologue: { label: ‘הצגה לבכיר’, icon: ‘🎤’ },
treatment: { label: ‘תוכנית טיפול’, icon: ‘🌿’ },
};

export default function App() {
const [stage, setStage] = useState(‘input’);
const [input, setInput] = useState(’’);
const [interim, setInterim] = useState(’’);
const [isRec, setIsRec] = useState(false);
const [micPerm, setMicPerm] = useState(‘unknown’);

const [questions, setQuestions] = useState([]);
const [answers, setAnswers] = useState({});

const [results, setResults] = useState({ intake: ‘’, monologue: ‘’, treatment: ‘’ });
const [loading, setLoading] = useState({ intake: false, monologue: false, treatment: false });
const [done, setDone] = useState({ intake: false, monologue: false, treatment: false });
const [activeTab, setActiveTab] = useState(‘intake’);
const [copied, setCopied] = useState(’’);
const [error, setError] = useState(null);

const recRef = useRef(null);
const keepRec = useRef(false);
const topRef = useRef(null);

useEffect(() => {
navigator.permissions?.query({ name: ‘microphone’ })
.then(r => { setMicPerm(r.state); r.onchange = () => setMicPerm(r.state); })
.catch(() => {});
}, []);

const startRec = () => {
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SR) { setError(‘השתמש ב-🎤 במקלדת iOS’); return; }
try {
const r = new SR();
r.lang = ‘he-IL’; r.continuous = true; r.interimResults = true;
r.onstart = () => { setIsRec(true); setError(null); };
r.onresult = e => {
let fin = ‘’, tmp = ‘’;
for (let i = e.resultIndex; i < e.results.length; i++) {
const t = e.results[i][0].transcript;
if (e.results[i].isFinal) fin += t + ’ ‘; else tmp += t;
}
setInterim(tmp);
if (fin) setInput(p => p + (p && !p.endsWith(’ ‘) ? ’ ’ : ‘’) + fin);
};
r.onerror = e => {
if (e.error === ‘no-speech’ || e.error === ‘aborted’) return;
if (e.error === ‘not-allowed’) { setMicPerm(‘denied’); keepRec.current = false; setIsRec(false); }
};
r.onend = () => {
if (keepRec.current) { try { r.start(); } catch { setIsRec(false); } }
else { setIsRec(false); setInterim(’’); }
};
recRef.current = r; keepRec.current = true; setIsRec(true); r.start();
} catch { setError(‘לא הצליח להתחיל הקלטה.’); setIsRec(false); }
};

const stopRec = () => {
keepRec.current = false;
try { recRef.current?.stop(); } catch {}
setIsRec(false); setInterim(’’);
};

const toggleRec = async () => {
if (isRec) { stopRec(); return; }
if (micPerm === ‘granted’) { startRec(); return; }
try {
const s = await navigator.mediaDevices.getUserMedia({ audio: true });
s.getTracks().forEach(t => t.stop());
setMicPerm(‘granted’); startRec();
} catch { setMicPerm(‘denied’); setError(‘אשר גישה למיקרופון בהגדרות → Claude → מיקרופון’); }
};

const handleGetQuestions = async () => {
if (!input.trim()) return;
if (isRec) stopRec();
setError(null); setStage(‘clarifying’);
try {
const raw = await callClaude(CLARIFYING_QUESTIONS_PROMPT, `תיאור המקרה:\n${deidentify(input.trim())}`, 1500);
const m = raw.match(/{[\s\S]*}/);
if (!m) throw new Error(‘bad JSON’);
const parsed = JSON.parse(m[0]);
const qs = parsed.questions || [];
setQuestions(qs);
const init = {};
qs.forEach(q => { init[q.id] = ‘’; });
setAnswers(init);
setStage(‘answering’);
} catch {
setError(‘שגיאה ביצירת שאלות. נסה שוב.’);
setStage(‘input’);
}
};

const handleGenerate = async () => {
setStage(‘generating’);
setResults({ intake: ‘’, monologue: ‘’, treatment: ‘’ });
setDone({ intake: false, monologue: false, treatment: false });
setLoading({ intake: true, monologue: true, treatment: true });
setActiveTab(‘intake’);

```
const cleaned = deidentify(input.trim());
const qaText = questions.filter(q => answers[q.id]?.trim())
  .map(q => `שאלה: ${q.text}\nתשובה: ${answers[q.id]}`).join('\n\n');
const full = cleaned + (qaText ? `\n\n--- פרטים נוספים ---\n${qaText}` : '');

const run = async (key, prompt, max) => {
  try {
    const text = await callClaude(prompt, full, max);
    setResults(p => ({ ...p, [key]: text }));
  } catch (e) {
    setResults(p => ({ ...p, [key]: `שגיאה: ${e.message}` }));
  } finally {
    setDone(p => ({ ...p, [key]: true }));
    setLoading(p => ({ ...p, [key]: false }));
  }
};

Promise.all([
  run('intake', INTAKE_PROMPT, 2500),
  run('monologue', MONOLOGUE_PROMPT, 800),
  run('treatment', TREATMENT_PROMPT, 3000),
]).then(() => setStage('done'));
```

};

const handleCopy = async key => {
try { await navigator.clipboard.writeText(results[key]); setCopied(key); setTimeout(() => setCopied(’’), 2500); }
catch { setError(‘לא הצליח להעתיק’); }
};

const reset = () => {
setStage(‘input’); setInput(’’); setInterim(’’);
setQuestions([]); setAnswers({});
setResults({ intake: ‘’, monologue: ‘’, treatment: ‘’ });
setDone({ intake: false, monologue: false, treatment: false });
setError(null);
topRef.current?.scrollIntoView({ behavior: ‘smooth’ });
};

const allDone = done.intake && done.monologue && done.treatment;

return (
<div dir=“rtl” style={{ fontFamily: “‘Heebo’, system-ui, sans-serif”, minHeight: ‘100vh’, background: ‘#F7F6F3’ }}>
<style>{`@import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;700;900&family=Heebo:wght@300;400;500;600;700&display=swap'); *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}body{margin:0} .out{white-space:pre-wrap;line-height:1.9;font-size:15px;color:#2C2C2C} .spin{animation:spin 1s linear infinite;display:inline-block} @keyframes spin{to{transform:rotate(360deg)}} .fade{animation:fu .4s ease} @keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}} .dot{animation:dot 1.8s ease-in-out infinite} @keyframes dot{0%,100%{opacity:.3;transform:scale(.85)}50%{opacity:1;transform:scale(1.05)}} .recpulse{animation:rp 1.6s ease-in-out infinite} @keyframes rp{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.5)}50%{box-shadow:0 0 0 14px rgba(220,38,38,0)}} textarea:focus,button:focus{outline:none}button{cursor:pointer}`}</style>

```
  <div ref={topRef} style={{ background: '#1C2B22', color: 'white', padding: '20px 20px 16px' }}>
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <h1 style={{ margin: 0, fontSize: 28, fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 900, letterSpacing: '-0.5px' }}>עוזר תורן</h1>
      <p style={{ margin: '4px 0 0', opacity: .6, fontSize: 13 }}>תאר מקרה ← שאלות הבהרה ← קבלה + הצגה + תוכנית</p>
    </div>
  </div>

  <div style={{ background: '#FEF3C7', borderBottom: '1px solid #FDE68A', padding: '8px 20px' }}>
    <div style={{ maxWidth: 680, margin: '0 auto', fontSize: 12, color: '#92400E' }}>
      ⚠️ <strong>אין להזין שמות, ת.ז., תאריכי לידה או כתובות.</strong>
    </div>
  </div>

  <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 60px' }}>

    {/* INPUT */}
    {stage === 'input' && (
      <div className="fade">
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E2DB', overflow: 'hidden', marginBottom: 10 }}>
          <textarea
            value={input + (interim ? ' ' + interim : '')}
            onChange={e => { if (!isRec) setInput(e.target.value); }}
            placeholder="תאר את המקרה — מי הגיע, למה, מה קרה, מצבו, תרופות, רקע. ככל שיותר מידע — הפלט יהיה טוב יותר."
            disabled={isRec}
            rows={9}
            style={{ width: '100%', padding: 16, fontSize: 16, border: 'none', resize: 'none', background: 'transparent', color: '#1C1C1C', lineHeight: 1.7 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderTop: '1px solid #F0EDE8', background: '#FAFAF8' }}>
            <span style={{ fontSize: 12, color: '#AAA' }}>{input.length} תווים</span>
            {input && <button onClick={() => setInput('')} style={{ fontSize: 12, color: '#999', border: 'none', background: 'none', padding: '4px 8px' }}>ניקוי</button>}
          </div>
        </div>

        <button onClick={toggleRec} className={isRec ? 'recpulse' : ''}
          style={{ width: '100%', padding: 16, borderRadius: 16, border: isRec ? 'none' : '2px solid #D4CFC8', background: isRec ? '#DC2626' : 'white', color: isRec ? 'white' : '#1C1C1C', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 20 }}>{isRec ? '⏹' : '🎙️'}</span>
          {isRec ? 'עצור הקלטה' : 'הקלט הסבר על המקרה'}
        </button>

        <div style={{ background: '#EFF6FF', borderRadius: 14, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 18 }}>⌨️</span>
          <span style={{ fontSize: 13, color: '#1E40AF', lineHeight: 1.5 }}><strong>iPhone:</strong> לחץ על תיבת הטקסט ← לחץ 🎤 ליד מקש הרווח ← דבר.</span>
        </div>

        {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#B91C1C', marginBottom: 12 }}>{error}</div>}

        <button onClick={handleGetQuestions} disabled={!input.trim() || isRec}
          style={{ width: '100%', padding: 18, borderRadius: 18, border: 'none', background: !input.trim() || isRec ? '#C4C0BB' : 'linear-gradient(135deg,#2D5645,#1A3828)', color: 'white', fontSize: 17, fontWeight: 700 }}>
          המשך לשאלות הבהרה ←
        </button>
      </div>
    )}

    {/* CLARIFYING LOADING */}
    {stage === 'clarifying' && (
      <div className="fade" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
          {[0,1,2].map(i => <div key={i} className="dot" style={{ width: 10, height: 10, borderRadius: '50%', background: '#2D5645', animationDelay: `${i*0.2}s` }} />)}
        </div>
        <p style={{ color: '#555', fontSize: 16 }}>מנתח את המקרה ומכין שאלות...</p>
      </div>
    )}

    {/* ANSWERING */}
    {stage === 'answering' && (
      <div className="fade">
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E2DB', padding: 20, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 22 }}>💭</span>
            <h2 style={{ margin: 0, fontSize: 20, fontFamily: "'Frank Ruhl Libre',serif", fontWeight: 700 }}>שאלות הבהרה</h2>
          </div>
          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#888' }}>ענה על מה שאפשר — ניתן לדלג.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {questions.map((q, idx) => (
              <div key={q.id} style={{ borderBottom: idx < questions.length - 1 ? '1px solid #F0EDE8' : 'none', paddingBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: '#1C2B22', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{idx + 1}</span>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, lineHeight: 1.5 }}>{q.text}</p>
                </div>

                <div style={{ paddingRight: 34 }}>
                  {q.type === 'mcq' && q.options && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                      {q.options.map((opt, oi) => {
                        const sel = answers[q.id] === opt;
                        return (
                          <button key={oi} onClick={() => setAnswers(p => ({ ...p, [q.id]: sel ? '' : opt }))}
                            style={{ padding: '10px 14px', borderRadius: 12, textAlign: 'right', fontSize: 14, border: sel ? '2px solid #2D5645' : '1px solid #E5E2DB', background: sel ? '#EDF7F1' : 'white', color: sel ? '#1C3D2B' : '#444', fontWeight: sel ? 600 : 400 }}>
                            {sel ? '✓ ' : ''}{opt}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <textarea
                    value={q.type === 'open' ? (answers[q.id] || '') : (q.options?.includes(answers[q.id]) ? '' : (answers[q.id] || ''))}
                    onChange={e => setAnswers(p => ({ ...p, [q.id]: q.type === 'mcq' && p[q.id] && q.options?.includes(p[q.id]) ? (e.target.value || p[q.id]) : e.target.value }))}
                    placeholder={q.type === 'mcq' ? 'הערה נוספת (אופציונלי)...' : 'תשובה חופשית...'}
                    rows={q.type === 'open' ? 2 : 1}
                    style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #E5E2DB', fontSize: 13, color: '#555', resize: 'none', width: '100%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={handleGenerate}
          style={{ width: '100%', padding: 18, borderRadius: 18, border: 'none', background: 'linear-gradient(135deg,#2D5645,#1A3828)', color: 'white', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
          צור קבלה + הצגה + תוכנית ←
        </button>
        <button onClick={handleGenerate}
          style={{ width: '100%', padding: 12, borderRadius: 14, border: '1px solid #D4CFC8', background: 'white', color: '#666', fontSize: 14, marginBottom: 6 }}>
          דלג על השאלות וצור ישירות
        </button>
        <button onClick={() => setStage('input')}
          style={{ width: '100%', padding: 10, border: 'none', background: 'none', color: '#999', fontSize: 13 }}>
          ↺ חזור לעריכת הקלט
        </button>
      </div>
    )}

    {/* GENERATING / DONE */}
    {(stage === 'generating' || stage === 'done') && (
      <div className="fade">
        {!allDone && (
          <div style={{ background: '#1C2B22', borderRadius: 16, padding: '14px 18px', marginBottom: 14, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            {Object.entries(TABS).map(([key, { label }]) => (
              <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, color: done[key] ? '#6EE7A0' : '#94A3B8', fontSize: 13 }}>
                {loading[key] ? <span className="spin">⟳</span> : done[key] ? '✓' : '○'}
                {label}
              </span>
            ))}
            <span style={{ fontSize: 12, color: '#6B7280', marginRight: 'auto' }}>עובד ברקע...</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 2 }}>
          {Object.entries(TABS).map(([key, { label, icon }]) => (
            <button key={key} onClick={() => setActiveTab(key)}
              style={{ flexShrink: 0, padding: '10px 16px', borderRadius: 30, fontSize: 14, fontWeight: 500, border: activeTab === key ? 'none' : '1px solid #E5E2DB', background: activeTab === key ? '#1C2B22' : 'white', color: activeTab === key ? 'white' : '#555' }}>
              {icon} {label} {loading[key] && <span className="spin" style={{ marginRight: 4 }}>⟳</span>}
            </button>
          ))}
        </div>

        {Object.entries(TABS).map(([key, { label }]) => (
          <div key={key} style={{ display: activeTab === key ? 'block' : 'none' }}>
            {!done[key] ? (
              <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E2DB', padding: 40, textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                  {[0,1,2].map(i => <div key={i} className="dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#2D5645', animationDelay: `${i*0.2}s` }} />)}
                </div>
                <p style={{ color: '#888', fontSize: 15 }}>מייצר {label}...</p>
              </div>
            ) : (
              <div className="fade">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '0 4px' }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontFamily: "'Frank Ruhl Libre',serif" }}>{label}</h3>
                  <button onClick={() => handleCopy(key)}
                    style={{ padding: '8px 16px', borderRadius: 30, fontSize: 13, fontWeight: 500, border: 'none', background: copied === key ? '#D1FAE5' : '#1C2B22', color: copied === key ? '#065F46' : 'white' }}>
                    {copied === key ? '✓ הועתק' : '📋 העתק'}
                  </button>
                </div>
                <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E2DB', padding: '20px 22px', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
                  <p className="out">{results[key]}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 11, color: '#AAA', lineHeight: 1.6, margin: '0 0 12px' }}>
            ⚠️ פלט AI — דורש קריאה ואימות לפני שימוש קליני. כל מינון/תרופה — לאמת מול מקור מוסמך.
          </p>
          {allDone && (
            <button onClick={reset}
              style={{ width: '100%', padding: 14, borderRadius: 16, border: '1px solid #D4CFC8', background: 'white', color: '#555', fontSize: 15, fontWeight: 500 }}>
              ↺ מקרה חדש
            </button>
          )}
        </div>
      </div>
    )}
  </div>
</div>
```

);
}
