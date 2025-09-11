// Test script for auth endpoints
// Run with: node test-auth-endpoints.js
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3000/api/auth';

// Helper function to make API requests
async function request(endpoint, options = {}) {
  const fetch = (await import('node-fetch')).default;
  const url = `${BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const config = { ...defaultOptions, ...options };
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { error: error.message };
  }
}

// Test functions
async function testRegister() {
  console.log('\n=== Testing Registration ===');
  const email = `test${Date.now()}@example.com`;
  
  const result = await request('/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password: 'TestPass123',
      displayName: 'Test User'
    })
  });
  
  console.log('Registration result:', JSON.stringify(result, null, 2));
  return result.data?.user?.id;
}

async function testResendVerification() {
  console.log('\n=== Testing Resend Verification ===');
  
  const result = await request('/resend-verification', {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@example.com'
    })
  });
  
  console.log('Resend verification result:', JSON.stringify(result, null, 2));
}

async function testForgotPassword() {
  console.log('\n=== Testing Forgot Password ===');
  
  const result = await request('/forgot-password', {
    method: 'POST',
    body: JSON.stringify({
      email: 'test@example.com'
    })
  });
  
  console.log('Forgot password result:', JSON.stringify(result, null, 2));
}

async function testInvalidTokens() {
  console.log('\n=== Testing Invalid Tokens ===');
  
  const fakeToken = crypto.randomUUID();
  
  const verifyResult = await request('/verify-email', {
    method: 'POST',
    body: JSON.stringify({
      token: fakeToken
    })
  });
  
  console.log('Invalid verify token result:', JSON.stringify(verifyResult, null, 2));
  
  const resetResult = await request('/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      token: fakeToken,
      password: 'NewPass123'
    })
  });
  
  console.log('Invalid reset token result:', JSON.stringify(resetResult, null, 2));
}

async function testValidationErrors() {
  console.log('\n=== Testing Validation Errors ===');
  
  const verifyResult = await request('/verify-email', {
    method: 'POST',
    body: JSON.stringify({})
  });
  
  console.log('Missing token result:', JSON.stringify(verifyResult, null, 2));
  
  const resetResult = await request('/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      token: 'some-token',
      password: 'weak'
    })
  });
  
  console.log('Weak password result:', JSON.stringify(resetResult, null, 2));
}

// Main test runner
async function runTests() {
  try {
    console.log('🚀 Starting Auth Endpoint Tests...');
    console.log('Make sure the backend server is running on http://localhost:3000');
    
    await testRegister();
    await testResendVerification();
    await testForgotPassword();
    await testInvalidTokens();
    await testValidationErrors();
    
    console.log('\n✅ All tests completed! Check the console output and server logs for email content.');
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

if (require.main === module) {
  runTests();
}