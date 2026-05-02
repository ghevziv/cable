import './globals.css'

export const metadata = {
  title: 'עוזר תורן',
  description: 'כלי עזר קליני לפסיכיאטר',
}

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
