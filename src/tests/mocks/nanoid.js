// Mock for nanoid
let counter = 0;

export const nanoid = jest.fn(() => {
  counter++;
  return `mock-id-${counter}-${Date.now()}`;
});

export default { nanoid };