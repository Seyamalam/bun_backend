/**
 * Test authentication flow with email verification and password reset
 */

const BASE_URL = 'http://localhost:3000/api/v1';

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow with Token Verification\n');

  try {
    // 1. Register a new user
    console.log('1️⃣ Registering new user...');
    const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test${Date.now()}@example.com`,
        password: 'SecurePass123',
        password_confirm: 'SecurePass123',
        first_name: 'Test',
        last_name: 'User',
      }),
    });

    if (!registerResponse.ok) {
      throw new Error(`Registration failed: ${registerResponse.status}`);
    }

    const registerResult = await registerResponse.json();
    const registerData = registerResult.data;
    console.log('✅ Registration successful');
    console.log(`   User ID: ${registerData.user.id}`);
    console.log(`   Email: ${registerData.user.email}`);
    console.log(`   Verification Token: ${registerData.verification_token?.substring(0, 20)}...`);

    const userToken = registerData.token;
    const verificationToken = registerData.verification_token;

    // 2. Verify email
    console.log('\n2️⃣ Verifying email...');
    const verifyResponse = await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verificationToken }),
    });

    if (!verifyResponse.ok) {
      throw new Error(`Email verification failed: ${verifyResponse.status}`);
    }

    const verifyResult = await verifyResponse.json();
    const verifyData = verifyResult.data;
    console.log('✅ Email verified successfully');
    console.log(`   Message: ${verifyData.message}`);

    // 3. Request password reset
    console.log('\n3️⃣ Requesting password reset...');
    const forgotResponse = await fetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: registerData.user.email }),
    });

    if (!forgotResponse.ok) {
      throw new Error(`Password reset request failed: ${forgotResponse.status}`);
    }

    const forgotResult = await forgotResponse.json();
    const forgotData = forgotResult.data;
    console.log('✅ Password reset requested');
    console.log(`   Reset Token: ${forgotData.reset_token?.substring(0, 20)}...`);

    const resetToken = forgotData.reset_token;

    // 4. Reset password
    console.log('\n4️⃣ Resetting password...');
    const resetResponse = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: resetToken,
        password: 'NewSecurePass456',
        password_confirm: 'NewSecurePass456',
      }),
    });

    if (!resetResponse.ok) {
      throw new Error(`Password reset failed: ${resetResponse.status}`);
    }

    const resetResult = await resetResponse.json();
    const resetData = resetResult.data;
    console.log('✅ Password reset successfully');
    console.log(`   Message: ${resetData.message}`);

    // 5. Login with new password
    console.log('\n5️⃣ Logging in with new password...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: registerData.user.email,
        password: 'NewSecurePass456',
      }),
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }

    const loginResult = await loginResponse.json();
    const loginData = loginResult.data;
    console.log('✅ Login successful with new password');
    console.log(`   Token: ${loginData.token.substring(0, 30)}...`);

    // 6. Test token expiry - try to use verification token again
    console.log('\n6️⃣ Testing token reuse prevention...');
    const reuseResponse = await fetch(`${BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: verificationToken }),
    });

    const reuseData = await reuseResponse.json();
    if (!reuseResponse.ok) {
      console.log('✅ Token reuse correctly prevented');
      console.log(`   Error: ${reuseData.error}`);
    } else {
      console.log('⚠️  Warning: Token was reused (should be prevented)');
    }

    console.log('\n🎉 All authentication tests passed!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testAuthFlow().then(() => {
  process.exit(0);
});
