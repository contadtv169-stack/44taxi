import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function MapMarker({ position, iconHtml, iconSize, popup, className }) {
  const map = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (!position || !map) return;
    const icon = L.divIcon({
      className: className || '',
      html: iconHtml || '',
      iconSize: iconSize || [20, 20],
      iconAnchor: [iconSize ? iconSize[0]/2 : 10, iconSize ? iconSize[1]/2 : 10],
    });
    const marker = L.marker(position, { icon }).addTo(map);
    if (popup) marker.bindPopup(popup);
    markerRef.current = marker;
    return () => { if (markerRef.current) { markerRef.current.remove(); markerRef.current = null; } };
  }, [map, position, iconHtml, iconSize, popup, className]);

  return null;
}
