require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const Team = require('../models/Team');
const Ticket = require('../models/Ticket');
const bcrypt = require('bcryptjs');

const run = async () => {
  await connectDB();
  try {
    await User.deleteMany();
    await Team.deleteMany();
    await Ticket.deleteMany();

    const salt = await bcrypt.genSalt(10);
    const admin = await User.create({ name: 'Admin User', email: 'admin@example.com', password: await bcrypt.hash('Admin1234', salt), role: 'admin' });
    const alice = await User.create({ name: 'Alice Agent', email: 'alice@example.com', password: await bcrypt.hash('Password1', salt), role: 'agent', expertise: ['api','database'] });
    const bob = await User.create({ name: 'Bob Support', email: 'bob@example.com', password: await bcrypt.hash('Password1', salt), role: 'agent', expertise: ['email','upload'] });

    const team1 = await Team.create({ name: 'Support', initials: 'SU', color: '#10b981', description: 'Support team', members: [{ user: bob._id, role: 'member' }, { user: alice._id, role: 'member' }], createdBy: admin._id });

    const t1 = await Ticket.create({ ticketId: 'TICK-1001', title: 'Login page not responding', description: 'Users report login failing', priority: 'Critical', status: 'Open', category: 'Bug', customerTier: 'Enterprise', assignee: alice._id, team: team1._id, createdBy: bob._id, sentiment: 'Frustrated', confidence: 90, estimatedTime: '4-8h', tags: ['login','auth'] });

    console.log('Seed complete. Admin user: admin@example.com / Admin1234');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
