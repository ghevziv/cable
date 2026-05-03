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

const INTAKE_PROMPT = `אתה עוזר קליני לפסיכיאטר מתמחה בתורנות מיון בישראל. כתוב קבלת מיון פסיכיאטרית בעברית רפואית תקנית, בסגנון של פסיכיאטר ישראלי מנוסה.

חוקים מחייבים - חובה לקיים את כולם:
- טקסט רץ בלבד. אסור לחלוטין: כוכביות, סולמיות, מקפים כרשימה, טבלאות, בולד, כותרות עם #, bullet points מכל סוג.
- פסקאות רצופות בלבד, בדיוק כמו קבלה רפואית אמיתית.
- פרטיות: אין שמות, ת.ז., תאריכי לידה מדויקים, כתובות. השתמש ב"המטופל", "בן זוגו", "אמו" וכו'.
- גיל: תמיד מדויק - "בן 41", לא "כבן 41".
- תרופות: שמות בעברית (לוסטרל, ציפרלקס, מירו, קלונקס וכו'). מינון + תדירות + משך. סיים ב"(לאימות)". לא להמציא מינונים.
- ציטוטים מהמטופל: בגרש בודד - 'ככה הוא אמר'.
- שלילות: "שולל אובדנות בעבר ובהווה" / "שולל וללא עדות לאפיזודה מאניפורמית".
- מידע חסר: "לבירור". לא לכתוב "לא נמסר".
- אין MSE בכלל.

פורמט מחייב - בדיוק בסדר הזה:

פסקה 1 - פתיח:
התקבל במסגרת תורנות מיון, הגיע [ללא הפנייה רשמית / עם הפנייה מ___], [בגפו / בליווי ___]. [מוכר / לא מוכר למוסדנו]. [אם מוכר: ידוע במעקב ד"ר ___ במרפאת ___ / מאושפז בעבר במחלקתנו].

פסקה 2 - דמוגרפיה:
[גיל מדויק, מצב משפחתי - "בן 41, גרוש מזה כחצי שנה ואב ל-3 ילדים" / "בת 28, רווקה ללא ילדים"]. [מגורים]. [תעסוקה]. [ביטוח לאומי - מוכר/לא מוכר, קצבה, אחוזי נכות, סל שיקום אם יש].

פסקה 3 - היסטוריה פסיכיאטרית:
[2-3 משפטים: מתי פנה לראשונה, אשפוזים, מעקב נוכחי]. טיפול תרופתי נוכחי: [שם בעברית מינון תדירות מזה כמה זמן (לאימות)]. [אם אין: ללא טיפול תרופתי נוכחי].

ברקע - גופני: [מחלות וטיפולים, או "לדבריו בריא בדרך כלל, שולל מחלות ברקע או שימוש בתרופות"]. פסיכופתולוגיה משפחתית: [או "שולל תחלואה נפשית ידועה במשפחה"]. שימוש בחומרים: [עבר והווה]. [רגישויות תרופתיות אם יש].

תלונה עיקרית - [שורה אחת בלבד: הסיבה שהמטופל הגיע].

מחלה נוכחית - [פסקה מפורטת: טריגר ← השתלשלות האפיזודה ← תסמינים לפי הסינדרום הרלוונטי. לגבי דיכאון: מצב רוח, שינה, תיאבון, אנרגיה, אנהדוניה, ריכוז, ערך עצמי, אשמה. לגבי מאניה: שינה, אנרגיה, גרנדיוזיות, דיבור, מחשבות, התנהגות. לגבי פסיכוזה: מחשבות שווא, הלוצינציות, אורגנייזיישן. לגבי חרדה/פאניקה: תסמינים גופניים, הימנעויות. לגבי PTSD: פלשבקים, סיוטים, דריכות, הימנעויות. לגבי OCD: מחשבות טורדניות, קומפולסיות. ציטוטים בגרש בודד. שימוש בלשון "מתאר ש", "לדבריו", "מציין כי" לסירוגין. שולל תסמינים שאינם קיימים. אובדנות בעבר ובהווה בפירוט: תכנית, אמצעי, ניסיונות קודמים - "בליעת X כדורי ___ (לדבריו ___), ללא אשפוז / אושפז ב___". פגיעה עצמית. מסוכנות לאחרים].

תולדות המחלה - [כרונולוגי מתחילת הקשיים הנפשיים, אפיזודות, אשפוזים, מה הביא לכל החמרה].

תולדות חיים - [ילדות ומשפחת מוצא, השכלה, שירות צבאי, עבודה, זוגיות. לא לדלג על סעיפים - אם לא ידוע, פשוט לא לכלול. לא לכתוב "לא נמסר"].

לסיכום, [משפט זיהוי: גיל, מצב משפחתי, אבחנות ידועות]. [מה הביא אותו עכשיו ורושם בבדיקה]. באבחנה מבדלת: ___, ___. [שלילות: "שולל וללא עדות ל___"]. סיכון מוערך כ___.

בייעוץ עם כונן ד"ר ___ -
א.
ב.
ג.

חוסרים לבירור:`;

