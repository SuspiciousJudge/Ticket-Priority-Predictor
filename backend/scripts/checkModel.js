const { predictPriority } = require('../utils/mlPredict');

async function main() {
  const result = await predictPriority(
    'Payment API crash in production',
    'Enterprise customer reports security error, payment failure and data loss after deployment.',
    'Enterprise'
  );

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error('Model check failed:', err);
  process.exit(1);
});
