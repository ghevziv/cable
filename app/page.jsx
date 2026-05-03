'use client'

import { useState, useRef, useEffect } from 'react';

const CLARIFYING_QUESTIONS_PROMPT = `אתה פסיכיאטר בכיר מנחה. קיבלת תיאור גולמי של מקרה פסיכיאטרי ממיון. צור 6-10 שאלות הבהרה קריטיות.

חלקן שאלות רב-ברירה (mcq) וחלקן פתוחות (open).
שאל רק על מידע שלא ברור מהקלט. התמקד בדגלים אדומים, אבחנה, סיכון, וטיפול.

החזר JSON בדיוק בפורמט הזה, ללא טקסט נוסף:
{
  "questions": [
    {"id":"q1","text":"שאלה?","type":"mcq","options":["אפשרות א","אפשרות ב","אפשרות ג"]},
    {"id":"q2","text":"שאלה פתוחה?","type":"open"}
  ]
}`;

const INTAKE_PROMPT = `אתה עוזר קליני לפסיכיאטר מתמחה בתורנות מיון בישראל. כתוב קבלת מיון פסיכיאטרית בעברית רפואית תקנית.

חוקים מחייבים:
- טקסט רץ בלבד. אסור: כוכביות, סולמיות, מקפים, טבלאות, בולד, כותרות, bullet points.
- פסקאות בלבד, כמו קבלה רפואית אמיתית.
- פרטיות: אין שמות, ת.ז., תאריכי לידה, כתובות. השתמש ב"המטופל", "בן זוגו", "האב" וכו.
- תרופות: אסור להמציא מינונים. סיים כל תרופה ב"(לאימות)".
- מידע חסר: "לבירור".

פורמט מחייב - פסקאות רצופות:

התקבל במסגרת תורנות מיון. [הגיע עם הפנייה מ___ / ללא הפנייה.] [מוכר / לא מוכר למוסדנו.] הגיע [בליווי ___ / בגפו].

[פסקה: רקע דמוגרפי - גיל, מצב משפחתי, ילדים, מגורים, תעסוקה, מצב כלכלי, ביטוח לאומי, סל שיקום.]

[פסקה: היסטוריה פסיכיאטרית - אבחנות, אשפוזים, טיפול תרופתי נוכחי עם מינונים (לאימות).]

ברקע - גופני: [מחלות, טיפולים]. פסיכופתולוגיה משפחתית: [אם יש]. שימוש בחומרים: [עבר והווה].

מחלה נוכחית - [פסקה מפורטת: התפתחות, ציטוטים בגרשיים, תשאול ייעודי לפי הסינדרום.] שולל [תסמינים]. אובדנות - [בעבר ובהווה, תכנית, אמצעי, ניסיונות].

תולדות המחלה - [פסקה כרונולוגית.]

תולדות עבר - [פסקה: ילדות, השכלה, צבא, עבודה, זוגיות.]

בדיקת מצב נפשי - הופעה והתנהגות: []. דיבור: []. מצב רוח: []. אפקט: []. חשיבה - תהליך: [], תוכן: []. תפיסה: []. קוגניציה: []. תובנה ושיפוט: [].

לסיכום, [פסקה: רושם קליני, אבחנה מבדלת, רמת סיכון.]

בייעוץ עם כונן ד"ר ___ - א. ב. ג.

חוסרים לבירור:`;

const MONOLOGUE_PROMPT = `אתה עוזר לפסיכיאטר מתמחה בישראל. כתוב הצגה קצרה וחכמה לבכיר - 4-6 משפטים בלבד. פסקה אחת, ישירה, ללא כותרות.

מבנה מחייב: משפט 1 - מי המטופל ורקע תמציתי רלוונטי. משפט 2 - למה הגיע ומה קרה. משפט 3 - מה מתרשם קלינית היום (MSE קצר + סיכון). משפט 4-5 - מה מתוכנן ומה ההתלבטות הקלינית.

פרטיות: אין פרטים מזהים. טון: דבור, פורמלי, כאילו עומד מול בכיר.
התחל ב"הגיע מטופל..." וסיים ב"...ורציתי להתייעץ לגבי [ההתלבטות]."`;

