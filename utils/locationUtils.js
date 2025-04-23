/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  // Earth's radius in kilometers
  const R = 6371;

  // Convert degrees to radians
  const toRad = (value) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * Calculate delivery fee based on distance
 * @param {number} distance - Distance in kilometers
 * @returns {number} Delivery fee
 */
export const calculateDeliveryFee = (distance) => {
  // Base fee
  let fee = 5;

  // Additional fee based on distance
  if (distance <= 5) {
    // Within 5km: base fee only
    return fee;
  } else if (distance <= 10) {
    // 5-10km: base fee + $2 per km beyond 5km
    return fee + (distance - 5) * 2;
  } else if (distance <= 20) {
    // 10-20km: base fee + $10 for first 5km + $1.5 per km beyond 10km
    return fee + 10 + (distance - 10) * 1.5;
  } else {
    // Over 20km: base fee + $10 for first 5km + $15 for next 10km + $1 per km beyond 20km
    return fee + 10 + 15 + (distance - 20) * 1;
  }
};

/**
 * Get user's current location with improved error handling
 * @returns {Promise<{latitude: number, longitude: number}>} User coordinates
 */
export const getUserLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    // Options for geolocation request
    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds timeout
      maximumAge: 0 // Don't use cached position
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      (error) => {
        let errorMessage;

        // Provide more user-friendly error messages based on error code
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access was denied. Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please try again later.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please check your connection and try again.';
            break;
          default:
            errorMessage = `Unable to retrieve your location: ${error.message}`;
        }

        reject(new Error(errorMessage));
      },
      options
    );
  });
};

// Shop coordinates from environment variables
export const SHOP_COORDINATES = {
  latitude: parseFloat(process.env.NEXT_PUBLIC_SHOP_LATITUDE || "14.5995"),
  longitude: parseFloat(process.env.NEXT_PUBLIC_SHOP_LONGITUDE || "120.9842")
};
