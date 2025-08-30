// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Business Analysis Assistant",
  description: "AI-powered requirements elicitation platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 min-h-screen">
        {children}
      </body>
    </html>
  );
}
