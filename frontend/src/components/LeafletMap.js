import { useEffect, useRef } from 'react';
import L from 'leaflet';

export default function LeafletMap({ center, zoom, markers, onMapReady, style, className }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;
    if (el.offsetHeight === 0 || el.offsetWidth === 0) return;

    const map = L.map(el, {
      center: center || [-23.5505, -46.6333],
      zoom: zoom || 14,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    mapRef.current = map;
    if (onMapReady) onMapReady(map);

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = [];
    };
  }, []);

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!markers || !markers.length) return;

    markers.forEach(({ position, iconHtml, iconSize, popup }) => {
      if (!position) return;
      const icon = L.divIcon({
        className: '',
        html: iconHtml || '',
        iconSize: iconSize || [20, 20],
        iconAnchor: [iconSize ? iconSize[0] / 2 : 10, iconSize ? iconSize[1] / 2 : 10],
      });
      const marker = L.marker(position, { icon }).addTo(map);
      if (popup) marker.bindPopup(popup);
      markersRef.current.push(marker);
    });
  }, [markers]);

  // Sync center/zoom
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center) return;
    map.setView(center, zoom || 14);
  }, [center, zoom]);

  return <div ref={containerRef} className={className} style={style} />;
}
