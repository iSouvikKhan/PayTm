const mongoose = require("mongoose");

/**
 * Connects to MongoDB and warns when the server is not a replica set: transfers and sign-ups
 * use multi-document transactions, which MongoDB only supports on replica sets and sharded
 * clusters (MongoDB Atlas clusters are replica sets).
 */
async function connectDatabase(uri, logger = console) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  try {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    if (!hello.setName && hello.msg !== "isdbgrid") {
      logger.warn(
        "MongoDB is running as a standalone server. Transfers need a replica set: " +
          "see 'MongoDB replica set' in the README.",
      );
    }
  } catch (err) {
    logger.warn(`Could not check the MongoDB topology: ${err.message}`);
  }
  return mongoose.connection;
}

async function disconnectDatabase() {
  await mongoose.disconnect();
}

module.exports = { connectDatabase, disconnectDatabase };
