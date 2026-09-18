'use client';
import { useEffect, useRef, useState, createElement } from 'react';
import { Camera, RotateCcw, Box, LoaderCircle } from 'lucide-react';
import type { Dish } from '@/lib/types';
type ViewerElement = HTMLElement & { canActivateAR: boolean; activateAR: () => Promise<void>; cameraOrbit: string; jumpCameraToGoal: () => void; loaded: boolean; toDataURL: (type?: string) => string; };
export function FoodViewer({ dish }: { dish: Dish }) {
  const ref = useRef<ViewerElement>(null);
  const [ready, setReady] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ar, setAr] = useState(false);
  const [arMessage, setArMessage] = useState('');
  useEffect(() => { let cancelled = false; import('@google/model-viewer').then(() => { if (!cancelled) setReady(true); }).catch(() => { if (!cancelled) setFailed(true); }); return () => { cancelled = true; }; }, []);
  useEffect(() => {
    const el = ref.current; if (!el || !ready) return;
    const onLoad = () => { setLoaded(true); setAr(el.canActivateAR); };
    const onError = () => setFailed(true);
    const onStatus = (event: Event) => { if ((event as CustomEvent).detail.status === 'failed') setArMessage('No se pudo iniciar la cámara. Comprueba los permisos del navegador.'); };
    el.addEventListener('load', onLoad); el.addEventListener('error', onError); el.addEventListener('ar-status', onStatus);
    if (el.loaded) onLoad();
    return () => { el.removeEventListener('load', onLoad); el.removeEventListener('error', onError); el.removeEventListener('ar-status', onStatus); };
  }, [ready]);
  return <div className="viewer-wrap">
    <div className="viewer-label"><Box size={16}/> Vista 3D interactiva</div>
    {ready && !failed ? createElement('model-viewer', {
      ref, src: dish.model_url, 'ios-src': dish.usdz_url || undefined, alt: `Modelo 3D de ${dish.name}`,
      'camera-controls': true, ar: true, 'ar-modes': 'webxr scene-viewer quick-look',
      'ar-scale': dish.demo_model ? 'auto' : 'fixed', 'shadow-intensity': '1.2', 'shadow-softness': '0.9',
      exposure: '1', 'environment-image': 'neutral', 'camera-orbit': '25deg 65deg auto',
      'touch-action': 'pan-y', 'interaction-prompt': 'auto', loading: 'eager',
      style: { width: '100%', height: '100%', minHeight: '340px' }
    }, <button slot="ar-button" style={{ display: 'none' }} aria-hidden="true" tabIndex={-1}/>) : null}
    {!loaded && !failed ? <div className="viewer-loading"><LoaderCircle className="spin" size={27}/><span>Preparando el plato en 3D…</span></div> : null}
    {failed ? <div className="viewer-loading"><Box size={36}/><p>No pudimos cargar este modelo.</p><span>Revisa la conexión o vuelve a abrir el plato.</span></div> : null}
    <div className="viewer-bottom"><span>Arrastra para girar · Pellizca para acercar</span><button type="button" className="icon-button" aria-label="Restablecer vista 3D" disabled={!loaded} onClick={() => { if (ref.current) { ref.current.cameraOrbit = '25deg 65deg auto'; ref.current.jumpCameraToGoal(); } }}><RotateCcw size={18}/></button></div>
    <div className="ar-controls"><button className="btn primary" disabled={!loaded || !ar} onClick={async () => { try { await ref.current?.activateAR(); } catch { setArMessage('No se pudo abrir la realidad aumentada en este dispositivo.'); } }}><Camera size={19}/> Ver sobre mi mesa</button><small>{arMessage || (ar ? 'Permite el acceso a la cámara para continuar.' : 'Abre esta carta en un celular compatible para usar la cámara.')}</small></div>
  </div>;
}
