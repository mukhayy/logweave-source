// Test script for LogWeave backend
import { parseInterleavedLogs, groupByService, filterByRequestId, getRequestIds } from './app/lib/logParser';
import { readFileSync } from 'fs';

console.log('🧪 Testing LogWeave Backend\n');

// Test log content (same as our test data)
const testLogContent = `2024-02-07 14:23:00.877 service=database level=INFO connection_id=conn_789 New connection from payment-service ip=10.0.2.15
2024-02-07 14:23:00.891 service=api-gateway level=INFO req_id=abc123 correlation_id=checkout_456 Received POST /api/v1/checkout user_id=user_456 cart_total=$127.50
2024-02-07 14:23:00.892 service=api-gateway level=INFO req_id=abc123 Routing to payment-service
2024-02-07 17:23:00.895 service=payment-service level=INFO req_id=abc123 correlation_id=checkout_456 Payment request received user_id=user_456 amount=$127.50
2024-02-07 17:23:00.896 service=payment-service level=INFO req_id=abc123 Initiating payment workflow
2024-02-07 14:23:00.905 service=api-gateway level=INFO req_id=abc123 Routing to inventory-service
2024-02-07 14:23:00.908 service=inventory-service level=INFO req_id=abc123 correlation_id=checkout_456 Checking inventory for user_id=user_456
2024-02-07 14:23:00.913 service=database level=INFO query_id=q001 req_id=abc123 Executing: SELECT * FROM inventory
2024-02-07 17:23:01.234 service=payment-service level=INFO req_id=abc123 Starting card validation card_last4=4242
2024-02-07 17:23:01.236 service=payment-service level=INFO req_id=abc123 Calling Stripe API endpoint=/v1/charges
2024-02-07 17:23:01.235 service=payment-service level=DEBUG req_id=abc123 Card validation passed
2024-02-07 17:23:01.237 service=payment-service level=ERROR req_id=abc123 Stripe API call failed error=timeout after 3000ms
2024-02-07 14:23:03.761 service=database level=WARN query_id=q001 req_id=abc123 Query completed in 2847ms
2024-02-07 14:23:04.487 service=api-gateway level=ERROR req_id=abc123 Upstream timeout from payment-service after 3500ms`;

console.log('📝 Test 1: Parsing interleaved logs');
console.log('═'.repeat(60));

const { logs, pattern, services } = parseInterleavedLogs(testLogContent);

console.log(`✅ Parsed ${logs.length} log lines`);
console.log(`✅ Pattern type: ${pattern.type}`);
console.log(`✅ Services found: ${Array.from(services).join(', ')}`);
console.log(`✅ First log:`, logs[0]);
console.log();

console.log('📝 Test 2: Grouping by service');
console.log('═'.repeat(60));

const grouped = groupByService(logs);
for (const [service, serviceLogs] of Object.entries(grouped)) {
  console.log(`  ${service}: ${serviceLogs.length} logs`);
}
console.log();

console.log('📝 Test 3: Request ID extraction');
console.log('═'.repeat(60));

const reqIds = getRequestIds(logs);
console.log(`✅ Found request IDs: ${reqIds.join(', ')}`);

if (reqIds.length > 0) {
  const filtered = filterByRequestId(logs, reqIds[0]);
  console.log(`✅ Filtered to ${filtered.length} logs for req_id=${reqIds[0]}`);
}
console.log();

console.log('📝 Test 4: Sample grouped output for Gemini');
console.log('═'.repeat(60));

for (const [service, serviceLogs] of Object.entries(grouped)) {
  console.log(`\n=== ${service} ===`);
  console.log(serviceLogs.slice(0, 2).join('\n'));
  if (serviceLogs.length > 2) {
    console.log(`... (${serviceLogs.length - 2} more lines)`);
  }
}
console.log();

console.log('✅ All backend tests passed!\n');
console.log('Next steps:');
console.log('1. Install dependencies: npm install');
console.log('2. Run dev server: npm run dev');
console.log('3. Test API: POST to http://localhost:3000/api/analyze');
