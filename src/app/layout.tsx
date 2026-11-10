import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Bookshelf · Your reading space",
  description:
    "A personal book tracker built with Next.js, tRPC and PostgreSQL.",
};
export default function Layout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
