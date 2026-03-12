import Provider from '../models/Provider.js';

class GeoSearchService {
    /**
     * Calculate distance between two coordinates using the Haversine formula
     * @param {number} lat1 
     * @param {number} lon1 
     * @param {number} lat2 
     * @param {number} lon2 
     * @returns {number} distance in kilometers
     */
    static getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    }

    static deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    /**
     * Finds providers near a given latitude and longitude within a radius.
     * Uses MongoDB's $geoNear aggregation pipeline.
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {number|string} maxDistanceMeters - Max radius in meters (default 50km)
     * @returns {Promise<Array>} List of providers with calculated distance
     */
    static async findProvidersNearLocation(lat, lng, maxDistanceMeters = 500000) {
        const providers = await Provider.aggregate([
            {
                $geoNear: {
                    near: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] },
                    distanceField: "dist.calculated", // Output field
                    key: "location",
                    maxDistance: parseInt(maxDistanceMeters, 10),
                    spherical: true,
                    distanceMultiplier: 0.001 // Convert meters to km
                }
            }
        ]);

        return providers;
    }
}

export default GeoSearchService;
