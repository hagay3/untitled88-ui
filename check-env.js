// Quick environment variable checker
console.log('🔍 Checking Auth0 Environment Variables:\n');

const requiredVars = [
  'NEXT_PUBLIC_AUTH0_DOMAIN',
  'NEXT_PUBLIC_AUTH0_CLIENT_ID', 
  'AUTH0_CLIENT_SECRET',
  'AUTH0_ISSUER',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET'
];

let allGood = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value ? '✅' : '❌ MISSING';
  const display = value ? 
    (varName.includes('SECRET') ? '[HIDDEN]' : value) : 
    'NOT SET';
  
  console.log(`${status} ${varName}: ${display}`);
  
  if (!value) allGood = false;
  
  // Check for common mistakes
  if (varName === 'AUTH0_ISSUER' && value) {
    if (!value.startsWith('https://')) {
      console.log(`   ⚠️  WARNING: Should start with https://`);
      allGood = false;
    }
  }
  
  if (varName === 'NEXT_PUBLIC_AUTH0_DOMAIN' && value) {
    if (value.startsWith('https://')) {
      console.log(`   ⚠️  WARNING: Should NOT have https://`);
      allGood = false;
    }
  }
});

console.log('\n' + (allGood ? '✅ All variables look good!' : '❌ Please fix the issues above'));

