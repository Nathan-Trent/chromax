import type { Metadata } from "next";
import { GoogleReCaptchaProviderWrapper } from "@/components/providers/GoogleReCaptchaProviderWrapper";
import { fraunces, inter } from "@/lib/fonts";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Chromax-MCR | Industrial Coatings",
  description:
    "Premium paint manufacturer based in Lagos, Nigeria. Industrial, marine, automotive and architectural coatings. Export to UK, USA and Ukraine.",
  icons: {
    icon: "/images/chromax-logo.png",
    shortcut: "/images/chromax-logo.png",
    apple: "/images/chromax-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} ${fraunces.variable}`}>
      <body className={inter.className} suppressHydrationWarning>
        <GoogleReCaptchaProviderWrapper>{children}</GoogleReCaptchaProviderWrapper>
      </body>
    </html>
  );
}
