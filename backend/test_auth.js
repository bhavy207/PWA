const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testAuth() {
    console.log('🔍 Testing Authentication Endpoints...\n');
    
    try {
        // Test 1: Login with demo user
        console.log('1. Testing login with demo user...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            email: 'user@demo.com',
            password: 'demo123'
        });
        
        if (loginResponse.status === 200) {
            console.log('✅ Login successful');
            console.log('   Token received:', loginResponse.data.token ? 'Yes' : 'No');
            console.log('   User data:', loginResponse.data.user ? 'Yes' : 'No');
        } else {
            console.log('❌ Login failed with status:', loginResponse.status);
        }
        
        // Test 2: Test protected route with token
        console.log('\n2. Testing protected route...');
        const token = loginResponse.data.token;
        const meResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (meResponse.status === 200) {
            console.log('✅ Protected route access successful');
            console.log('   User profile retrieved:', meResponse.data.user ? 'Yes' : 'No');
        } else {
            console.log('❌ Protected route failed with status:', meResponse.status);
        }
        
        // Test 3: Test registration with new user
        console.log('\n3. Testing registration...');
        const randomEmail = `test${Date.now()}@example.com`;
        const registerResponse = await axios.post(`${API_BASE_URL}/auth/register`, {
            name: 'Test User',
            email: randomEmail,
            password: 'test123456'
        });
        
        if (registerResponse.status === 201) {
            console.log('✅ Registration successful');
            console.log('   New user token received:', registerResponse.data.token ? 'Yes' : 'No');
        } else {
            console.log('❌ Registration failed with status:', registerResponse.status);
        }
        
        console.log('\n🎉 All authentication tests passed!');
        
    } catch (error) {
        console.log('\n❌ Error during testing:');
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Message:', error.response.data.message || 'No message');
        } else if (error.request) {
            console.log('   No response received. Is the server running?');
            console.log('   Error:', error.message);
        } else {
            console.log('   Error:', error.message);
        }
    }
}

testAuth();
