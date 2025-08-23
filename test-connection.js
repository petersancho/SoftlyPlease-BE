require('dotenv').config();
const fetch = require('node-fetch');

async function testConnection() {
    const computeUrl = process.env.RHINO_COMPUTE_URL;
    const apiKey = process.env.RHINO_COMPUTE_KEY;
    
    console.log('🧪 Testing Rhino Compute Connection');
    console.log('=====================================');
    console.log('Compute URL:', computeUrl);
    console.log('API Key configured:', apiKey ? 'Yes' : 'No');
    console.log('');
    
    if (!computeUrl || computeUrl === 'http://your-azure-vm-ip:6500/') {
        console.log('❌ RHINO_COMPUTE_URL not configured properly');
        console.log('Please update your .env file with actual Azure VM IP');
        return;
    }
    
    try {
        // Test multiple authentication methods
        console.log('Testing basic connectivity...');
        const testMethods = [
            { name: 'No Auth', headers: {} },
            { name: 'Bearer Token', headers: { 'Authorization': `Bearer ${apiKey}` } },
            { name: 'RHINO_TOKEN', headers: { 'RHINO_TOKEN': apiKey } },
            { name: 'ApiKey Header', headers: { 'ApiKey': apiKey } },
            { name: 'X-API-Key', headers: { 'X-API-Key': apiKey } }
        ];

        for (const method of testMethods) {
            console.log(`\nTesting ${method.name}...`);
            try {
                const response = await fetch(`${computeUrl}version`, {
                    timeout: 10000,
                    headers: method.headers
                });

                console.log(`Status: ${response.status} ${response.statusText}`);

                if (response.ok) {
                    const versionData = await response.json();
                    console.log('✅ SUCCESS with', method.name);
                    console.log('Version info:', JSON.stringify(versionData, null, 2));
                    return; // Exit on first success
                } else {
                    const errorText = await response.text();
                    console.log('Response:', errorText);
                }
            } catch (err) {
                console.log('Error:', err.message);
            }
        }

        console.log('\n❌ All authentication methods failed');
        console.log('\nTroubleshooting tips:');
        console.log('1. Check if Azure VM is running');
        console.log('2. Verify IP address is correct');
        console.log('3. Ensure port 6500 is open in Azure firewall');
        console.log('4. Verify Rhino Compute service is running on the VM');
        console.log('5. Check the correct API key format in your Rhino Compute config');
        console.log('6. Verify the API key matches what\'s configured in Rhino Compute');
    } catch (error) {
        console.log('❌ Connection failed:', error.message);
        console.log('');
        console.log('Troubleshooting tips:');
        console.log('1. Check if Azure VM is running');
        console.log('2. Verify IP address is correct');
        console.log('3. Ensure port 6500 is open in Azure firewall');
        console.log('4. Verify Rhino Compute service is running on the VM');
        console.log('5. Check if API key is required and correct');
    }
}

// Run the test
testConnection().catch(console.error);
