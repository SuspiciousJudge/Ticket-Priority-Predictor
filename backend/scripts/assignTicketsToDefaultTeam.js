require('dotenv').config();

const mongoose = require('mongoose');
const Ticket = require('../models/Ticket');
const Team = require('../models/Team');

async function run() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ticketpro';
  await mongoose.connect(uri);

  const teams = await Team.find({}, { _id: 1, name: 1 }).sort({ createdAt: 1 }).lean();
  if (!teams.length) {
    throw new Error('No team found. Create at least one team first.');
  }

  const defaultTeam = teams.find((t) => String(t.name || '').toLowerCase() === 'support') || teams[0];

  const unassignedQuery = {
    $or: [
      { team: null },
      { team: { $exists: false } },
    ],
  };

  const totalBefore = await Ticket.countDocuments();
  const teamBefore = await Ticket.countDocuments({ team: defaultTeam._id });
  const unassignedBefore = await Ticket.countDocuments(unassignedQuery);

  const updateRes = await Ticket.updateMany(unassignedQuery, {
    $set: { team: defaultTeam._id },
  });

  const teamAfter = await Ticket.countDocuments({ team: defaultTeam._id });
  const unassignedAfter = await Ticket.countDocuments(unassignedQuery);

  console.log(JSON.stringify({
    defaultTeam: { id: String(defaultTeam._id), name: defaultTeam.name },
    totalBefore,
    teamBefore,
    unassignedBefore,
    matched: updateRes.matchedCount || 0,
    modified: updateRes.modifiedCount || 0,
    teamAfter,
    unassignedAfter,
  }, null, 2));

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error('Assign tickets failed:', err.message);
  try {
    await mongoose.disconnect();
  } catch (e) {
    // ignore
  }
  process.exit(1);
});
