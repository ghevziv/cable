import './globals.css'

export const metadata = {
  title: 'עוזר תורן',
  description: 'כלי עזר קליני לפסיכיאטר',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'עוזר תורן',
  },
}

export const viewport = {
  themeColor: '#1C2B22',
}

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="עוזר תורן" />
      </head>
      <body>{children}</body>
    </html>
  )
}
