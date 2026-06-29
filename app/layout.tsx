import type { Metadata } from "next";
// Next.js 14버전에서 완벽하게 호환되는 Inter 폰트로 교체합니다.
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "나의 AI 별명도감",
  description: "사진을 올리면 AI가 특별한 별명과 카드를 만들어 줍니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <main className="min-h-screen bg-zinc-50 py-10">
          <div className="mx-auto max-w-md text-center shadow-sm bg-white rounded-3xl p-6 mb-6 border border-zinc-100">
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">🎒 나의 AI 별명도감</h1>
            <p className="text-xs font-semibold text-zinc-400 mt-1">나만의 특별한 카드를 수집해 보세요!</p>
          </div>
          {children}
        </main>
      </body>
    </html>
  );
}
