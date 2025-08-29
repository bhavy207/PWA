const axios = require('axios');

async function testRegistration() {
  try {
    console.log('Testing registration API...');
    
    const response = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test User',
      email: 'test@example.com', 
      password: 'testpass123'
    });
    
    console.log('Registration successful:', response.data);
  } catch (error) {
    console.error('Registration failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Full error:', error.response?.data);
  }
}

testRegistration();
