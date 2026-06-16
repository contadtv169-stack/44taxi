import axios from 'axios';

const NOMINATIM = 'https://nominatim.openstreetmap.org';

export async function reverseGeocode(lat, lng) {
  try {
    const { data } = await axios.get(`${NOMINATIM}/reverse`, {
      params: { lat, lon: lng, format: 'json', addressdetails: 1, 'accept-language': 'pt-BR' },
      headers: { 'User-Agent': '44Taxi/1.0' },
    });
    if (data?.display_name) {
      return {
        full: data.display_name,
        street: data.address?.road || data.address?.pedestrian || '',
        neighborhood: data.address?.suburb || data.address?.neighbourhood || '',
        city: data.address?.city || data.address?.town || data.address?.village || '',
        state: data.address?.state || '',
        number: data.address?.house_number || '',
        short: [data.address?.road, data.address?.house_number, data.address?.suburb]
          .filter(Boolean).join(', '),
      };
    }
  } catch {}
  return { full: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, street: '', short: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
}

export async function searchLocations(query) {
  if (!query || query.length < 3) return [];
  try {
    const { data } = await axios.get(`${NOMINATIM}/search`, {
      params: { q: query, format: 'json', limit: 5, addressdetails: 1, 'accept-language': 'pt-BR' },
      headers: { 'User-Agent': '44Taxi/1.0' },
    });
    return (data || []).map(item => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      label: item.display_name,
      short: item.display_name?.split(',').slice(0, 3).join(',') || item.display_name,
    }));
  } catch { return []; }
}
