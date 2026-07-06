import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ClassNova - All-in-One SaaS Online School Platform",
  description:
    "ClassNova is a state-of-the-art school management and learning platform. Supporting self-paced courses, active live classrooms, timed CBT exams, report cards, fee payments, and dedicated dashboards for super admins, school admins, teachers, students, and parents.",
  keywords: [
    "LMS",
    "SaaS School Platform",
    "Online School",
    "Pace Learning",
    "Active Learning",
    "CBT Exams",
    "Report Cards",
    "School Management",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} h-full scroll-smooth antialiased`}
    >
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="h-full font-sans bg-background text-foreground flex flex-col">
        {children}
      </body>
    </html>
  );
}
