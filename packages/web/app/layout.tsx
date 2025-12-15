import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "AkhAI - Super Research Engine",
  description: "Multi-AI consensus engine for intelligent research and decision making",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-white">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
