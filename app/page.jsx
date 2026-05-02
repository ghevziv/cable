'use client'

import React, { useState, useRef, useEffect } from 'react';

const FONT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;500;700;900&family=Heebo:wght@300;400;500;600;700&display=swap');
  
  * { -webkit-tap-highlight-color: transparent; }
  
  .font-display { font-family: 'Frank Ruhl Libre', serif; }
  .font-body { font-family: 'Heebo', system-ui, sans-serif; }
  textarea, input { font-family: 'Heebo', system-ui, sans-serif; }
  
  .output-pre { font-family: 'Heebo', system-ui, sans-serif; white-space: pre-wrap; line-height: 1.85; }
  
  .pulse-dot { animation: pulse 1.4s ease-in-out infinite; }
  @keyframes pulse {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.1); }
  }
  .pulse-dot:nth-child(2) { animation-delay: 0.2s; }
  .pulse-dot:nth-child(3) { animation-delay: 0.4s; }
  
  .fade-in { animation: fadeIn 0.4s ease-out; }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .recording-pulse { animation: recordingPulse 1.6s ease-in-out infinite; }
  @keyframes recordingPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.5); }
    50% { box-shadow: 0 0 0 12px rgba(220, 38, 38, 0); }
  }
`;

const MODES = {
  intake: {
    label: 'קבלת מיון',
    short: 'קבלה',
    icon: '📋',
    description: 'קבלה מובנית למיון - להעתקה לתיק',
    placeholder: 'הזן או הקלט מידע על המטופל. אל תזין שמות, ת.ז., או פרטים מזהים.',
    maxTokens: 2500,
    useQuestionsDefault: true,
    systemPrompt: `אתה עוזר קליני לפסיכיאטר מתמחה בתורנות מיון בישראל. תפקידך להפיק קבלת מיון פסיכיאטרית מקצועית ומובנית בעברית רפואית.

⚠️ פרטיות: אין שמות, ת.ז., תאריכי לידה, כתובות, שמות בני משפחה. השתמש ב-[שם המטופל], [שם בן/בת זוג] וכו'.
⚠️ תרופות: אסור להמציא מינונים. ⚠️לאימות בסוף כל שורת תרופה.
⚠️ דגלים אדומים: 🚩 בפתיח הסיכום (אובדנות פעילה, פסיכוזה, סיכון).
⚠️ מידע חסר: "לבירור" - לעולם לא להמציא.

פורמט פלט:

התקבל במסגרת תורנות מיון.
[הגיע עם הפנייה מ___ / ללא הפנייה]
[מוכר / לא מוכר למוסדנו]
הגיע [בליווי ___ / בגפו]

[רקע אישי-דמוגרפי - גיל, מצב משפחתי, ילדים, מגורים, תעסוקה, ביטוח לאומי, סל שיקום]

[היסטוריה פסיכיאטרית - אבחנות, אשפוזים, טיפול תרופתי במינונים ⚠️לאימות]

ברקע -
* גופני - 
* פסיכופתולוגיה משפחתית - 
* שימוש בחומרים - 

מחלה נוכחית -
[התפתחות והתסמינים, ציטוטים בגרשיים]
[תשאול ייעודי לפי המצב - מאניה / דיכאון / פסיכוזה / OCD / PTSD / חרדה - רק רלוונטיים]
שולל [תסמינים] בעבר ובהווה.
אובדנות - [בעבר ובהווה]

תולדות המחלה -

תולדות עבר -

לסיכום,
[רושם קליני, אבחנה מבדלת, רמת סיכון]

בייעוץ עם כונן ד״ר ___ -
א.
ב.
ג.

📌 חוסרים לבירור:`
  },

  departmentIntake: {
    label: 'אינטייק מחלקתי',
    short: 'אינטייק',
    icon: '📚',
    description: 'אינטייק מלא ומפורט במחלקה',
    placeholder: 'הזן או הקלט את כל המידע על המטופל - אנמנזה, MSE, וכו\'.',
    maxTokens: 4000,
    useQuestionsDefault: true,
    systemPrompt: `אתה עוזר קליני לפסיכיאטר מתמחה במחלקה פסיכיאטרית בישראל. הפק אינטייק מחלקתי מלא ומקצועי בעברית רפואית.

