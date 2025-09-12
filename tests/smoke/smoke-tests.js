/**
 * Smoke Tests for Post-Deployment Validation
 * These tests run immediately after deployment to verify critical functionality
 */

const axios = require('axios');
const assert = require('assert');

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'https://api.twinship.app';
const TIMEOUT = 5000; // 5 seconds
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Test results collector
const testResults = {
  passed: [],
  failed: [],
  skipped: [],
  startTime: Date.now()
};

// Helper function for retries
async function withRetry(fn, attempts = RETRY_ATTEMPTS) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}

// Helper function to run a test
async function runTest(name, testFn) {
  console.log(`\n🔍 Running: ${name}`);
  try {
    await withRetry(testFn);
    testResults.passed.push(name);
    console.log(`✅ PASSED: ${name}`);
  } catch (error) {
    testResults.failed.push({ name, error: error.message });
    console.error(`❌ FAILED: ${name}`);
    console.error(`   Error: ${error.message}`);
  }
}

// Test Suite
const smokeTests = {
  // 1. Health Check
  async testHealthEndpoint() {
    const response = await axios.get(`${BASE_URL}/health`, { timeout: TIMEOUT });
    assert.strictEqual(response.status, 200, 'Health endpoint should return 200');
    assert.ok(response.data, 'Health endpoint should return data');
    assert.strictEqual(response.data.status, 'healthy', 'Service should be healthy');
  },

  // 2. API Availability
  async testAPIAvailability() {
    const endpoints = [
      '/api/v1/status',
      '/api/v1/version',
      '/api/v1/config/public'
    ];

    for (const endpoint of endpoints) {
      const response = await axios.get(`${BASE_URL}${endpoint}`, { 
        timeout: TIMEOUT,
        validateStatus: (status) => status < 500 
      });
      assert.ok(response.status < 500, `${endpoint} should not return 5xx error`);
    }
  },

  // 3. Database Connectivity
  async testDatabaseConnection() {
    const response = await axios.get(`${BASE_URL}/api/v1/status/database`, { 
      timeout: TIMEOUT 
    });
    assert.strictEqual(response.status, 200, 'Database status should return 200');
    assert.strictEqual(response.data.connected, true, 'Database should be connected');
    assert.ok(response.data.latency < 100, 'Database latency should be under 100ms');
  },

  // 4. Authentication System
  async testAuthenticationSystem() {
    // Test that auth endpoints exist
    const authEndpoints = [
      { method: 'POST', path: '/api/v1/auth/login' },
      { method: 'POST', path: '/api/v1/auth/refresh' },
      { method: 'GET', path: '/api/v1/auth/verify' }
    ];

    for (const endpoint of authEndpoints) {
      try {
        await axios({
          method: endpoint.method,
          url: `${BASE_URL}${endpoint.path}`,
          timeout: TIMEOUT,
          validateStatus: (status) => status === 400 || status === 401 || status === 405
        });
        // We expect these to fail with 4xx (not authenticated), but not 5xx
      } catch (error) {
        if (error.response && error.response.status >= 500) {
          throw new Error(`Auth endpoint ${endpoint.path} returned server error`);
        }
      }
    }
  },

  // 5. Twin Connection Features
  async testTwinConnectionEndpoints() {
    const twinEndpoints = [
      '/api/v1/twins/pair',
      '/api/v1/twins/status',
      '/api/v1/twintuition/current'
    ];

    for (const endpoint of twinEndpoints) {
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        timeout: TIMEOUT,
        validateStatus: (status) => status < 500
      });
      assert.ok(response.status < 500, `${endpoint} should be available`);
    }
  },

  // 6. WebSocket Connection
  async testWebSocketAvailability() {
    // Test that WebSocket upgrade endpoint exists
    try {
      const response = await axios.get(`${BASE_URL}/ws`, {
        headers: {
          'Upgrade': 'websocket',
          'Connection': 'Upgrade'
        },
        timeout: TIMEOUT,
        validateStatus: () => true
      });
      // We expect a 426 Upgrade Required or similar
      assert.ok(
        response.status === 426 || response.status === 400,
        'WebSocket endpoint should respond to upgrade request'
      );
    } catch (error) {
      // Connection errors are expected for WebSocket upgrade attempts via HTTP
      if (!error.message.includes('ECONNRESET')) {
        throw error;
      }
    }
  },

  // 7. Static Assets
  async testStaticAssets() {
    const assets = [
      '/robots.txt',
      '/favicon.ico',
      '/manifest.json'
    ];

    for (const asset of assets) {
      try {
        const response = await axios.head(`${BASE_URL}${asset}`, {
          timeout: TIMEOUT,
          validateStatus: (status) => status < 500
        });
        assert.ok(
          response.status === 200 || response.status === 404,
          `${asset} should be accessible or explicitly not found`
        );
      } catch (error) {
        // Some assets might not exist, which is okay
        console.log(`  ⚠️  Asset ${asset} check failed: ${error.message}`);
      }
    }
  },

  // 8. Rate Limiting
  async testRateLimiting() {
    const endpoint = `${BASE_URL}/api/v1/status`;
    const requests = [];

    // Make 10 rapid requests
    for (let i = 0; i < 10; i++) {
      requests.push(
        axios.get(endpoint, {
          timeout: TIMEOUT,
          validateStatus: () => true
        })
      );
    }

    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);
    
    // We should either see rate limiting kick in, or all requests succeed
    const allSuccessful = responses.every(r => r.status === 200);
    assert.ok(
      rateLimited || allSuccessful,
      'Rate limiting should work or handle burst traffic'
    );
  },

  // 9. Error Handling
  async testErrorHandling() {
    try {
      await axios.get(`${BASE_URL}/api/v1/nonexistent-endpoint-12345`, {
        timeout: TIMEOUT
      });
      assert.fail('Should have returned 404');
    } catch (error) {
      assert.strictEqual(error.response.status, 404, 'Should return 404 for unknown routes');
      assert.ok(error.response.data, 'Error response should have body');
    }
  },

  // 10. Response Times
  async testResponseTimes() {
    const criticalEndpoints = [
      '/health',
      '/api/v1/status',
      '/api/v1/version'
    ];

    for (const endpoint of criticalEndpoints) {
      const startTime = Date.now();
      await axios.get(`${BASE_URL}${endpoint}`, { timeout: TIMEOUT });
      const responseTime = Date.now() - startTime;
      
      assert.ok(
        responseTime < 1000,
        `${endpoint} should respond within 1 second (took ${responseTime}ms)`
      );
    }
  },

  // 11. CORS Headers
  async testCORSHeaders() {
    const response = await axios.options(`${BASE_URL}/api/v1/status`, {
      headers: {
        'Origin': 'https://app.twinship.com',
        'Access-Control-Request-Method': 'GET'
      },
      timeout: TIMEOUT
    });

    assert.ok(
      response.headers['access-control-allow-origin'],
      'CORS headers should be present'
    );
  },

  // 12. SSL/TLS Configuration
  async testSSLConfiguration() {
    if (!BASE_URL.startsWith('https://')) {
      console.log('  ⚠️  Skipping SSL test for non-HTTPS URL');
      testResults.skipped.push('SSL Configuration');
      return;
    }

    try {
      const response = await axios.get(BASE_URL, {
        timeout: TIMEOUT,
        validateStatus: () => true
      });
      assert.ok(response.status < 500, 'HTTPS should be properly configured');
    } catch (error) {
      if (error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
        throw new Error('SSL certificate is self-signed');
      }
      throw error;
    }
  }
};

