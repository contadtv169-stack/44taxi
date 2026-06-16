import L from 'leaflet';

const origSetPosition = L.DomUtil.setPosition;
L.DomUtil.setPosition = function (el, point) {
  try {
    return origSetPosition.call(this, el, point);
  } catch (e) {
    // suppress _leaflet_pos errors
  }
};

const origGetPosition = L.DomUtil.getPosition;
L.DomUtil.getPosition = function (el) {
  try {
    return origGetPosition.call(this, el);
  } catch (e) {
    return new L.Point(0, 0);
  }
};

export default null;
