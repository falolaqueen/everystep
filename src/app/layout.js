import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Every Step | Handmade Nigeria Footwear",
  description: "Find your step, Own your color",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en">
      <body>{children}</body>
    </html>
  );
}
