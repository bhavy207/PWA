const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';
const FRONTEND_URL = 'http://localhost:5173';

// ANSI color codes for better output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

async function testFullAuthFlow() {
    log(`${colors.bold}🚀 PWA eCommerce Authentication Test Suite`, colors.blue);
    log('=' .repeat(60));
    
    let testsPassed = 0;
    let testsFailed = 0;
    
    try {
        // Test 1: Check if servers are running
        log('\n1. Checking Server Status...', colors.yellow);
        
        try {
            await axios.get(`${API_BASE_URL.replace('/api', '')}`);
            log('✅ Backend server is running on port 5000', colors.green);
            testsPassed++;
        } catch (error) {
            log('❌ Backend server is not responding', colors.red);
            testsFailed++;
        }
        
        try {
            await axios.get(FRONTEND_URL);
            log('✅ Frontend server is running on port 5173', colors.green);
            testsPassed++;
        } catch (error) {
            log('❌ Frontend server is not responding', colors.red);
            testsFailed++;
        }
        
        // Test 2: Test demo user login
        log('\n2. Testing Demo User Login...', colors.yellow);
        let demoUserToken = null;
        
        try {
            const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
                email: 'user@demo.com',
                password: 'demo123'
            });
            
            if (loginResponse.status === 200 && loginResponse.data.token) {
                demoUserToken = loginResponse.data.token;
                log('✅ Demo user login successful', colors.green);
                log(`   User: ${loginResponse.data.user.name} (${loginResponse.data.user.email})`, colors.reset);
                testsPassed++;
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            log('❌ Demo user login failed:', colors.red);
            log(`   Error: ${error.response?.data?.message || error.message}`, colors.red);
            testsFailed++;
        }
        
        // Test 3: Test demo admin login  
        log('\n3. Testing Demo Admin Login...', colors.yellow);
        let adminUserToken = null;
        
        try {
            const adminLoginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
                email: 'admin@demo.com',
                password: 'admin123'
            });
            
            if (adminLoginResponse.status === 200 && adminLoginResponse.data.token) {
                adminUserToken = adminLoginResponse.data.token;
                log('✅ Demo admin login successful', colors.green);
                log(`   Admin: ${adminLoginResponse.data.user.name} (${adminLoginResponse.data.user.role})`, colors.reset);
                testsPassed++;
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            log('❌ Demo admin login failed:', colors.red);
            log(`   Error: ${error.response?.data?.message || error.message}`, colors.red);
            testsFailed++;
        }
        
        // Test 4: Test protected route access
        log('\n4. Testing Protected Route Access...', colors.yellow);
        
        if (demoUserToken) {
            try {
                const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${demoUserToken}` }
                });
                
                if (meResponse.status === 200 && meResponse.data.user) {
                    log('✅ Protected route access successful', colors.green);
                    testsPassed++;
                } else {
                    throw new Error('Invalid response');
                }
            } catch (error) {
                log('❌ Protected route access failed:', colors.red);
                testsFailed++;
            }
        } else {
            log('❌ Skipped - no valid token available', colors.red);
            testsFailed++;
        }
        
        // Test 5: Test new user registration
        log('\n5. Testing New User Registration...', colors.yellow);
        const testEmail = `testuser${Date.now()}@example.com`;
        
        try {
            const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
                name: 'Test User',
                email: testEmail,
                password: 'test123456'
            });
            
            if (registerResponse.status === 201 && registerResponse.data.token) {
                log('✅ New user registration successful', colors.green);
                log(`   New User: ${registerResponse.data.user.name} (${registerResponse.data.user.email})`, colors.reset);
                testsPassed++;
            } else {
                throw new Error('Invalid response');
            }
        } catch (error) {
            log('❌ New user registration failed:', colors.red);
            log(`   Error: ${error.response?.data?.message || error.message}`, colors.red);
            testsFailed++;
        }
        
        // Test 6: Test duplicate email registration (should fail)
        log('\n6. Testing Duplicate Email Registration (should fail)...', colors.yellow);
        
        try {
            await axios.post(`${API_BASE_URL}/auth/register`, {
                name: 'Another Test User',
                email: 'user@demo.com', // Using existing email
                password: 'test123456'
            });
            
            log('❌ Duplicate email registration should have failed but succeeded', colors.red);
            testsFailed++;
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
                log('✅ Duplicate email registration correctly rejected', colors.green);
                testsPassed++;
            } else {
                log('❌ Unexpected error in duplicate email test:', colors.red);
                log(`   Error: ${error.response?.data?.message || error.message}`, colors.red);
                testsFailed++;
            }
        }
        
        // Test 7: Test invalid credentials login (should fail)
        log('\n7. Testing Invalid Credentials Login (should fail)...', colors.yellow);
        
        try {
            await axios.post(`${API_BASE_URL}/auth/login`, {
                email: 'user@demo.com',
                password: 'wrongpassword'
            });
            
            log('❌ Invalid credentials login should have failed but succeeded', colors.red);
            testsFailed++;
        } catch (error) {
            if (error.response?.status === 400 && error.response?.data?.message?.includes('Invalid credentials')) {
                log('✅ Invalid credentials login correctly rejected', colors.green);
                testsPassed++;
            } else {
                log('❌ Unexpected error in invalid credentials test:', colors.red);
                testsFailed++;
            }
        }
        
        // Summary
        log('\n' + '=' .repeat(60));
        log(`${colors.bold}📊 Test Results Summary`, colors.blue);
        log('=' .repeat(60));
        log(`Tests Passed: ${testsPassed}`, colors.green);
        log(`Tests Failed: ${testsFailed}`, testsFailed > 0 ? colors.red : colors.reset);
        log(`Total Tests: ${testsPassed + testsFailed}`, colors.reset);
        
        if (testsFailed === 0) {
            log(`\n🎉 All tests passed! Authentication system is working correctly.`, colors.green);
            log(`\n🌐 You can now access the application at: ${FRONTEND_URL}`, colors.blue);
            log('📝 Demo accounts available:');
            log('   • User: user@demo.com / demo123');
            log('   • Admin: admin@demo.com / admin123');
        } else {
            log(`\n⚠️  Some tests failed. Please check the errors above.`, colors.yellow);
        }
        
    } catch (error) {
        log(`\n💥 Critical Error: ${error.message}`, colors.red);
    }
}

testFullAuthFlow();
