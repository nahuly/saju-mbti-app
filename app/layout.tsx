import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MBTI × 사주 — 당신만의 색깔",
  description: "MBTI와 사주팔자를 함께 풀어보는 종합 해석",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