const MONOLOGUE_PROMPT = `אתה עוזר לפסיכיאטר מתמחה בישראל. כתוב הצגה קצרה וחכמה לבכיר - 4-6 משפטים בלבד. פסקה אחת, ישירה, ללא כותרות.

מבנה מחייב: משפט 1 - מי המטופל ורקע תמציתי קליני רלוונטי בלבד. משפט 2 - למה הגיע ומה קרה. משפט 3 - מה מתרשם קלינית היום וסיכון. משפט 4-5 - מה מתוכנן ומה ההתלבטות.

פרטיות: אין פרטים מזהים. טון: פורמלי, דבור, ישיר - כאילו עומד מול בכיר.
התחל ב"הגיע מטופל..." וסיים ב"...ורציתי להתייעץ לגבי [ההתלבטות המרכזית]."`;

const TREATMENT_PROMPT = `אתה פסיכיאטר בכיר מנוסה. כתוב תוכנית טיפול קצרה, קולעת וממוקדת בשלושה צירים. פרוזה בלבד - אין טבלאות, אין bullet points, אין כוכביות, אין סולמיות. כתוב בגוף שלישי כאילו מייעץ לעמית.

פרטיות: אין פרטים מזהים. תרופות: שמות בעברית, סיים כל המלצה ב"(לאימות)".

כתוב בדיוק בפורמט הזה, פסקה לכל ציר:

תרופתי - [פסקה קצרה וקולעת. לדוגמה: לשקול מיצוי הטיפול הנוכחי בלוסטרל ל-200 מ"ג (לאימות), או אוגמנטציה עם מירו שיסייע גם בשינה (לאימות). אם אין תגובה, לשקול מעבר ל___. לנטר ___ .]

סוציאלי - [פסקה: זכויות ביטוח לאומי רלוונטיות למקרה זה, סל שיקום, מסגרת המשך טיפול, מעורבות משפחתית, עמותות רלוונטיות כמו ענוש, אית"ך.]

שיחתי - [פסקה: גישה מומלצת ולמה מתאימה למקרה הספציפי הזה - CBT, DBT, פסיכודינמי, EMDR, Schema, IPT, MBCT. פוקוס הטיפול. תדירות ומשך. שיקולים מיוחדים - אליאנס, טראומה, מוטיבציה.]

לבירור - [משפט אחד: מה חסר שיכול לשנות את הגישה הטיפולית.]`;

const REVISE_INTAKE_PROMPT = `אתה עוזר קליני לפסיכיאטר. קיבלת קבלת מיון קיימת והערות תיקון מהמתמחה. כתוב מחדש את הקבלה תוך שילוב התיקונים, תוך שמירה מלאה על הפורמט המקורי - טקסט רץ בלבד, ללא כוכביות, סולמיות, בולטים, טבלאות. שמור על אותו מבנה פסקאות.`;
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

