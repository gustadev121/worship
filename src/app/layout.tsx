import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata = { title: "WorshipFlow" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header>
          <nav>
            <Link href="/">Catalog</Link> <Link href="/login">Login</Link>{" "}
            <Link href="/songs/new">New song</Link>{" "}
            <Link href="/admin/users">Users</Link>{" "}
            <Link href="/admin/labels">Labels</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
