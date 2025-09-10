// Mock for expo-notifications
export const setNotificationHandler = jest.fn();
export const scheduleNotificationAsync = jest.fn();
export const getAllScheduledNotificationsAsync = jest.fn(() => Promise.resolve([]));
export const cancelAllScheduledNotificationsAsync = jest.fn(() => Promise.resolve());
export const getPermissionsAsync = jest.fn(() => Promise.resolve({ status: 'granted' }));
export const requestPermissionsAsync = jest.fn(() => Promise.resolve({ status: 'granted' }));

export default {
  setNotificationHandler,
  scheduleNotificationAsync,
  getAllScheduledNotificationsAsync,
  cancelAllScheduledNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
};