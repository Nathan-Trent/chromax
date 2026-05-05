import { Fraunces, Inter } from "next/font/google";

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-fraunces",
});
