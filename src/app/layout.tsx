import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata = { title: "WorshipFlow" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <header>
          <nav>
            <Link href="/">Catálogo</Link>{" "}
            <Link href="/login">Iniciar sesión</Link>{" "}
            <Link href="/songs/new">Nueva canción</Link>{" "}
            <Link href="/admin/users">Usuarios</Link>{" "}
            <Link href="/admin/labels">Etiquetas</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