⚠️ פרטיות: אין פרטים מזהים. השתמש בפלייסהולדרים.
⚠️ תרופות: ⚠️לאימות אחרי כל שורה. אין להמציא מינונים.
⚠️ מידע חסר: "לבירור".

מבנה אינטייק מלא:

═══════════════════════════════
1. פרטים דמוגרפיים
═══════════════════════════════

═══════════════════════════════
2. סיבת הפניה / קבלה
═══════════════════════════════

═══════════════════════════════
3. תלונה עיקרית
═══════════════════════════════
[במילות המטופל - גרשיים]

═══════════════════════════════
4. מחלה נוכחית (HPI)
═══════════════════════════════
[התפתחות, גורמים מחישים, תסמינים, תפקוד]
[תשאול סינדרומלי ייעודי]
שולל:
אובדנות וסיכון:

═══════════════════════════════
5. היסטוריה פסיכיאטרית
═══════════════════════════════

═══════════════════════════════
6. תרופות נוכחיות
═══════════════════════════════
[רשימה עם מינונים ⚠️לאימות, היענות, ת.ל.]

═══════════════════════════════
7. רקע גופני
═══════════════════════════════

═══════════════════════════════
8. שימוש בחומרים
═══════════════════════════════

═══════════════════════════════
9. היסטוריה משפחתית
═══════════════════════════════

═══════════════════════════════
10. תולדות התפתחותיות ועבר
═══════════════════════════════
- לידה והתפתחות:
- ילדות וטראומות:
- התבגרות:
- השכלה:
- שירות צבאי:
- חיי זוגיות ומשפחה:
- תולדות תעסוקתיות:
- רוחניות / דת:
- חוקיות:

═══════════════════════════════
11. אישיות פרה-מורבידית
═══════════════════════════════

═══════════════════════════════
12. בדיקת מצב נפשי (MSE)
═══════════════════════════════
- הופעה והתנהגות:
- דיבור:
- מצב רוח:
- אפקט:
- חשיבה - תהליך:
- חשיבה - תוכן:
- תפיסה:
- קוגניציה:
- תובנה ושיפוט:
- אובדנות / הומיסידליות:

═══════════════════════════════
13. סיכום והערכה
═══════════════════════════════
אבחנה מבדלת:
1. עיקרית:
2. אפשרית:
3. לשלילה:

ניסוח ביו-פסיכו-סוציאלי:
- ביולוגי:
- פסיכולוגי:
- סוציאלי:

═══════════════════════════════
14. תוכנית בירור
═══════════════════════════════

═══════════════════════════════
📌 חוסרים מהותיים לבירור:
═══════════════════════════════`
  },
  presentation: {
    label: 'הצגה לבכיר',
    short: 'הצגה',
    icon: '🎯',
    description: 'סיכום קצר להצגה לכונן/בכיר',
    placeholder: 'הזן או הקלט מידע - יכול להיות הקבלה שכבר נכתבה או מידע גולמי.',
    maxTokens: 800,
    useQuestionsDefault: false,
    systemPrompt: `אתה עוזר לפסיכיאטר תורן בישראל. הפק סיכום קצר וממוקד לצורך הצגה לכונן/בכיר.

⚠️ פרטיות: אין פרטים מזהים.
⚠️ תרופות: ⚠️לאימות.

פורמט (3-6 משפטים):

הגיע מטופל בן ___, [פרטים רלוונטיים בלבד], שברקע אבחנה של ___ [+ טיפול ⚠️לאימות].
הגיע בשביל ___ [סיבת ההגעה].
מתאר ואני מתרשם היום ש___ [מצב קליני, MSE קצר, סיכון].
[🚩 דגלים אדומים אם יש]
אני רוצה לעשות ___ ולהתייעץ בנוגע ל___.

הוראות: ישיר, ממוקד, שפה דבורה-מקצועית.`
  },

  treatmentPlan: {
    label: 'תוכנית טיפול',
    short: 'תוכנית',
    icon: '🌿',
    description: 'תוכנית יצירתית - תרופתי, סוציאלי, פסיכותרפויטי',
    placeholder: 'הזן או הקלט אינטייק / מידע. ככל שיותר - התוכנית מותאמת יותר.',
    maxTokens: 4000,
    useQuestionsDefault: true,
    systemPrompt: `אתה פסיכיאטר בכיר מנוסה ויצירתי. בנה תוכנית טיפול מקיפה, "מגדילת ראש" - חשיבה רחבה ומעמיקה. שלב ראיות עם חשיבה אינטגרטיבית.

