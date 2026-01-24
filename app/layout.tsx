import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google"; // Changed imports
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Harrie's Barbershop",
  description: "Book your appointment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${oswald.variable}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
