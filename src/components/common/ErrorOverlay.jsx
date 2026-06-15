import { useEffect, useState } from 'react';

export default function ErrorOverlay() {
  const [error, setError] = useState(null);

  useEffect(() => {
    const onError = (message, source, lineno, colno, err) => {
      setError({ message: err?.message || message, source, lineno, colno });
      return false;
    };

    const onRejection = (ev) => {
      const reason = ev?.reason || ev;
      setError({ message: reason?.message || String(reason) });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  if (!error) return null;

  return (
    <div style={{position: 'fixed', right: 16, bottom: 16, zIndex: 99999, maxWidth: 'min(90%, 560px)'}}>
      <div style={{background: 'rgba(220,38,38,0.95)', color: 'white', padding: '12px 16px', borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.3)'}}>
        <strong style={{display: 'block', marginBottom: 6}}>Client error detected</strong>
        <div style={{fontSize: 13, whiteSpace: 'pre-wrap'}}>{error.message}</div>
        {error.source && <div style={{fontSize: 12, opacity: 0.85, marginTop: 8}}>{error.source}:{error.lineno}</div>}
        <button onClick={() => location.reload()} style={{marginTop: 8, background: 'rgba(255,255,255,0.12)', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 6}}>Reload</button>
      </div>
    </div>
  );
}