⚠️ פרטיות: אין פרטים מזהים.
⚠️ תרופות: ⚠️לאימות. ציין משפחות ושיקולים.

═══════════════════════════════
🧠 ניסוח קליני
═══════════════════════════════
[אבחנה ראשית, קו-מורבידיות, ניסוח ביו-פסיכו-סוציאלי]

═══════════════════════════════
🎯 מטרות טיפול
═══════════════════════════════
טווח קצר (אשפוז / שבועות):
טווח בינוני (חודשים):
טווח ארוך (שנה+):

═══════════════════════════════
💊 ציר א' - תרופתי
═══════════════════════════════
היגיון תרופתי:

המלצות:
1. [תרופה / משפחה] ⚠️לאימות
   - מנגנון ויעילות במקרה זה:
   - שיקולי בטיחות (אינטראקציות, רקע גופני):
   - ניטור (בדיקות, תדירות):
   - תופעות לוואי לעקוב:

PRN / SOS:
מה להפסיק / לשנות:

═══════════════════════════════
🤝 ציר ב' - סוציאלי
═══════════════════════════════
מעמד וזכויות:
- ביטוח לאומי / ועדה:
- סל שיקום (חשיבה רחבה - דיור? תעסוקה? לימודים?):

מערכת תמיכה:
- מעורבות משפחתית:
- ייעוץ זוגי / משפחתי:

תעסוקה / לימודים:
דיור:

קהילה והמשך טיפול:
- מרפאה / מסגרת:
- מועדונים, עמותות (Enosh, ITACH):
- קבוצות תמיכה:

