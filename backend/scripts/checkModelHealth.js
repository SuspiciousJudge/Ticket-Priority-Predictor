const { getModelHealth } = require('../utils/mlPredict');

async function main() {
  const health = await getModelHealth();
  console.log(JSON.stringify(health, null, 2));
}

main().catch((err) => {
  console.error('Model health check failed:', err);
  process.exit(1);
});
