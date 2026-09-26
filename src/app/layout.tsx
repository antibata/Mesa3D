import type { Metadata } from "next";
import { AppProvider } from "@/components/provider";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Mesa · La carta cobra vida", template: "%s · Mesa" },
  description:
    "Cartas digitales con fotografías y administración de menús para restaurantes.",
  icons: { icon: "/favicon.svg" },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