═══════════════════════════════
💬 ציר ג' - שיחתי / פסיכותרפויטי
═══════════════════════════════
גישות מומלצות (מנומק):
1. [CBT / DBT / פסיכודינמית / EMDR / IPT / Schema / MBCT וכו']
   - למה מתאימה כאן:
   - פוקוס:
   - תדירות:
   - משך טיפול:

נושאים מרכזיים:
שיקולים מיוחדים:
- אליאנס:
- טראומה:
- מוטיבציה:

═══════════════════════════════
🛡️ מניעת רלפסים וניהול סיכון
═══════════════════════════════
- סימני אזהרה אישיים:
- תוכנית פעולה במשבר:
- אנשי קשר:
- אמצעי בטיחות:

═══════════════════════════════
🌱 חשיבה מורחבת ויצירתית
═══════════════════════════════
[1-3 רעיונות "מחוץ לקופסה" אבל מבוססים]

═══════════════════════════════
📌 לבירור לפני סופיות התוכנית
═══════════════════════════════`
  },

  midIntake: {
    label: 'שאלות באמצע קבלה',
    short: 'שאלות',
    icon: '❓',
    description: 'מה עוד לשאול / לברר',
    placeholder: 'הזן או הקלט את מה שכבר ברר עד עכשיו.',
    maxTokens: 1500,
    useQuestionsDefault: false,
    systemPrompt: `אתה פסיכיאטר בכיר מנחה. הפסיכיאטר התורן באמצע קבלה ומשתף מה ברר עד עכשיו. תן לו רשימה ממוקדת של שאלות שעוד צריך לשאול.

⚠️ אסור פרטים מזהים בפלט.

🔴 דחוף - לפני המשך הקבלה
- שאלה: ___
  למה: [משפט קצר]

🟡 חשוב - להשלמת התמונה הקלינית
- שאלה: ___
  למה: [משפט קצר]

🟢 השלמה - לאינטייק מלא
- שאלה: ___
  למה: [משפט קצר]

הוראות:
- שאלות ספציפיות, ניתנות לתשאול ישיר
- אל תחזור על מידע שכבר נמסר
- 5-10 שאלות בכל קטגוריה לכל היותר`
  }
};

const CLARIFYING_PROMPT = (modeLabel) => `אתה פסיכיאטר בכיר מנחה. הפסיכיאטר המתמחה הביא לך מידע גולמי ורוצה לכתוב ${modeLabel}. לפני הכתיבה, זהה 3-7 שאלות הבהרה קריטיות.

⚠️ אסור: שאלות שהתשובה כבר בקלט.
✅ כן: שאלות ספציפיות, פרגמטיות.

פורמט פלט - בדיוק כך, ללא טקסט נוסף:

1. [שאלה ברורה וקצרה] | [למה זה חשוב במשפט קצר]
2. [שאלה] | [למה]
3. [שאלה] | [למה]

מקסימום 7 שאלות.`;

const PRIVACY_PATTERNS = [
  { pattern: /\b\d{9}\b/g, replacement: '[ת.ז.]', label: 'ת.ז.' },
  { pattern: /\b0\d{1,2}-?\d{7}\b/g, replacement: '[טלפון]', label: 'טלפון' },
  { pattern: /\+972-?\d{1,2}-?\d{7}\b/g, replacement: '[טלפון]', label: 'טלפון' },
  { pattern: /\b\d{1,2}[\/.\-]\d{1,2}[\/.\-]\d{2,4}\b/g, replacement: '[תאריך]', label: 'תאריך' },
];

function deidentify(text) {
  let cleaned = text;
  const found = [];
  PRIVACY_PATTERNS.forEach(({ pattern, replacement, label }) => {
    if (pattern.test(cleaned)) found.push(label);
    cleaned = cleaned.replace(pattern, replacement);
  });
  return { cleaned, found: [...new Set(found)] };
}

function parseQuestions(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const questions = [];
  for (const line of lines) {
    const match = line.match(/^\d+\.\s*(.+?)\s*\|\s*(.+)$/);
    if (match) {
      questions.push({
        id: `q_${questions.length}`,
        question: match[1].trim(),
        why: match[2].trim(),
        answer: ''
      });
    }
  }
  return questions;
}
export default function App() {
  const [mode, setMode] = useState('intake');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [privacyAlert, setPrivacyAlert] = useState([]);
  const [stage, setStage] = useState('input');
  const [questions, setQuestions] = useState([]);
  const [useQuestions, setUseQuestions] = useState(MODES.intake.useQuestionsDefault);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [micPermission, setMicPermission] = useState('unknown');
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);
  const recognitionRef = useRef(null);
  const shouldKeepRecording = useRef(false);
  const outputRef = useRef(null);
  const questionsRef = useRef(null);
  const currentMode = MODES[mode];

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) setSpeechSupported(false);
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' })
        .then(result => {
          setMicPermission(result.state);
          result.onchange = () => setMicPermission(result.state);
        })
        .catch(() => setMicPermission('unknown'));
    }
  }, []);

  useEffect(() => {
    setUseQuestions(currentMode.useQuestionsDefault);
  }, [mode]);

  const requestMicPermission = async () => {
    setError(null);
    setShowPermissionHelp(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicPermission('granted');
      startRecording();
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicPermission('denied');
        setShowPermissionHelp(true);
      } else if (err.name === 'NotFoundError') {
        setError('לא נמצא מיקרופון במכשיר.');
      } else {
        setError('שגיאה בגישה למיקרופון: ' + (err.message || err.name));
      }
    }
  };

  const startRecording = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError('הדפדפן שלך לא תומך בהקלטה.'); return; }
    try {
      const recognition = new SR();
      recognition.lang = 'he-IL';
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onstart = () => { setIsRecording(true); setError(null); };
      recognition.onresult = (event) => {
        let interim = '';
        let finalChunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalChunk += transcript + ' ';
          else interim += transcript;
        }
        setInterimText(interim);
        if (finalChunk) {
          setInput(prev => {
            const sep = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
            return prev + sep + finalChunk;
          });
        }
      };
      recognition.onerror = (event) => {
        if (event.error === 'no-speech' || event.error === 'aborted') return;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setMicPermission('denied');
          setShowPermissionHelp(true);
          shouldKeepRecording.current = false;
          setIsRecording(false);
        } else if (event.error === 'network') {
          setError('בעיית רשת.');
          shouldKeepRecording.current = false;
          setIsRecording(false);
        }
      };
      recognition.onend = () => {
        if (shouldKeepRecording.current) {
          try { recognition.start(); } catch (e) {
            shouldKeepRecording.current = false;
            setIsRecording(false);
          }
        } else {
          setIsRecording(false);
          setInterimText('');
        }
      };
      recognitionRef.current = recognition;
      shouldKeepRecording.current = true;
      setIsRecording(true);
      recognition.start();
    } catch (e) {
      setError('לא הצליח להתחיל הקלטה.');
      setIsRecording(false);
      shouldKeepRecording.current = false;
    }
  };

  const stopRecording = () => {
    shouldKeepRecording.current = false;
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (e) {} }
    setIsRecording(false);
    setInterimText('');
  };

  const toggleRecording = () => {
    if (isRecording) stopRecording();
    else if (micPermission === 'denied') setShowPermissionHelp(true);
    else if (micPermission === 'granted') startRecording();
    else requestMicPermission();
  };

  const callClaude = async (systemPrompt, userInput, maxTokens) => {
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userInput }]
      })
    });
    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    return data.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
  };

  const handleStart = async () => {
    if (!input.trim() || loading) return;
    if (isRecording) stopRecording();
    setError(null); setOutput(''); setCopied(false); setQuestions([]);
    const { cleaned, found } = deidentify(input);
    setPrivacyAlert(found);
    if (!useQuestions) return generateFinal(cleaned);
    setStage('asking');
    setLoading(true);
    try {
      const text = await callClaude(CLARIFYING_PROMPT(currentMode.label), cleaned, 1200);
      const parsed = parseQuestions(text);
      if (parsed.length === 0) return generateFinal(cleaned);
      setQuestions(parsed);
      setStage('answering');
      setTimeout(() => questionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    } catch (e) {
      setError('שגיאה ביצירת שאלות. נסה שוב.');
      setStage('input');
    } finally {
      setLoading(false);
    }
  };

  const generateFinal = async (sourceInput, qs = null) => {
    setStage('generating'); setLoading(true); setError(null);
    let finalInput = typeof sourceInput === 'string' ? sourceInput : deidentify(input).cleaned;
    if (qs && qs.length > 0) {
      const answered = qs.filter(q => q.answer.trim());
      if (answered.length > 0) {
        const qaText = answered.map(q => `שאלה: ${q.question}\nתשובה: ${q.answer.trim()}`).join('\n\n');
        finalInput += '\n\n--- מידע נוסף שנאסף בשאלות ---\n' + qaText;
      }
    }
    try {
      const text = await callClaude(currentMode.systemPrompt, finalInput, currentMode.maxTokens);
      setOutput(text); setStage('done');
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200);
    } catch (e) {
      setError('שגיאה ביצירת הפלט. נסה שוב.');
      setStage('input');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswers = () => generateFinal(deidentify(input).cleaned, questions);
  const handleSkipQuestions = () => generateFinal(deidentify(input).cleaned);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) { setError('לא הצליח להעתיק.'); }
  };

  const handleClear = () => {
    if (isRecording) stopRecording();
    setInput(''); setOutput(''); setError(null);
    setPrivacyAlert([]); setQuestions([]); setStage('input');
  };

  const handleStartOver = () => {
    setStage('input'); setOutput(''); setQuestions([]); setError(null);
  };

  const updateAnswer = (id, value) => {
    setQuestions(qs => qs.map(q => q.id === id ? { ...q, answer: value } : q));
  };
  return (
    <div dir="rtl" className="min-h-screen bg-stone-50" style={{ fontFamily: "'Heebo', system-ui, sans-serif" }}>
      <style>{FONT_STYLES}</style>

      <header className="bg-white border-b border-stone-200">
        <div className="max-w-3xl mx-auto px-4 pt-6 pb-4">
          <div className="flex items-baseline gap-2 mb-1">
            <h1 className="text-3xl text-stone-900 font-bold tracking-tight" style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>
              עוזר תורן
            </h1>
            <span className="text-stone-400 text-sm">·</span>
            <span className="text-stone-500 text-sm">פסיכיאטריה</span>
          </div>
          <p className="text-stone-500 text-sm">כלי עזר לקבלות, אינטייקים והצגות.</p>
        </div>
      </header>

      <div className="bg-amber-50 border-b border-amber-200">
        <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-start gap-2">
          <span className="text-amber-700 mt-0.5">⚠️</span>
          <p className="text-amber-900 text-xs leading-relaxed">
            <strong>הקפד:</strong> אין להזין שמות, ת.ז., תאריכי לידה, כתובות, או שמות בני משפחה.
          </p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-5">
        <div className="mb-5">
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
            {Object.entries(MODES).map(([key, m]) => (
              <button
                key={key}
                onClick={() => { setMode(key); handleStartOver(); }}
                className={`flex-shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                  mode === key ? 'bg-stone-900 text-white shadow-sm' : 'bg-white text-stone-700 border border-stone-200'
                }`}
              >
                <span className="ml-1.5">{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
          <p className="text-stone-500 text-xs mt-3 px-1">{currentMode.description}</p>
        </div>

        {(stage === 'input' || stage === 'asking') && (
          <>
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <textarea
                value={input + (interimText ? ' ' + interimText : '')}
                onChange={(e) => { if (!isRecording) setInput(e.target.value); }}
                placeholder={currentMode.placeholder}
                className="w-full px-4 py-4 text-stone-900 text-base resize-none focus:outline-none placeholder:text-stone-400"
                rows={8}
                style={{ minHeight: '180px' }}
                disabled={isRecording}
              />
              <div className="flex items-center justify-between px-3 py-2 border-t border-stone-100 bg-stone-50">
                <span className="text-stone-400 text-xs">{input.length} תווים</span>
                <button type="button" onClick={handleClear} disabled={!input && !output && !isRecording}
                  className="text-stone-500 text-xs hover:text-stone-700 disabled:opacity-30">
                  ניקוי
                </button>
              </div>
            </div>

            {speechSupported && (
              <button type="button" onClick={toggleRecording} disabled={loading}
                className={`w-full mt-3 py-4 rounded-2xl font-semibold text-base transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 ${
                  isRecording ? 'bg-red-600 text-white recording-pulse shadow-md'
                  : micPermission === 'denied' ? 'bg-white border-2 border-amber-400 text-amber-900'
                  : 'bg-white border-2 border-stone-300 text-stone-900'
                }`}
                style={{ minHeight: '56px' }}>
                {isRecording ? (<><span>⏹</span><span>עצור הקלטה</span></>)
                  : micPermission === 'denied' ? (<><span>🎙️</span><span>המיקרופון חסום - לחץ לעזרה</span></>)
                  : (<><span>🎙️</span><span>הקלט הסבר על המטופל</span></>)}
              </button>
            )}

            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 flex items-start gap-3">
              <span className="text-2xl leading-none mt-0.5">⌨️</span>
              <div>
                <p className="text-blue-900 text-sm font-semibold mb-0.5">הכתבה דרך מקלדת iOS</p>
                <p className="text-blue-800 text-xs leading-relaxed">
                  לחץ על תיבת הטקסט ← לחץ על <strong>🎤</strong> ליד מקש הרווח ← דבר בעברית.
                </p>
              </div>
            </div>

            {showPermissionHelp && (
              <div className="mt-3 bg-amber-50 border border-amber-300 rounded-2xl p-4 fade-in">
                <p className="text-amber-900 font-semibold text-sm mb-1">🎙️ המיקרופון חסום</p>
                <p className="text-amber-800 text-xs leading-relaxed mb-3">
                  השתמש בהכתבה דרך המקלדת - זה עובד בדיוק אותו הדבר.
                </p>
                <button type="button" onClick={() => setShowPermissionHelp(false)}
                  className="w-full py-2.5 rounded-xl bg-white border border-stone-300 text-stone-700 text-sm">
                  הבנתי
                </button>
              </div>
            )}

            {mode !== 'midIntake' && (
              <div className="mt-4 flex items-center justify-between bg-white border border-stone-200 rounded-xl px-4 py-3">
                <div>
                  <div className="text-stone-900 text-sm font-medium">שאלות הבהרה לפני הפלט</div>
                  <div className="text-stone-500 text-xs mt-0.5">המערכת תשאל שאלות חיוניות ותשפר את הפלט</div>
                </div>
                <button onClick={() => setUseQuestions(!useQuestions)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${useQuestions ? 'bg-emerald-700' : 'bg-stone-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${useQuestions ? 'right-0.5' : 'right-5'}`} />
                </button>
              </div>
            )}

            <button onClick={handleStart} disabled={!input.trim() || loading || isRecording}
              className="w-full mt-4 py-4 rounded-2xl text-white font-semibold text-base disabled:opacity-40 shadow-sm"
              style={{ background: loading || !input.trim() || isRecording ? '#A8A29E' : 'linear-gradient(135deg, #2D5645 0%, #1F3D31 100%)' }}>
              {stage === 'asking' ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="flex gap-1">
                    <span className="pulse-dot w-1.5 h-1.5 bg-white rounded-full"></span>
                    <span className="pulse-dot w-1.5 h-1.5 bg-white rounded-full"></span>
                    <span className="pulse-dot w-1.5 h-1.5 bg-white rounded-full"></span>
                  </span>
                  <span>מנתח ומכין שאלות...</span>
                </span>
              ) : (
                <>{useQuestions && mode !== 'midIntake' ? `התחל - שאלות + ${currentMode.short}` : `צור ${currentMode.short}`}</>
              )}
            </button>
          </>
        )}

        {stage === 'answering' && (
          <div ref={questionsRef} className="fade-in">
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">💭</span>
                <h2 className="text-xl text-stone-900 font-semibold" style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>שאלות הבהרה</h2>
              </div>
              <p className="text-stone-500 text-sm mb-5">ענה על מה שאתה יודע. אפשר לדלג.</p>
              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div key={q.id} className="border-b border-stone-100 pb-4 last:border-0">
                    <div className="flex gap-2 mb-1">
                      <span className="flex-shrink-0 w-6 h-6 bg-stone-100 text-stone-700 rounded-full flex items-center justify-center text-xs font-semibold">{idx + 1}</span>
                      <p className="text-stone-900 text-sm font-medium leading-relaxed">{q.question}</p>
                    </div>
                    <p className="text-stone-400 text-xs mr-8 mb-2">{q.why}</p>
                    <div className="mr-8">
                      <textarea value={q.answer} onChange={(e) => updateAnswer(q.id, e.target.value)}
                        placeholder="התשובה / לא ידוע / לדלג..."
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none resize-none" rows={2} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button onClick={handleSkipQuestions} className="py-3 rounded-2xl bg-white border border-stone-300 text-stone-700 font-medium text-sm">דלג על שאלות</button>
              <button onClick={handleSubmitAnswers} className="py-3 rounded-2xl text-white font-semibold text-sm shadow-sm"
                style={{ background: 'linear-gradient(135deg, #2D5645 0%, #1F3D31 100%)' }}>צור גרסה סופית ←</button>
            </div>
            <button onClick={handleStartOver} className="w-full mt-2 py-2 text-stone-500 text-sm">↺ חזור לעריכת הקלט</button>
          </div>
        )}

        {stage === 'generating' && (
          <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center fade-in">
            <div className="flex justify-center gap-1.5 mb-3">
              <span className="pulse-dot w-2 h-2 bg-emerald-700 rounded-full"></span>
              <span className="pulse-dot w-2 h-2 bg-emerald-700 rounded-full"></span>
              <span className="pulse-dot w-2 h-2 bg-emerald-700 rounded-full"></span>
            </div>
            <p className="text-stone-700 font-medium">מייצר {currentMode.label}...</p>
            <p className="text-stone-400 text-xs mt-1">זה לוקח כמה שניות</p>
          </div>
        )}

        {privacyAlert.length > 0 && stage !== 'input' && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 fade-in">
            <p className="text-blue-900 text-xs"><strong>זוהה והוסר:</strong> {privacyAlert.join(', ')}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 fade-in">
            <p className="text-red-900 text-sm">{error}</p>
          </div>
        )}

        {stage === 'done' && output && (
          <div ref={outputRef} className="mt-6 fade-in">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-xl text-stone-900 font-semibold" style={{ fontFamily: "'Frank Ruhl Libre', serif" }}>{currentMode.label}</h2>
              <button onClick={handleCopy}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${copied ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-stone-900 text-white'}`}>
                {copied ? '✓ הועתק' : '📋 העתק'}
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-stone-200 px-5 py-5 shadow-sm">
              <div className="output-pre text-stone-800 text-[15px]">{output}</div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button onClick={handleStartOver} className="py-3 rounded-2xl bg-white border border-stone-300 text-stone-700 font-medium text-sm">↺ חזור לעריכה</button>
              <button onClick={() => generateFinal(deidentify(input).cleaned, questions.length ? questions : null)}
                className="py-3 rounded-2xl bg-stone-100 text-stone-800 font-medium text-sm">⟳ צור שוב</button>
            </div>
            <div className="mt-4 text-stone-400 text-xs leading-relaxed px-1">
              <p>⚠️ פלט AI - דורש קריאה ואימות לפני הכנסה לתיק.</p>
              <p className="mt-1">⚠️ כל מינון/תרופה - יש לאמת מול מקור מוסמך.</p>
            </div>
          </div>
        )}

        <div className="h-12"></div>
      </main>
    </div>
  );
}
