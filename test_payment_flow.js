const fetch = require('node-fetch');

// Test configuration
const API_BASE_URL = 'http://localhost:3000';
const PRODUCT_ID = '646663b1-8ef3-46dc-8784-977db848c758';
const USER_ID = '385690f1-b615-407c-9a04-a7da61ea0b5a';

// You need to get this token from your browser's developer tools:
// 1. Open the application in your browser
// 2. Open Developer Tools (F12)
// 3. Go to Application/Storage tab
// 4. Find the Supabase session in localStorage or cookies
// 5. Copy the access_token value
const ACCESS_TOKEN = 'YOUR_SUPABASE_ACCESS_TOKEN_HERE';

async function testPaymentFlow() {
  console.log('=== TESTING PAYMENT FLOW ===');
  console.log('Product ID:', PRODUCT_ID);
  console.log('User ID:', USER_ID);
  console.log('API Base URL:', API_BASE_URL);
  
  const orderData = {
    product_id: PRODUCT_ID,
    quantity: 1,
    payment_method: 'stripe', // Fixed: now using 'stripe' instead of 'currency'
    unit_price: 29.99,
    total_price: 29.99,
    green_points_used: 0,
    shipping_address: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      zip: '12345',
      country: 'US',
      full_name: 'Test User',
      phone: '+1234567890',
      email: 'test@example.com',
      additional_notes: 'Test order'
    }
  };

  try {
    console.log('\n=== SENDING ORDER REQUEST ===');
    console.log('Order Data:', JSON.stringify(orderData, null, 2));
    
    const response = await fetch(`${API_BASE_URL}/api/marketplace/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify(orderData)
    });

    console.log('\n=== RESPONSE RECEIVED ===');
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('\n=== RESPONSE BODY ===');
    console.log('Raw Response:', responseText);

    if (responseText) {
      try {
        const result = JSON.parse(responseText);
        console.log('\n=== PARSED RESPONSE ===');
        console.log('Parsed Result:', JSON.stringify(result, null, 2));
        
        if (response.ok) {
          console.log('\n✅ SUCCESS: Order created successfully!');
          if (result.payment_intent_id) {
            console.log('Payment Intent ID:', result.payment_intent_id);
          }
          if (result.client_secret) {
            console.log('Client Secret:', result.client_secret.substring(0, 20) + '...');
          }
        } else {
          console.log('\n❌ ERROR: Order creation failed');
          console.log('Error Details:', result);
        }
      } catch (parseError) {
        console.log('\n❌ JSON PARSE ERROR:', parseError.message);
        console.log('Raw response was:', responseText);
      }
    } else {
      console.log('\n❌ EMPTY RESPONSE');
    }

  } catch (error) {
    console.log('\n❌ REQUEST ERROR:', error.message);
    console.log('Full Error:', error);
  }
}

// Instructions for getting the access token
console.log('=== SETUP INSTRUCTIONS ===');
console.log('1. Open your browser and navigate to the application');
console.log('2. Log in to your account');
console.log('3. Open Developer Tools (F12)');
console.log('4. Go to the Console tab');
console.log('5. Run: localStorage.getItem("sb-" + Object.keys(localStorage).find(k => k.startsWith("sb-")).split("-")[1] + "-auth-token")');
console.log('6. Copy the access_token value from the result');
console.log('7. Replace YOUR_SUPABASE_ACCESS_TOKEN_HERE in this script');
console.log('8. Run: node test_payment_flow.js');
console.log('');

if (ACCESS_TOKEN === 'YOUR_SUPABASE_ACCESS_TOKEN_HERE') {
  console.log('⚠️  Please set your ACCESS_TOKEN first before running the test!');
} else {
  testPaymentFlow();
}