const { loadConfig } = require("./config");
const { createApp } = require("./app");
const { connectDatabase, disconnectDatabase } = require("./db");

async function main() {
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  try {
    await connectDatabase(config.MONGODB_URI);
  } catch (err) {
    console.error(`Could not connect to MongoDB at the configured MONGODB_URI: ${err.message}`);
    process.exit(1);
  }

  const server = createApp(config).listen(config.PORT, () => {
    console.log(`PayTm API listening on http://localhost:${config.PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close();
    await disconnectDatabase();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main();
