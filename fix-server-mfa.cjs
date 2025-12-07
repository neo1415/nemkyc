// Quick script to fix MFA code in server.js
const fs = require('fs');

console.log('Reading server.js...');
let content = fs.readFileSync('server.js', 'utf8');

// Count comment blocks before
const openBefore = (content.match(/\/\*/g) || []).length;
const closeBefore = (content.match(/\*\//g) || []).length;
console.log(`Before: ${openBefore} open comments, ${closeBefore} close comments`);

// Find and close any unclosed comment blocks by adding */ before "// MFA code fully disabled"
if (content.includes('// MFA code fully disabled') && !content.includes('* ============================================================================ */\n    \n    // MFA code fully disabled')) {
  console.log('Closing MFA comment block...');
  content = content.replace(
    /\s+\/\/ MFA code fully disabled - proceeding with normal login/,
    '\n     *\n     * ============================================================================ */\n    \n    // MFA code fully disabled - proceeding with normal login'
  );
}

// Count comment blocks after
const openAfter = (content.match(/\/\*/g) || []).length;
const closeAfter = (content.match(/\*\//g) || []).length;
console.log(`After: ${openAfter} open comments, ${closeAfter} close comments`);

if (openAfter === closeAfter) {
  console.log('✅ Comment blocks are balanced!');
  fs.writeFileSync('server.js', content, 'utf8');
  console.log('✅ server.js fixed and saved!');
} else {
  console.log('❌ Comment blocks still unbalanced. Manual fix needed.');
  console.log(`Difference: ${openAfter - closeAfter} unclosed blocks`);
}
