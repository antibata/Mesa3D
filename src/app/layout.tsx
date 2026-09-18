import type { Metadata } from 'next';
import { AppProvider } from '@/components/provider';
import './globals.css';
export const metadata: Metadata = { title: { default: 'Mesa3D · La carta cobra vida', template: '%s · Mesa3D' }, description: 'Cartas digitales con modelos 3D y realidad aumentada para restaurantes.', icons: { icon: '/favicon.svg' } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="es"><body><AppProvider>{children}</AppProvider></body></html>; }
