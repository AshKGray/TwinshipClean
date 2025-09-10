// Mock for expo-crypto
export const randomUUID = jest.fn(() => 'mock-uuid-' + Date.now());

export const digestStringAsync = jest.fn(async (algorithm, data) => {
  return 'mock-hash-' + data.substring(0, 10);
});

export const CryptoDigestAlgorithm = {
  SHA256: 'SHA256',
  SHA1: 'SHA1',
  SHA384: 'SHA384',
  SHA512: 'SHA512',
  MD5: 'MD5'
};

export default {
  randomUUID,
  digestStringAsync,
  CryptoDigestAlgorithm
};