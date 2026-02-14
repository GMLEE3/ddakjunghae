import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
    title: "딱정해 | AI 모임 장소 추천",
    description: "AI가 분석해 딱 맞는 모임 장소를 추천해드립니다. 회사 회식, 친구 모임, 데이트 장소까지!",
    keywords: ["모임 장소", "맛집 추천", "AI 추천", "중간 지점", "회식 장소"],
    openGraph: {
        title: "딱정해 | AI 모임 장소 추천",
        description: "AI가 분석해 딱 맞는 모임 장소를 추천해드립니다",
        type: "website",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ko">
            <head>
                <link
                    href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
                    rel="stylesheet"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="antialiased" data-theme="company">
                {process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID && (
                    <Script
                        async
                        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}`}
                        crossOrigin="anonymous"
                        strategy="afterInteractive"
                    />
                )}
                {children}
            </body>
        </html>
    );
}
