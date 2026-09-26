'use client';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return <html lang="es"><body style={{ fontFamily: 'Arial, sans-serif', padding: '48px 24px', maxWidth: 680, margin: 'auto', color: '#242521' }}><h1>No pudimos abrir Mesa</h1><p>Recarga la página. Si el problema continúa, contacta con el administrador de la plataforma.</p><button onClick={reset} style={{ padding: '12px 20px', fontSize: 16, cursor: 'pointer' }}>Volver a intentar</button></body></html>;
}
