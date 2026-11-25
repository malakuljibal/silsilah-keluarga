import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Silsilah Keluarga Besar Desa Lungkap",
  description: "Aplikasi modern dan elegan pencatatan silsilah tarombo dan pohon keluarga besar Desa Lungkap",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-800">
        {children}
      </body>
    </html>
  );
}
