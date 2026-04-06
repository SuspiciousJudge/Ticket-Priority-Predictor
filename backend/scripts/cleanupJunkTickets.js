require('dotenv').config();

const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ticketpro';
  await mongoose.connect(uri);

  const before = await Ticket.countDocuments();
  const junkQuery = {
    $or: [
      { title: /^hiegvegfef$/i },
      { description: /^hiegvegfef$/i },
    ],
  };

  const junkBefore = await Ticket.countDocuments(junkQuery);
  const del = await Ticket.deleteMany(junkQuery);
  const after = await Ticket.countDocuments();
  const gnt = await Ticket.countDocuments({ ticketId: /^GNT-/ });

  console.log(JSON.stringify({
    before,
    junkBefore,
    deleted: del.deletedCount || 0,
    after,
    gnt,
  }, null, 2));

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Cleanup failed:', err.message);
  try {
    await mongoose.disconnect();
  } catch (e) {
    // ignore
  }
  process.exit(1);
});
