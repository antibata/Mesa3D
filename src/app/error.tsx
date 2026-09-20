"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="page-loading">
      <h1>No se pudo cargar esta página</h1>
      <p>Inténtalo de nuevo en un momento.</p>
      <button className="btn primary" onClick={reset}>
        Reintentar
      </button>
    </main>
  );
}
