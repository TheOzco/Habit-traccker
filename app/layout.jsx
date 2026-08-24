import './globals.css'

export const metadata = {
  title: 'Habit Tracker',
  description: 'عادت‌های خود را ردیابی کنید',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  )
}
