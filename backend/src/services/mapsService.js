const axios = require('axios');

class MapsService {
  async calculateDistance(originLat, originLng, destLat, destLng) {
    const R = 6371;
    const dLat = this.toRad(destLat - originLat);
    const dLng = this.toRad(destLng - originLng);
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(this.toRad(originLat)) * Math.cos(this.toRad(destLat)) *
              Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async calculatePrice(distanceKm, vehicleType) {
    const baseFare = vehicleType === 'moto' ? 3.50 : 5.00;
    const perKmRate = vehicleType === 'moto' ? 1.50 : 2.50;
    const minFare = vehicleType === 'moto' ? 7.00 : 10.00;
    const price = baseFare + (distanceKm * perKmRate);
    return Math.max(price, minFare);
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }
}

module.exports = new MapsService();