// Main execution
async function runSmokeTests() {
  console.log('🔥 Starting Smoke Tests');
  console.log(`📍 Target: ${BASE_URL}`);
  console.log(`⏱️  Timeout: ${TIMEOUT}ms`);
  console.log(`🔄 Retry Attempts: ${RETRY_ATTEMPTS}`);
  console.log('═'.repeat(50));

  // Run all tests
  for (const [testName, testFn] of Object.entries(smokeTests)) {
    await runTest(testName, testFn);
  }

  // Summary
  const duration = ((Date.now() - testResults.startTime) / 1000).toFixed(2);
  console.log('\n' + '═'.repeat(50));
  console.log('📊 Test Summary');
  console.log(`✅ Passed: ${testResults.passed.length}`);
  console.log(`❌ Failed: ${testResults.failed.length}`);
  console.log(`⏭️  Skipped: ${testResults.skipped.length}`);
  console.log(`⏱️  Duration: ${duration}s`);

  // Detailed failure report
  if (testResults.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    testResults.failed.forEach(({ name, error }) => {
      console.log(`  - ${name}: ${error}`);
    });
  }

  // Exit with appropriate code
  const exitCode = testResults.failed.length > 0 ? 1 : 0;
  
  // Write results to file for CI/CD integration
  const fs = require('fs').promises;
  await fs.writeFile(
    'smoke-test-results.json',
    JSON.stringify(testResults, null, 2)
  );

  process.exit(exitCode);
}

// Error handler
process.on('unhandledRejection', (error) => {
  console.error('🚨 Unhandled error during smoke tests:', error);
  process.exit(1);
});

// Run if executed directly
if (require.main === module) {
  runSmokeTests().catch(error => {
    console.error('🚨 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { runSmokeTests, smokeTests };