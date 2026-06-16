import React, { useRef, useState, useEffect } from 'react';
import { MapContainer } from 'react-leaflet';

export default function SafeMap({ center, zoom, style, children, ...props }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.offsetHeight > 0 && el.offsetWidth > 0) {
      setReady(true);
      return;
    }
    const observer = new ResizeObserver(entries => {
      if (entries[0].contentRect.height > 0 && entries[0].contentRect.width > 0) {
        setReady(true);
        observer.disconnect();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ ...style, position: 'relative' }}>
      {ready && (
        <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} {...props}>
          {children}
        </MapContainer>
      )}
    </div>
  );
}
