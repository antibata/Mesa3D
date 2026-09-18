import Link from 'next/link';
export default function NotFound(){return <main className="page-loading"><h1>No encontramos esta página</h1><p>Comprueba el enlace o vuelve al inicio.</p><Link href="/" className="btn primary">Volver al inicio</Link></main>;}
