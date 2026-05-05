import type { Metadata } from "next";
import { GoogleReCaptchaProviderWrapper } from "@/components/providers/GoogleReCaptchaProviderWrapper";
import { fraunces, inter } from "@/lib/fonts";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Chromax-MCR | Industrial Coatings",
  description:
    "Premium paint manufacturer based in Lagos, Nigeria. Industrial, marine, automotive and architectural coatings. Export to UK, USA and Ukraine.",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "32x32",
      },
      {
        url: "/images/chromax-logo.png",
        type: "image/png",
        sizes: "192x192",
      },
    ],
    apple: {
      url: "/images/chromax-logo.png",
      sizes: "180x180",
      type: "image/png",
    },
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.className} ${fraunces.variable}`}>
      <body className={`${inter.className} overflow-x-hidden`} suppressHydrationWarning>
        <GoogleReCaptchaProviderWrapper>{children}</GoogleReCaptchaProviderWrapper>
      </body>
    </html>
  );
}