const TREATMENT_PROMPT = `אתה פסיכיאטר בכיר מנוסה. כתוב תוכנית טיפול קצרה, קולעת וממוקדת בשלושה צירים. פרוזה בלבד - אין טבלאות, אין bullet points, אין כוכביות, אין סולמיות. כתוב בגוף שלישי כאילו מייעץ לעמית.

פרטיות: אין פרטים מזהים. תרופות: סיים כל המלצה ב"(לאימות)".

כתוב בדיוק בפורמט הזה, פסקה לכל ציר:

תרופתי - [פסקה קצרה וקולעת. דוגמה: לשקול מיצוי הטיפול הנוכחי ל___ (לאימות), או אוגמנטציה עם ___ שיסייע גם ב___. אם אין תגובה, לשקול מעבר ל___. לנטר ___.] 

סוציאלי - [פסקה: זכויות ביטוח לאומי רלוונטיות, סל שיקום, מסגרת המשך טיפול, מעורבות משפחתית, עמותות.]

שיחתי - [פסקה: גישה מומלצת ולמה מתאימה, פוקוס הטיפול, תדירות ומשך, שיקולים מיוחדים.]

לבירור - [משפט אחד עם מה שחסר לפני קבלת ההחלטות.]`;

const REVISE_INTAKE_PROMPT = `אתה עוזר קליני לפסיכיאטר. קיבלת קבלת מיון קיימת והערות תיקון מהמתמחה. כתוב מחדש את הקבלה תוך שילוב התיקונים, תוך שמירה מלאה על הפורמט המקורי - טקסט רץ בלבד, ללא כוכביות/סולמיות/בולטים/טבלאות. שמור על אותו מבנה פסקאות.`;
const PRIVACY_PATTERNS = [
  { pattern: /\b\d{9}\b/g, replacement: '[ת.ז.]' },
  { pattern: /\b0\d{1,2}-?\d{7}\b/g, replacement: '[טלפון]' },
  { pattern: /\+972-?\d{1,2}-?\d{7}\b/g, replacement: '[טלפון]' },
  { pattern: /\b\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\b/g, replacement: '[תאריך]' },
];

function deidentify(text) {
  let out = text;
  PRIVACY_PATTERNS.forEach(({ pattern, replacement }) => { out = out.replace(pattern, replacement); });
  return out;
}

async function callClaude(system, user, maxTokens = 2500) {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }]
    })
  });
  if (!res.ok) throw new Error('API ' + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
}

const TABS = {
  intake:    { label: 'קבלת מיון', icon: '📋' },
  monologue: { label: 'הצגה לבכיר', icon: '🎤' },
  treatment: { label: 'תוכנית טיפול', icon: '🌿' },
};

const COLORS = {
  primary: '#9D174D',
  primaryDark: '#7A0F3D',
  accent: '#EC4899',
  bgSoft: '#FDF2F8',
  bgWarn: '#FEF3C7',
  bgWarnBorder: '#FDE68A',
  textWarn: '#92400E',
  bgInfo: '#FCE7F3',
  textInfo: '#9D174D',
  border: '#F9A8D4',
  borderSoft: '#FBCFE8',
  textMain: '#1F1F1F',
  textMute: '#6B7280',
  textPlaceholder: '#9CA3AF',
  success: '#10B981',
  successBg: '#D1FAE5',
  successText: '#065F46',
  danger: '#DC2626',
};

