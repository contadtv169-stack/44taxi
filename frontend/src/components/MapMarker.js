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
    });
    const marker = L.marker(position, { icon }).addTo(map);
    if (popup) marker.bindPopup(popup);
    markerRef.current = marker;
    return () => { marker.remove(); };
  }, [map]);

  useEffect(() => {
    if (markerRef.current && position) {
      markerRef.current.setLatLng(position);
    }
  }, [position]);

  return null;
}
