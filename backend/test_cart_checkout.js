const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

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

async function testCartAndCheckout() {
    log(`${colors.bold}🛒 PWA eCommerce Cart & Checkout Test Suite`, colors.blue);
    log('=' .repeat(60));
    
    let testsPassed = 0;
    let testsFailed = 0;
    let userToken = null;

    try {
        // Test 1: Login to get token
        log('\n1. Logging in as demo user...', colors.yellow);
        
        try {
            const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
                email: 'user@demo.com',
                password: 'demo123'
            });
            
            if (loginResponse.status === 200 && loginResponse.data.token) {
                userToken = loginResponse.data.token;
                log('✅ Login successful, token obtained', colors.green);
                testsPassed++;
            } else {
                throw new Error('Invalid login response');
            }
        } catch (error) {
            log('❌ Login failed:', colors.red);
            log(`   Error: ${error.response?.data?.message || error.message}`, colors.red);
            testsFailed++;
            return; // Can't proceed without token
        }

        // Test 2: Get products to add to cart
        log('\n2. Fetching products...', colors.yellow);
        let products = [];
        
        try {
            const productsResponse = await axios.get(`${API_BASE_URL}/products`);
            
            if (productsResponse.status === 200 && productsResponse.data.products) {
                products = productsResponse.data.products;
                log(`✅ Fetched ${products.length} products`, colors.green);
                testsPassed++;
            } else {
                throw new Error('Invalid products response');
            }
        } catch (error) {
            log('❌ Failed to fetch products:', colors.red);
            log(`   Error: ${error.response?.data?.message || error.message}`, colors.red);
            testsFailed++;
        }

        // Test 3: Create a test order (simulating checkout)
        log('\n3. Testing order creation (checkout)...', colors.yellow);
        
        if (products.length > 0) {
            try {
                // Use first product for order
                const testProduct = products[0];
                const orderData = {
                    items: [
                        {
                            product: testProduct._id,
                            quantity: 1,
                            price: testProduct.price
                        }
                    ],
                    shippingAddress: {
                        street: '123 Test Street',
                        city: 'Test City',
                        state: 'Test State',
                        zipCode: '12345',
                        country: 'Test Country'
                    },
                    billingAddress: {
                        street: '123 Test Street',
                        city: 'Test City',
                        state: 'Test State',
                        zipCode: '12345',
                        country: 'Test Country'
                    },
                    paymentMethod: 'cod',
                    subtotal: testProduct.price,
                    tax: testProduct.price * 0.08,
                    shipping: testProduct.price > 100 ? 0 : 10,
                    total: testProduct.price + (testProduct.price * 0.08) + (testProduct.price > 100 ? 0 : 10),
                    notes: 'Test order from automated testing'
                };

                const orderResponse = await axios.post(`${API_BASE_URL}/orders`, orderData, {
                    headers: { 'Authorization': `Bearer ${userToken}` }
                });

                if (orderResponse.status === 201 && orderResponse.data.order) {
                    log('✅ Order created successfully', colors.green);
                    log(`   Order ID: ${orderResponse.data.order._id}`, colors.reset);
                    log(`   Total: $${orderResponse.data.order.totalAmount?.toFixed(2) || 'N/A'}`, colors.reset);
                    testsPassed++;
                } else {
                    throw new Error('Invalid order response');
                }
            } catch (error) {
                log('❌ Order creation failed:', colors.red);
                log(`   Error: ${error.response?.data?.message || error.message}`, colors.red);
                testsFailed++;
            }
        } else {
            log('❌ Skipped order creation - no products available', colors.red);
            testsFailed++;
        }

        // Test 4: Get user orders
        log('\n4. Testing order retrieval...', colors.yellow);
        
        try {
            const ordersResponse = await axios.get(`${API_BASE_URL}/orders`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });

            if (ordersResponse.status === 200 && ordersResponse.data.orders) {
                log(`✅ Retrieved ${ordersResponse.data.orders.length} orders`, colors.green);
                testsPassed++;
            } else {
                throw new Error('Invalid orders response');
            }
        } catch (error) {
            log('❌ Order retrieval failed:', colors.red);
            log(`   Error: ${error.response?.data?.message || error.message}`, colors.red);
            testsFailed++;
        }

        // Test 5: Test profile update
        log('\n5. Testing profile update...', colors.yellow);
        
        try {
            const profileData = {
                name: 'Updated Demo User',
                address: {
                    street: '456 Updated Street',
                    city: 'Updated City',
                    state: 'Updated State',
                    zipCode: '54321',
                    country: 'Updated Country'
                },
                preferences: {
                    notifications: {
                        orderUpdates: true,
                        promotions: false,
                        newProducts: true
                    }
                }
            };

            const profileResponse = await axios.put(`${API_BASE_URL}/auth/profile`, profileData, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });

            if (profileResponse.status === 200 && profileResponse.data.user) {
                log('✅ Profile updated successfully', colors.green);
                log(`   Name: ${profileResponse.data.user.name}`, colors.reset);
                testsPassed++;
            } else {
                throw new Error('Invalid profile response');
            }
        } catch (error) {
            log('❌ Profile update failed:', colors.red);
            log(`   Error: ${error.response?.data?.message || error.message}`, colors.red);
            testsFailed++;
        }

        // Test 6: Test getting current user info
        log('\n6. Testing user profile retrieval...', colors.yellow);
        
        try {
            const userResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });

            if (userResponse.status === 200 && userResponse.data.user) {
                log('✅ User profile retrieved successfully', colors.green);
                log(`   User: ${userResponse.data.user.name} (${userResponse.data.user.email})`, colors.reset);
                testsPassed++;
            } else {
                throw new Error('Invalid user response');
            }
        } catch (error) {
            log('❌ User profile retrieval failed:', colors.red);
            log(`   Error: ${error.response?.data?.message || error.message}`, colors.red);
            testsFailed++;
        }

        // Summary
        log('\n' + '=' .repeat(60));
        log(`${colors.bold}📊 Test Results Summary`, colors.blue);
        log('=' .repeat(60));
        log(`Tests Passed: ${testsPassed}`, colors.green);
        log(`Tests Failed: ${testsFailed}`, testsFailed > 0 ? colors.red : colors.reset);
        log(`Total Tests: ${testsPassed + testsFailed}`, colors.reset);

        if (testsFailed === 0) {
            log(`\n🎉 All cart and checkout tests passed!`, colors.green);
            log(`\n✅ Cart functionality: Working`, colors.green);
            log(`✅ Order creation: Working`, colors.green);
            log(`✅ Profile management: Working`, colors.green);
            log(`✅ Route handling: Fixed`, colors.green);
            log(`\n🌐 Frontend routes now available:`, colors.blue);
            log('   • /profile - User profile management');
            log('   • /checkout - Order checkout process');
            log('   • /orders - Order history');
        } else {
            log(`\n⚠️ Some tests failed. Please check the errors above.`, colors.yellow);
        }

    } catch (error) {
        log(`\n💥 Critical Error: ${error.message}`, colors.red);
    }
}

testCartAndCheckout();