export default function App() {
  const [stage, setStage] = useState('input');
  const [input, setInput] = useState('');
  const [interim, setInterim] = useState('');
  const [isRec, setIsRec] = useState(false);
  const [micPerm, setMicPerm] = useState('unknown');

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  const [results, setResults] = useState({ intake: '', monologue: '', treatment: '' });
  const [loading, setLoading] = useState({ intake: false, monologue: false, treatment: false });
  const [done, setDone] = useState({ intake: false, monologue: false, treatment: false });
  const [activeTab, setActiveTab] = useState('intake');
  const [copied, setCopied] = useState('');
  const [error, setError] = useState(null);

  const [reviseNote, setReviseNote] = useState('');
  const [revising, setRevising] = useState(false);

  const [emailMode, setEmailMode] = useState(false);
  const [emailAddr, setEmailAddr] = useState('');

  const [confirmReset, setConfirmReset] = useState(false);

  const recRef = useRef(null);
  const keepRec = useRef(false);
  const topRef = useRef(null);

  useEffect(() => {
    navigator.permissions?.query({ name: 'microphone' })
      .then(r => { setMicPerm(r.state); r.onchange = () => setMicPerm(r.state); })
      .catch(() => {});
  }, []);

  const startRec = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError('השתמש במיקרופון של מקלדת iOS'); return; }
    try {
      const r = new SR();
      r.lang = 'he-IL'; r.continuous = true; r.interimResults = true;
      r.onstart = () => { setIsRec(true); setError(null); };
      r.onresult = e => {
        let fin = '', tmp = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) fin += t + ' '; else tmp += t;
        }
        setInterim(tmp);
        if (fin) setInput(p => p + (p && !p.endsWith(' ') ? ' ' : '') + fin);
      };
      r.onerror = e => {
        if (e.error === 'no-speech' || e.error === 'aborted') return;
        if (e.error === 'not-allowed') { setMicPerm('denied'); keepRec.current = false; setIsRec(false); }
      };
      r.onend = () => {
        if (keepRec.current) { try { r.start(); } catch { setIsRec(false); } }
        else { setIsRec(false); setInterim(''); }
      };
      recRef.current = r; keepRec.current = true; setIsRec(true); r.start();
    } catch { setError('לא הצליח להתחיל הקלטה.'); setIsRec(false); }
  };

  const stopRec = () => {
    keepRec.current = false;
    try { recRef.current?.stop(); } catch {}
    setIsRec(false); setInterim('');
  };

  const toggleRec = async () => {
    if (isRec) { stopRec(); return; }
    if (micPerm === 'granted') { startRec(); return; }
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      s.getTracks().forEach(t => t.stop());
      setMicPerm('granted'); startRec();
    } catch { setMicPerm('denied'); setError('אשר גישה למיקרופון בהגדרות'); }
  };

  const handleGetQuestions = async () => {
    if (!input.trim()) return;
    if (isRec) stopRec();
    setError(null); setStage('clarifying');
    try {
      const raw = await callClaude(CLARIFYING_QUESTIONS_PROMPT, 'תיאור המקרה:\n' + deidentify(input.trim()), 1500);
      const m = raw.match(/\{[\s\S]*\}/);
      if (!m) throw new Error('bad JSON');
      const parsed = JSON.parse(m[0]);
      const qs = parsed.questions || [];
      setQuestions(qs);
      const init = {};
      qs.forEach(q => { init[q.id] = ''; });
      setAnswers(init);
      setStage('answering');
    } catch {
      setError('שגיאה ביצירת שאלות. נסה שוב.');
      setStage('input');
    }
  };

  const handleGenerate = async () => {
    setStage('generating');
    setResults({ intake: '', monologue: '', treatment: '' });
    setDone({ intake: false, monologue: false, treatment: false });
    setLoading({ intake: true, monologue: true, treatment: true });
    setActiveTab('intake');

    const cleaned = deidentify(input.trim());
    const qaText = questions.filter(q => answers[q.id]?.trim())
      .map(q => 'שאלה: ' + q.text + '\nתשובה: ' + answers[q.id]).join('\n\n');
    const full = cleaned + (qaText ? '\n\nפרטים נוספים:\n' + qaText : '');

    const run = async (key, prompt, max) => {
      try {
        const text = await callClaude(prompt, full, max);
        setResults(p => ({ ...p, [key]: text }));
      } catch (e) {
        setResults(p => ({ ...p, [key]: 'שגיאה: ' + e.message }));
      } finally {
        setDone(p => ({ ...p, [key]: true }));
        setLoading(p => ({ ...p, [key]: false }));
      }
    };

    Promise.all([
      run('intake', INTAKE_PROMPT, 3000),
      run('monologue', MONOLOGUE_PROMPT, 800),
      run('treatment', TREATMENT_PROMPT, 4000),
    ]).then(() => setStage('done'));
  };

  const handleRevise = async () => {
    if (!reviseNote.trim()) return;
    setRevising(true);
    try {
      const userMsg = 'הקבלה הנוכחית:\n\n' + results.intake + '\n\nהערות לתיקון:\n' + reviseNote.trim();
      const text = await callClaude(REVISE_INTAKE_PROMPT, userMsg, 3000);
      setResults(p => ({ ...p, intake: text }));
      setReviseNote('');
    } catch (e) {
      setError('שגיאה בתיקון: ' + e.message);
    } finally {
      setRevising(false);
    }
  };

  const handleCopy = async key => {
    try { await navigator.clipboard.writeText(results[key]); setCopied(key); setTimeout(() => setCopied(''), 2500); }
    catch { setError('לא הצליח להעתיק'); }
  };

  const handleSendEmail = () => {
    if (!emailAddr.trim()) return;
    const subject = encodeURIComponent('קבלת מיון פסיכיאטרית - ' + new Date().toLocaleDateString('he-IL'));
    const body = encodeURIComponent(results.intake + '\n\n---\n\nהצגה לבכיר:\n' + results.monologue + '\n\n---\n\nתוכנית טיפול:\n' + results.treatment);
    window.location.href = `mailto:${emailAddr.trim()}?subject=${subject}&body=${body}`;
    setEmailMode(false);
  };

  const reset = () => {
    setStage('input'); setInput(''); setInterim('');
    setQuestions([]); setAnswers({});
    setResults({ intake: '', monologue: '', treatment: '' });
    setDone({ intake: false, monologue: false, treatment: false });
    setReviseNote(''); setEmailMode(false); setEmailAddr('');
    setError(null); setConfirmReset(false);
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const allDone = done.intake && done.monologue && done.treatment;
  return (
    <div dir="rtl" style={{ fontFamily: "Heebo, system-ui, sans-serif", minHeight: '100vh', background: COLORS.bgSoft }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;700;900&family=Heebo:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}body{margin:0}
        .out{white-space:pre-wrap;line-height:1.9;font-size:15px;color:#1F1F1F}
        .spin{animation:spin 1s linear infinite;display:inline-block}
        @keyframes spin{to{transform:rotate(360deg)}}
        .fade{animation:fu .4s ease}
        @keyframes fu{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .dot{animation:dot 1.8s ease-in-out infinite}
        @keyframes dot{0%,100%{opacity:.3;transform:scale(.85)}50%{opacity:1;transform:scale(1.05)}}
        .recpulse{animation:rp 1.6s ease-in-out infinite}
        @keyframes rp{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.5)}50%{box-shadow:0 0 0 14px rgba(220,38,38,0)}}
        textarea:focus,button:focus,input:focus{outline:none}button{cursor:pointer}
      `}</style>

      <div ref={topRef} style={{ background: 'linear-gradient(135deg, ' + COLORS.primaryDark + ', ' + COLORS.primary + ')', color: 'white', padding: '24px 20px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: 32, fontFamily: "Frank Ruhl Libre, serif", fontWeight: 900, letterSpacing: '-0.5px' }}>הטווס האבוד</h1>
          <p style={{ margin: '6px 0 0', opacity: .85, fontSize: 13 }}>תאר מקרה ← שאלות הבהרה ← קבלה + הצגה + תוכנית</p>
        </div>
      </div>

      <div style={{ background: COLORS.bgWarn, borderBottom: '1px solid ' + COLORS.bgWarnBorder, padding: '8px 20px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', fontSize: 12, color: COLORS.textWarn, textAlign: 'center' }}>
          אין להזין שמות, ת.ז., תאריכי לידה או כתובות.
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 60px' }}>

        {stage === 'input' && (
          <div className="fade">
            <div style={{ background: 'white', borderRadius: 20, border: '1px solid ' + COLORS.borderSoft, overflow: 'hidden', marginBottom: 10 }}>
              <textarea
                value={input + (interim ? ' ' + interim : '')}
                onChange={e => { if (!isRec) setInput(e.target.value); }}
                placeholder="תאר את המקרה - מי הגיע, למה, מה קרה, מצבו, תרופות, רקע."
                disabled={isRec}
                rows={9}
                style={{ width: '100%', padding: 16, fontSize: 16, border: 'none', resize: 'none', background: 'transparent', color: COLORS.textMain, lineHeight: 1.7 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderTop: '1px solid ' + COLORS.borderSoft, background: COLORS.bgInfo }}>
                <span style={{ fontSize: 12, color: COLORS.textMute }}>{input.length} תווים</span>
                {input && <button onClick={() => setInput('')} style={{ fontSize: 12, color: COLORS.primary, border: 'none', background: 'none', padding: '4px 8px', fontWeight: 500 }}>ניקוי</button>}
              </div>
            </div>

            <button onClick={toggleRec} className={isRec ? 'recpulse' : ''}
              style={{ width: '100%', padding: 16, borderRadius: 16, border: isRec ? 'none' : '2px solid ' + COLORS.border, background: isRec ? COLORS.danger : 'white', color: isRec ? 'white' : COLORS.textMain, fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>{isRec ? '⏹' : '🎙️'}</span>
              {isRec ? 'עצור הקלטה' : 'הקלט הסבר על המקרה'}
            </button>

            <div style={{ background: COLORS.bgInfo, borderRadius: 14, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 18 }}>⌨️</span>
              <span style={{ fontSize: 13, color: COLORS.textInfo, lineHeight: 1.5 }}>iPhone: לחץ על תיבת הטקסט, לחץ על המיקרופון ליד מקש הרווח, ודבר.</span>
            </div>

            {error && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '12px 16px', fontSize: 14, color: '#B91C1C', marginBottom: 12 }}>{error}</div>}

            <button onClick={handleGetQuestions} disabled={!input.trim() || isRec}
              style={{ width: '100%', padding: 18, borderRadius: 18, border: 'none', background: !input.trim() || isRec ? '#E5E2DB' : 'linear-gradient(135deg,' + COLORS.primary + ',' + COLORS.primaryDark + ')', color: 'white', fontSize: 17, fontWeight: 700 }}>
              המשך לשאלות הבהרה
            </button>
          </div>
        )}

        {stage === 'clarifying' && (
          <div className="fade" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
              {[0,1,2].map(i => <div key={i} className="dot" style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS.primary, animationDelay: i*0.2 + 's' }} />)}
            </div>
            <p style={{ color: COLORS.textMute, fontSize: 16 }}>מנתח את המקרה ומכין שאלות...</p>
          </div>
        )}

        {stage === 'answering' && (
          <div className="fade">
            <div style={{ background: 'white', borderRadius: 20, border: '1px solid ' + COLORS.borderSoft, padding: 20, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, justifyContent: 'center' }}>
                <span style={{ fontSize: 22 }}>💭</span>
                <h2 style={{ margin: 0, fontSize: 20, fontFamily: "Frank Ruhl Libre, serif", fontWeight: 700 }}>שאלות הבהרה</h2>
              </div>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: COLORS.textMute, textAlign: 'center' }}>ענה על מה שאפשר. ניתן לדלג.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {questions.map((q, idx) => (
                  <div key={q.id} style={{ borderBottom: idx < questions.length - 1 ? '1px solid ' + COLORS.borderSoft : 'none', paddingBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: COLORS.primary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{idx + 1}</span>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, lineHeight: 1.5 }}>{q.text}</p>
                    </div>
                    <div style={{ paddingRight: 34 }}>
                      {q.type === 'mcq' && q.options && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                          {q.options.map((opt, oi) => {
                            const sel = answers[q.id] === opt;
                            return (
                              <button key={oi} onClick={() => setAnswers(p => ({ ...p, [q.id]: sel ? '' : opt }))}
                                style={{ padding: '10px 14px', borderRadius: 12, textAlign: 'right', fontSize: 14, border: sel ? '2px solid ' + COLORS.primary : '1px solid ' + COLORS.borderSoft, background: sel ? COLORS.bgInfo : 'white', color: sel ? COLORS.primaryDark : '#444', fontWeight: sel ? 600 : 400 }}>
                                {sel ? 'v ' : ''}{opt}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <textarea
                        value={q.type === 'open' ? (answers[q.id] || '') : ''}
                        onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
                        placeholder={q.type === 'mcq' ? 'הערה נוספת (אופציונלי)...' : 'תשובה חופשית...'}
                        rows={q.type === 'open' ? 2 : 1}
                        style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid ' + COLORS.borderSoft, fontSize: 13, color: '#555', resize: 'none', width: '100%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleGenerate}
              style={{ width: '100%', padding: 18, borderRadius: 18, border: 'none', background: 'linear-gradient(135deg,' + COLORS.primary + ',' + COLORS.primaryDark + ')', color: 'white', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
              צור קבלה + הצגה + תוכנית
            </button>
            <button onClick={handleGenerate}
              style={{ width: '100%', padding: 12, borderRadius: 14, border: '1px solid ' + COLORS.border, background: 'white', color: COLORS.textMute, fontSize: 14, marginBottom: 6 }}>
              דלג על השאלות וצור ישירות
            </button>
            <button onClick={() => setStage('input')}
              style={{ width: '100%', padding: 10, border: 'none', background: 'none', color: COLORS.textMute, fontSize: 13 }}>
              חזור לעריכת הקלט
            </button>
          </div>
        )}
        {(stage === 'generating' || stage === 'done') && (
          <div className="fade">
            {!allDone && (
              <div style={{ background: 'linear-gradient(135deg,' + COLORS.primaryDark + ',' + COLORS.primary + ')', borderRadius: 16, padding: '14px 18px', marginBottom: 14, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', color: 'white' }}>
                {Object.entries(TABS).map(([key, { label }]) => (
                  <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, color: done[key] ? '#FBCFE8' : 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                    {loading[key] ? <span className="spin">o</span> : done[key] ? 'v' : 'o'}
                    {label}
                  </span>
                ))}
                <span style={{ fontSize: 12, opacity: 0.7, marginRight: 'auto' }}>עובד ברקע...</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 2 }}>
              {Object.entries(TABS).map(([key, { label, icon }]) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  style={{ flexShrink: 0, padding: '10px 16px', borderRadius: 30, fontSize: 14, fontWeight: 500, border: activeTab === key ? 'none' : '1px solid ' + COLORS.borderSoft, background: activeTab === key ? COLORS.primary : 'white', color: activeTab === key ? 'white' : COLORS.textMute }}>
                  {icon} {label} {loading[key] && <span className="spin" style={{ marginRight: 4 }}>o</span>}
                </button>
              ))}
            </div>

            {Object.entries(TABS).map(([key, { label }]) => (
              <div key={key} style={{ display: activeTab === key ? 'block' : 'none' }}>
                {!done[key] ? (
                  <div style={{ background: 'white', borderRadius: 20, border: '1px solid ' + COLORS.borderSoft, padding: 40, textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                      {[0,1,2].map(i => <div key={i} className="dot" style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS.primary, animationDelay: i*0.2 + 's' }} />)}
                    </div>
                    <p style={{ color: COLORS.textMute, fontSize: 15 }}>מייצר {label}...</p>
                  </div>
                ) : (
                  <div className="fade">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '0 4px' }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontFamily: "Frank Ruhl Libre, serif" }}>{label}</h3>
                      <button onClick={() => handleCopy(key)}
                        style={{ padding: '8px 16px', borderRadius: 30, fontSize: 13, fontWeight: 500, border: 'none', background: copied === key ? COLORS.successBg : COLORS.primary, color: copied === key ? COLORS.successText : 'white' }}>
                        {copied === key ? 'הועתק' : 'העתק'}
                      </button>
                    </div>
                    <div style={{ background: 'white', borderRadius: 20, border: '1px solid ' + COLORS.borderSoft, padding: '20px 22px', boxShadow: '0 1px 3px rgba(157,23,77,.05)' }}>
                      <p className="out">{results[key]}</p>
                    </div>

                    {key === 'intake' && (
                      <div style={{ marginTop: 16, background: 'white', borderRadius: 20, border: '1px solid ' + COLORS.borderSoft, padding: 16 }}>
                        <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: COLORS.primaryDark }}>הערות ותיקונים לקבלה</p>
                        <textarea
                          value={reviseNote}
                          onChange={e => setReviseNote(e.target.value)}
                          placeholder="כתוב מה לתקן או להוסיף - למשל: להוסיף שיש רקע של PTSD, לתקן שהאחות שדיברה איתו היא מהקהילה, להוסיף ש..."
                          rows={3}
                          disabled={revising}
                          style={{ width: '100%', padding: 12, fontSize: 14, borderRadius: 12, border: '1px solid ' + COLORS.borderSoft, resize: 'none', color: COLORS.textMain, lineHeight: 1.6, background: revising ? '#F9FAFB' : 'white' }}
                        />
                        <button onClick={handleRevise} disabled={!reviseNote.trim() || revising}
                          style={{ width: '100%', marginTop: 10, padding: 12, borderRadius: 12, border: 'none', background: !reviseNote.trim() || revising ? '#E5E2DB' : 'linear-gradient(135deg,' + COLORS.primary + ',' + COLORS.primaryDark + ')', color: 'white', fontSize: 14, fontWeight: 600 }}>
                          {revising ? 'מייצר קבלה מתוקנת...' : 'תקן את הקבלה'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {allDone && (
              <div style={{ marginTop: 20 }}>
                {!emailMode ? (
                  <button onClick={() => setEmailMode(true)}
                    style={{ width: '100%', padding: 14, borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,' + COLORS.accent + ',' + COLORS.primary + ')', color: 'white', fontSize: 15, fontWeight: 600, marginBottom: 10 }}>
                    שלח למייל
                  </button>
                ) : (
                  <div style={{ background: 'white', borderRadius: 16, border: '1px solid ' + COLORS.borderSoft, padding: 14, marginBottom: 10 }}>
                    <p style={{ margin: '0 0 8px', fontSize: 13, color: COLORS.textMute }}>שלח את כל הפלטים למייל שלך:</p>
                    <input
                      type="email"
                      value={emailAddr}
                      onChange={e => setEmailAddr(e.target.value)}
                      placeholder="your@email.com"
                      style={{ width: '100%', padding: 10, fontSize: 14, borderRadius: 10, border: '1px solid ' + COLORS.borderSoft, marginBottom: 8, direction: 'ltr', textAlign: 'left' }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleSendEmail} disabled={!emailAddr.trim()}
                        style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: !emailAddr.trim() ? '#E5E2DB' : COLORS.primary, color: 'white', fontSize: 14, fontWeight: 600 }}>
                        שלח
                      </button>
                      <button onClick={() => { setEmailMode(false); setEmailAddr(''); }}
                        style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid ' + COLORS.borderSoft, background: 'white', color: COLORS.textMute, fontSize: 14 }}>
                        ביטול
                      </button>
                    </div>
                  </div>
                )}

                <p style={{ fontSize: 11, color: COLORS.textMute, lineHeight: 1.6, margin: '0 0 12px', textAlign: 'center' }}>
                  פלט AI - דורש קריאה ואימות לפני שימוש קליני. כל מינון או תרופה - לאמת מול מקור מוסמך.
                </p>

                {!confirmReset ? (
                  <button onClick={() => setConfirmReset(true)}
                    style={{ width: '100%', padding: 14, borderRadius: 16, border: '1px solid ' + COLORS.border, background: 'white', color: COLORS.textMute, fontSize: 15, fontWeight: 500 }}>
                    מקרה חדש
                  </button>
                ) : (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: 12 }}>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: '#B91C1C', textAlign: 'center' }}>הקבלה הנוכחית תאבד. להמשיך?</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={reset}
                        style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: COLORS.danger, color: 'white', fontSize: 14, fontWeight: 600 }}>
                        כן, מקרה חדש
                      </button>
                      <button onClick={() => setConfirmReset(false)}
                        style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid ' + COLORS.borderSoft, background: 'white', color: COLORS.textMute, fontSize: 14 }}>
                        ביטול
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
