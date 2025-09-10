// Mock for expo-location
export const getCurrentPositionAsync = jest.fn(() => Promise.resolve({
  coords: {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 10,
  }
}));

export const requestForegroundPermissionsAsync = jest.fn(() => Promise.resolve({ status: 'granted' }));
export const getPermissionsAsync = jest.fn(() => Promise.resolve({ status: 'granted' }));

export default {
  getCurrentPositionAsync,
  requestForegroundPermissionsAsync,
  getPermissionsAsync,
};