async function callClaude(system, user, maxTokens = 3000) {
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

const C = {
  primary: '#9D174D',
  dark: '#7A0F3D',
  accent: '#EC4899',
  bg: '#FDF2F8',
  warn: '#FEF3C7',
  warnBorder: '#FDE68A',
  warnText: '#92400E',
  info: '#FCE7F3',
  infoText: '#9D174D',
  border: '#F9A8D4',
  borderSoft: '#FBCFE8',
  text: '#1F1F1F',
  mute: '#6B7280',
  success: '#10B981',
  successBg: '#D1FAE5',
  successText: '#065F46',
  danger: '#DC2626',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  dangerText: '#B91C1C',
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
  const [errors, setErrors] = useState({ intake: '', monologue: '', treatment: '' });
  const [activeTab, setActiveTab] = useState('intake');
  const [copied, setCopied] = useState('');
  const [globalError, setGlobalError] = useState(null);

  const [reviseNote, setReviseNote] = useState('');
  const [revising, setRevising] = useState(false);

  const [emailMode, setEmailMode] = useState(false);
  const [emailAddr, setEmailAddr] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const recRef = useRef(null);
  const keepRec = useRef(false);
  const topRef = useRef(null);
  const savedInput = useRef('');
  const savedAnswers = useRef({});

  useEffect(() => {
    navigator.permissions?.query({ name: 'microphone' })
      .then(r => { setMicPerm(r.state); r.onchange = () => setMicPerm(r.state); })
      .catch(() => {});
  }, []);

  const startRec = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setGlobalError('השתמש במיקרופון של מקלדת iOS'); return; }
    try {
      const r = new SR();
      r.lang = 'he-IL'; r.continuous = true; r.interimResults = true;
      r.onstart = () => { setIsRec(true); setGlobalError(null); };
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
    } catch { setGlobalError('לא הצליח להתחיל הקלטה.'); setIsRec(false); }
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
    } catch { setMicPerm('denied'); setGlobalError('אשר גישה למיקרופון בהגדרות'); }
  };

  const handleGetQuestions = async () => {
    if (!input.trim()) return;
    if (isRec) stopRec();
    savedInput.current = input;
    setGlobalError(null); setStage('clarifying');
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
      savedAnswers.current = init;
      setStage('answering');
    } catch {
      setGlobalError('שגיאה ביצירת שאלות. הקלט שלך נשמר.');
      setStage('input');
    }
  };

  const buildFullInput = () => {
    const cleaned = deidentify(input.trim());
    const qaText = questions.filter(q => answers[q.id]?.trim())
      .map(q => 'שאלה: ' + q.text + '\nתשובה: ' + answers[q.id]).join('\n\n');
    return cleaned + (qaText ? '\n\nפרטים נוספים:\n' + qaText : '');
  };

  const runSingle = async (key, prompt, max, fullInput) => {
    setLoading(p => ({ ...p, [key]: true }));
    setErrors(p => ({ ...p, [key]: '' }));
    try {
      const text = await callClaude(prompt, fullInput, max);
      setResults(p => ({ ...p, [key]: text }));
      setDone(p => ({ ...p, [key]: true }));
    } catch (e) {
      setErrors(p => ({ ...p, [key]: e.message }));
      setDone(p => ({ ...p, [key]: true }));
    } finally {
      setLoading(p => ({ ...p, [key]: false }));
    }
  };

  const handleGenerate = async () => {
    savedInput.current = input;
    savedAnswers.current = answers;
    setStage('generating');
    setResults({ intake: '', monologue: '', treatment: '' });
    setDone({ intake: false, monologue: false, treatment: false });
    setErrors({ intake: '', monologue: '', treatment: '' });
    setLoading({ intake: true, monologue: true, treatment: true });
    setActiveTab('intake');
    const full = buildFullInput();
    Promise.all([
      runSingle('intake', INTAKE_PROMPT, 4000, full),
      runSingle('monologue', MONOLOGUE_PROMPT, 1000, full),
      runSingle('treatment', TREATMENT_PROMPT, 4000, full),
    ]).then(() => setStage('done'));
  };

  const handleRetry = (key) => {
    const full = buildFullInput();
    const prompts = { intake: INTAKE_PROMPT, monologue: MONOLOGUE_PROMPT, treatment: TREATMENT_PROMPT };
    const maxes = { intake: 4000, monologue: 1000, treatment: 4000 };
    setDone(p => ({ ...p, [key]: false }));
    runSingle(key, prompts[key], maxes[key], full).then(() => {
      setDone(p => ({ ...p, [key]: true }));
    });
  };

  const handleRevise = async () => {
    if (!reviseNote.trim()) return;
    setRevising(true);
    try {
      const userMsg = 'הקבלה הנוכחית:\n\n' + results.intake + '\n\nהערות לתיקון:\n' + reviseNote.trim();
      const text = await callClaude(REVISE_INTAKE_PROMPT, userMsg, 4000);
      setResults(p => ({ ...p, intake: text }));
      setReviseNote('');
    } catch (e) {
      setGlobalError('שגיאה בתיקון. הקבלה הקיימת נשמרה.');
    } finally {
      setRevising(false);
    }
  };

  const handleCopy = async key => {
    try { await navigator.clipboard.writeText(results[key]); setCopied(key); setTimeout(() => setCopied(''), 2500); }
    catch { setGlobalError('לא הצליח להעתיק'); }
  };

  const handleSendEmail = () => {
    if (!emailAddr.trim()) return;
    const subject = encodeURIComponent('קבלת מיון פסיכיאטרית');
    const body = encodeURIComponent(
      'קבלת מיון:\n\n' + results.intake +
      '\n\n---\n\nהצגה לבכיר:\n' + results.monologue +
      '\n\n---\n\nתוכנית טיפול:\n' + results.treatment
    );
    window.location.href = 'mailto:' + emailAddr.trim() + '?subject=' + subject + '&body=' + body;
    setEmailMode(false);
  };

  const reset = () => {
    setStage('input'); setInput(''); setInterim('');
    setQuestions([]); setAnswers({});
    setResults({ intake: '', monologue: '', treatment: '' });
    setDone({ intake: false, monologue: false, treatment: false });
    setErrors({ intake: '', monologue: '', treatment: '' });
    setReviseNote(''); setEmailMode(false); setEmailAddr('');
    setGlobalError(null); setConfirmReset(false);
    savedInput.current = ''; savedAnswers.current = {};
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const restoreInput = () => {
    setInput(savedInput.current);
    setAnswers(savedAnswers.current);
    setStage('input');
    setGlobalError(null);
  };

  const allDone = done.intake && done.monologue && done.treatment;
  const hasError = errors.intake || errors.monologue || errors.treatment;
  return (
    <div dir="rtl" style={{ fontFamily: "Heebo, system-ui, sans-serif", minHeight: '100vh', background: C.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;700;900&family=Heebo:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box;-webkit-tap-highlight-color:transparent}body{margin:0}
        .out{white-space:pre-wrap;line-height:1.9;font-size:15px;color:#1F1F1F;font-family:Heebo,sans-serif}
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

      <div ref={topRef} style={{ background: 'linear-gradient(135deg,'+C.dark+','+C.primary+')', color: 'white', padding: '24px 20px 20px', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h1 style={{ margin: 0, fontSize: 32, fontFamily: "Frank Ruhl Libre, serif", fontWeight: 900, letterSpacing: '-0.5px' }}>הטווס האבוד</h1>
          <p style={{ margin: '6px 0 0', opacity: .85, fontSize: 13 }}>תאר מקרה ← שאלות הבהרה ← קבלה + הצגה + תוכנית</p>
        </div>
      </div>

      <div style={{ background: C.warn, borderBottom: '1px solid '+C.warnBorder, padding: '8px 20px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', fontSize: 12, color: C.warnText, textAlign: 'center' }}>
          אין להזין שמות, ת.ז., תאריכי לידה או כתובות.
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '20px 16px 60px' }}>

        {stage === 'input' && (
          <div className="fade">
            {savedInput.current && savedInput.current !== input && (
              <div style={{ background: C.dangerBg, border: '1px solid '+C.dangerBorder, borderRadius: 14, padding: '12px 16px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: C.dangerText }}>יש קלט שמור מהפעם הקודמת</span>
                <button onClick={restoreInput} style={{ fontSize: 13, fontWeight: 600, color: C.primary, border: 'none', background: 'none', padding: '4px 8px' }}>שחזר</button>
              </div>
            )}

            <div style={{ background: 'white', borderRadius: 20, border: '1px solid '+C.borderSoft, overflow: 'hidden', marginBottom: 10 }}>
              <textarea
                value={input + (interim ? ' ' + interim : '')}
                onChange={e => { if (!isRec) setInput(e.target.value); }}
                placeholder="תאר את המקרה - מי הגיע, למה, מה קרה, מצבו, תרופות, רקע."
                disabled={isRec}
                rows={9}
                style={{ width: '100%', padding: 16, fontSize: 16, border: 'none', resize: 'none', background: 'transparent', color: C.text, lineHeight: 1.7 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderTop: '1px solid '+C.borderSoft, background: C.info }}>
                <span style={{ fontSize: 12, color: C.mute }}>{input.length} תווים</span>
                {input && <button onClick={() => setInput('')} style={{ fontSize: 12, color: C.primary, border: 'none', background: 'none', padding: '4px 8px', fontWeight: 500 }}>ניקוי</button>}
              </div>
            </div>

            <button onClick={toggleRec} className={isRec ? 'recpulse' : ''}
              style={{ width: '100%', padding: 16, borderRadius: 16, border: isRec ? 'none' : '2px solid '+C.border, background: isRec ? C.danger : 'white', color: isRec ? 'white' : C.text, fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>{isRec ? '⏹' : '🎙️'}</span>
              {isRec ? 'עצור הקלטה' : 'הקלט הסבר על המקרה'}
            </button>

            <div style={{ background: C.info, borderRadius: 14, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 18 }}>⌨️</span>
              <span style={{ fontSize: 13, color: C.infoText, lineHeight: 1.5 }}>iPhone: לחץ על תיבת הטקסט, לחץ על המיקרופון ליד מקש הרווח, ודבר.</span>
            </div>

            {globalError && (
              <div style={{ background: C.dangerBg, border: '1px solid '+C.dangerBorder, borderRadius: 12, padding: '12px 16px', fontSize: 14, color: C.dangerText, marginBottom: 12 }}>
                {globalError}
              </div>
            )}

            <button onClick={handleGetQuestions} disabled={!input.trim() || isRec}
              style={{ width: '100%', padding: 18, borderRadius: 18, border: 'none', background: !input.trim() || isRec ? '#E5E2DB' : 'linear-gradient(135deg,'+C.primary+','+C.dark+')', color: 'white', fontSize: 17, fontWeight: 700 }}>
              המשך לשאלות הבהרה
            </button>
          </div>
        )}

        {stage === 'clarifying' && (
          <div className="fade" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
              {[0,1,2].map(i => <div key={i} className="dot" style={{ width: 10, height: 10, borderRadius: '50%', background: C.primary, animationDelay: i*0.2+'s' }} />)}
            </div>
            <p style={{ color: C.mute, fontSize: 16 }}>מנתח את המקרה ומכין שאלות...</p>
          </div>
        )}

        {stage === 'answering' && (
          <div className="fade">
            <div style={{ background: 'white', borderRadius: 20, border: '1px solid '+C.borderSoft, padding: 20, marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, justifyContent: 'center' }}>
                <span style={{ fontSize: 22 }}>💭</span>
                <h2 style={{ margin: 0, fontSize: 20, fontFamily: "Frank Ruhl Libre, serif", fontWeight: 700 }}>שאלות הבהרה</h2>
              </div>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: C.mute, textAlign: 'center' }}>ענה על מה שאפשר. ניתן לדלג.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {questions.map((q, idx) => (
                  <div key={q.id} style={{ borderBottom: idx < questions.length-1 ? '1px solid '+C.borderSoft : 'none', paddingBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                      <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: C.primary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>{idx+1}</span>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 600, lineHeight: 1.5 }}>{q.text}</p>
                    </div>
                    <div style={{ paddingRight: 34 }}>
                      {q.type === 'mcq' && q.options && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                          {q.options.map((opt, oi) => {
                            const sel = answers[q.id] === opt;
                            return (
                              <button key={oi} onClick={() => setAnswers(p => ({ ...p, [q.id]: sel ? '' : opt }))}
                                style={{ padding: '10px 14px', borderRadius: 12, textAlign: 'right', fontSize: 14, border: sel ? '2px solid '+C.primary : '1px solid '+C.borderSoft, background: sel ? C.info : 'white', color: sel ? C.dark : '#444', fontWeight: sel ? 600 : 400 }}>
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
                        style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid '+C.borderSoft, fontSize: 13, color: '#555', resize: 'none', width: '100%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleGenerate}
              style={{ width: '100%', padding: 18, borderRadius: 18, border: 'none', background: 'linear-gradient(135deg,'+C.primary+','+C.dark+')', color: 'white', fontSize: 17, fontWeight: 700, marginBottom: 8 }}>
              צור קבלה + הצגה + תוכנית
            </button>
            <button onClick={handleGenerate}
              style={{ width: '100%', padding: 12, borderRadius: 14, border: '1px solid '+C.border, background: 'white', color: C.mute, fontSize: 14, marginBottom: 6 }}>
              דלג על השאלות וצור ישירות
            </button>
            <button onClick={() => setStage('input')}
              style={{ width: '100%', padding: 10, border: 'none', background: 'none', color: C.mute, fontSize: 13 }}>
              חזור לעריכת הקלט
            </button>
          </div>
        )}
        {(stage === 'generating' || stage === 'done') && (
          <div className="fade">
            {!allDone && (
              <div style={{ background: 'linear-gradient(135deg,'+C.dark+','+C.primary+')', borderRadius: 16, padding: '14px 18px', marginBottom: 14, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', color: 'white' }}>
                {Object.entries(TABS).map(([key, { label }]) => (
                  <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 6, color: done[key] ? '#FBCFE8' : 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                    {loading[key] ? <span className="spin">o</span> : done[key] ? 'v' : 'o'}
                    {label}
                  </span>
                ))}
                <span style={{ fontSize: 12, opacity: 0.7, marginRight: 'auto' }}>עובד ברקע...</span>
              </div>
            )}

            {hasError && (
              <div style={{ background: C.dangerBg, border: '1px solid '+C.dangerBorder, borderRadius: 14, padding: '12px 16px', marginBottom: 12 }}>
                <p style={{ margin: '0 0 8px', fontSize: 13, color: C.dangerText, fontWeight: 600 }}>חלק מהפלטים נכשלו. הקלט שלך נשמר.</p>
                <button onClick={restoreInput} style={{ fontSize: 13, color: C.primary, border: 'none', background: 'none', padding: 0, fontWeight: 600 }}>
                  חזור לעריכה ונסה שוב
                </button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 6, marginBottom: 12, overflowX: 'auto', paddingBottom: 2 }}>
              {Object.entries(TABS).map(([key, { label, icon }]) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  style={{ flexShrink: 0, padding: '10px 16px', borderRadius: 30, fontSize: 14, fontWeight: 500, border: activeTab === key ? 'none' : '1px solid '+C.borderSoft, background: activeTab === key ? C.primary : 'white', color: activeTab === key ? 'white' : C.mute }}>
                  {icon} {label} {loading[key] && <span className="spin" style={{ marginRight: 4 }}>o</span>}
                </button>
              ))}
            </div>

            {Object.entries(TABS).map(([key, { label }]) => (
              <div key={key} style={{ display: activeTab === key ? 'block' : 'none' }}>
                {!done[key] ? (
                  <div style={{ background: 'white', borderRadius: 20, border: '1px solid '+C.borderSoft, padding: 40, textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                      {[0,1,2].map(i => <div key={i} className="dot" style={{ width: 8, height: 8, borderRadius: '50%', background: C.primary, animationDelay: i*0.2+'s' }} />)}
                    </div>
                    <p style={{ color: C.mute, fontSize: 15 }}>מייצר {label}...</p>
                  </div>
                ) : errors[key] ? (
                  <div style={{ background: C.dangerBg, border: '1px solid '+C.dangerBorder, borderRadius: 20, padding: '24px', textAlign: 'center' }}>
                    <p style={{ color: C.dangerText, fontSize: 15, margin: '0 0 12px' }}>שגיאה ביצירת {label}</p>
                    <p style={{ color: C.mute, fontSize: 13, margin: '0 0 16px' }}>הקלט שלך נשמר ולא ימחק.</p>
                    <button onClick={() => handleRetry(key)}
                      style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: C.primary, color: 'white', fontSize: 14, fontWeight: 600 }}>
                      נסה שוב
                    </button>
                  </div>
                ) : (
                  <div className="fade">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, padding: '0 4px' }}>
                      <h3 style={{ margin: 0, fontSize: 18, fontFamily: "Frank Ruhl Libre, serif" }}>{label}</h3>
                      <button onClick={() => handleCopy(key)}
                        style={{ padding: '8px 16px', borderRadius: 30, fontSize: 13, fontWeight: 500, border: 'none', background: copied === key ? C.successBg : C.primary, color: copied === key ? C.successText : 'white' }}>
                        {copied === key ? 'הועתק' : 'העתק'}
                      </button>
                    </div>
                    <div style={{ background: 'white', borderRadius: 20, border: '1px solid '+C.borderSoft, padding: '20px 22px', boxShadow: '0 1px 3px rgba(157,23,77,.05)' }}>
                      <p className="out">{results[key]}</p>
                    </div>

                    {key === 'intake' && (
                      <div style={{ marginTop: 16, background: 'white', borderRadius: 20, border: '1px solid '+C.borderSoft, padding: 16 }}>
                        <p style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: C.dark }}>הערות ותיקונים לקבלה</p>
                        <textarea
                          value={reviseNote}
                          onChange={e => setReviseNote(e.target.value)}
                          placeholder="כתוב מה לתקן או להוסיף..."
                          rows={3}
                          disabled={revising}
                          style={{ width: '100%', padding: 12, fontSize: 14, borderRadius: 12, border: '1px solid '+C.borderSoft, resize: 'none', color: C.text, lineHeight: 1.6, background: revising ? '#F9FAFB' : 'white' }}
                        />
                        <button onClick={handleRevise} disabled={!reviseNote.trim() || revising}
                          style={{ width: '100%', marginTop: 10, padding: 12, borderRadius: 12, border: 'none', background: !reviseNote.trim() || revising ? '#E5E2DB' : 'linear-gradient(135deg,'+C.primary+','+C.dark+')', color: 'white', fontSize: 14, fontWeight: 600 }}>
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
                    style={{ width: '100%', padding: 14, borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,'+C.accent+','+C.primary+')', color: 'white', fontSize: 15, fontWeight: 600, marginBottom: 10 }}>
                    שלח למייל
                  </button>
                ) : (
                  <div style={{ background: 'white', borderRadius: 16, border: '1px solid '+C.borderSoft, padding: 14, marginBottom: 10 }}>
                    <p style={{ margin: '0 0 8px', fontSize: 13, color: C.mute }}>שלח את כל הפלטים למייל:</p>
                    <input
                      type="email"
                      value={emailAddr}
                      onChange={e => setEmailAddr(e.target.value)}
                      placeholder="your@email.com"
                      style={{ width: '100%', padding: 10, fontSize: 14, borderRadius: 10, border: '1px solid '+C.borderSoft, marginBottom: 8, direction: 'ltr', textAlign: 'left' }}
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleSendEmail} disabled={!emailAddr.trim()}
                        style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: !emailAddr.trim() ? '#E5E2DB' : C.primary, color: 'white', fontSize: 14, fontWeight: 600 }}>
                        שלח
                      </button>
                      <button onClick={() => { setEmailMode(false); setEmailAddr(''); }}
                        style={{ padding: '12px 16px', borderRadius: 12, border: '1px solid '+C.borderSoft, background: 'white', color: C.mute, fontSize: 14 }}>
                        ביטול
                      </button>
                    </div>
                  </div>
                )}

                <p style={{ fontSize: 11, color: C.mute, lineHeight: 1.6, margin: '0 0 12px', textAlign: 'center' }}>
                  פלט AI - דורש קריאה ואימות לפני שימוש קליני. כל מינון או תרופה - לאמת מול מקור מוסמך.
                </p>

                {!confirmReset ? (
                  <button onClick={() => setConfirmReset(true)}
                    style={{ width: '100%', padding: 14, borderRadius: 16, border: '1px solid '+C.border, background: 'white', color: C.mute, fontSize: 15, fontWeight: 500 }}>
                    מקרה חדש
                  </button>
                ) : (
                  <div style={{ background: C.dangerBg, border: '1px solid '+C.dangerBorder, borderRadius: 12, padding: 12 }}>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: C.dangerText, textAlign: 'center' }}>הקבלה הנוכחית תאבד. להמשיך?</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={reset}
                        style={{ flex: 1, padding: 10, borderRadius: 10, border: 'none', background: C.danger, color: 'white', fontSize: 14, fontWeight: 600 }}>
                        כן, מקרה חדש
                      </button>
                      <button onClick={() => setConfirmReset(false)}
                        style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid '+C.borderSoft, background: 'white', color: C.mute, fontSize: 14 }}>
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
