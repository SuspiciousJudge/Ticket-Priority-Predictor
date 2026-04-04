require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Ticket = require('../models/Ticket');
const User = require('../models/User');

const PRIORITY_MAP = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  1: 'Critical',
  2: 'High',
  3: 'Medium',
  4: 'Low',
};

const STATUS_MAP = {
  open: 'Open',
  opened: 'Open',
  new: 'Open',
  'in progress': 'In Progress',
  inprogress: 'In Progress',
  progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  done: 'Closed',
};

const TIER_MAP = {
  enterprise: 'Enterprise',
  business: 'Business',
  professional: 'Professional',
  premium: 'Premium',
  basic: 'Basic',
  free: 'Free',
};

const FIELD_ALIASES = {
  id: ['id', 'ticketId', 'ticket_id', 'incident_id', 'Incident_ID'],
  title: ['title', 'subject', 'summary', 'shortDescription', 'short_description', 'CI_Subcat', 'ci_subcat'],
  description: ['description', 'details', 'long_description', 'longDescription', 'CI_Name', 'ci_name'],
  priority: ['priority', 'Priority'],
  status: ['status', 'Status', 'alert_status', 'Alert_Status'],
  category: ['category', 'Category', 'CI_Cat', 'ci_cat'],
  customerTier: ['customerTier', 'customer_tier', 'tier', 'customerTierName', 'impact', 'Impact'],
  assignee: ['assignee', 'assignedTo', 'assigned_to', 'owner', 'agent'],
  createdAt: ['timestamp', 'createdAt', 'created_at', 'open_time', 'Open_Time'],
  resolutionTime: ['MTTR', 'resolutionTime', 'estimatedResolutionTime', 'Handle_Time_hrs', 'handle_time_hrs'],
  tags: ['tags', 'tag', 'labels', 'CI_Cat', 'Category'],
};

function normalizeKey(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function toLookup(row) {
  const lookup = new Map();
  for (const key of Object.keys(row || {})) {
    lookup.set(normalizeKey(key), row[key]);
  }
  return lookup;
}

function getByAliases(row, aliases) {
  if (!row) return undefined;
  for (const alias of aliases) {
    if (row[alias] !== undefined && row[alias] !== null && String(row[alias]).trim() !== '') {
      return row[alias];
    }
  }

  const lookup = toLookup(row);
  for (const alias of aliases) {
    const normalized = normalizeKey(alias);
    if (lookup.has(normalized)) {
      const value = lookup.get(normalized);
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return value;
      }
    }
  }

  return undefined;
}

function pick(obj, keys) {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && String(obj[key]).trim() !== '') {
      return obj[key];
    }
  }
  return undefined;
}

function toSafeString(value) {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function normalizePriority(value) {
  const raw = toSafeString(value).toLowerCase();
  if (/^p1$/.test(raw)) return 'Critical';
  if (/^p2$/.test(raw)) return 'High';
  if (/^p3$/.test(raw)) return 'Medium';
  if (/^p4$/.test(raw)) return 'Low';
  return PRIORITY_MAP[raw] || 'Medium';
}

function normalizeStatus(value) {
  const raw = toSafeString(value).toLowerCase();
  if (raw.includes('progress')) return 'In Progress';
  if (raw.includes('resolve')) return 'Resolved';
  if (raw.includes('close')) return 'Closed';
  if (raw.includes('open') || raw.includes('new') || raw.includes('assign') || raw.includes('pending')) return 'Open';
  return STATUS_MAP[raw] || 'Open';
}

function normalizeTier(value) {
  const raw = toSafeString(value).toLowerCase();
  if (raw === 'high') return 'Enterprise';
  if (raw === 'medium') return 'Business';
  if (raw === 'low') return 'Free';
  return TIER_MAP[raw] || 'Basic';
}

function parseTags(value) {
  if (Array.isArray(value)) return value.map(v => toSafeString(v)).filter(Boolean);
  const str = toSafeString(value);
  if (!str) return [];
  return str.split(/[|,;]/).map(v => v.trim()).filter(Boolean);
}

function parseDate(value) {
  if (!value) return new Date();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function parseNumber(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function ensureObjectIdIfValid(value) {
  const v = toSafeString(value);
  if (mongoose.Types.ObjectId.isValid(v)) return new mongoose.Types.ObjectId(v);
  return null;
}

function parseArgs() {
  const argPath = process.argv.find(arg => arg.startsWith('--file='));
  const explicitPath = argPath ? argPath.replace('--file=', '') : '';

  const candidatePaths = [
    explicitPath,
    path.join(__dirname, '..', 'data', 'tickets.json'),
    path.join(__dirname, '..', 'data', 'tickets.csv'),
    path.join(__dirname, '..', 'data', 'training_data.csv'),
    path.join(__dirname, '..', '..', 'data', 'tickets.json'),
    path.join(__dirname, '..', '..', 'data', 'tickets.csv'),
    path.join(__dirname, '..', '..', 'data', 'training_data.csv'),
  ].filter(Boolean);

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }

  return '';
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += ch;
  }

  values.push(current);
  return values.map((v) => v.trim());
}

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cols[idx] !== undefined ? cols[idx] : '';
    });
    rows.push(row);
  }

  return rows;
}

async function ensureAssigneeMap(rawRows) {
  const names = new Set();

  for (const row of rawRows) {
    const assigneeRaw = pick(row, ['assignee', 'assignedTo', 'owner', 'agent']);
    const assignee = toSafeString(assigneeRaw);
    if (assignee && !mongoose.Types.ObjectId.isValid(assignee)) {
      names.add(assignee);
    }
  }

  const map = new Map();
  if (names.size === 0) return map;

  for (const name of names) {
    const pseudoEmail = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@imported.local`;
    let user = await User.findOne({ email: pseudoEmail });
    if (!user) {
      user = await User.create({
        name,
        email: pseudoEmail,
        password: `imported_${Math.random().toString(36).slice(2)}_${Date.now()}`,
        role: 'agent',
      });
    }
    map.set(name, user._id);
  }

  return map;
}

function transformRow(row, assigneeMap) {
  const sourceId = toSafeString(getByAliases(row, FIELD_ALIASES.id));

  const rawTitle = toSafeString(getByAliases(row, FIELD_ALIASES.title));
  const rawDescription = toSafeString(getByAliases(row, FIELD_ALIASES.description));
  const categoryForTitle = toSafeString(getByAliases(row, FIELD_ALIASES.category));

  const title = rawTitle || (categoryForTitle ? `${categoryForTitle} Incident` : `Imported Ticket ${sourceId || Date.now()}`);
  const description = rawDescription || [
    toSafeString(getByAliases(row, ['WBS', 'wbs'])),
    toSafeString(getByAliases(row, ['Related_Interaction', 'related_interaction'])),
    toSafeString(getByAliases(row, ['Related_Change', 'related_change'])),
  ].filter(Boolean).join(' | ') || 'Imported from ML dataset';

  const rawAssignee = getByAliases(row, FIELD_ALIASES.assignee);
  const assigneeObjectId = ensureObjectIdIfValid(rawAssignee);
  const assignee = assigneeObjectId || assigneeMap.get(toSafeString(rawAssignee)) || undefined;

  const createdAt = parseDate(getByAliases(row, FIELD_ALIASES.createdAt));
  const resolutionTime = parseNumber(getByAliases(row, FIELD_ALIASES.resolutionTime));

  const tags = parseTags(getByAliases(row, FIELD_ALIASES.tags));
  const normalizedCategory = toSafeString(getByAliases(row, FIELD_ALIASES.category)) || 'Support';
  if (normalizedCategory && !tags.includes(normalizedCategory)) {
    tags.push(normalizedCategory);
  }

  return {
    ticketId: sourceId || `IMP-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    title,
    description,
    priority: normalizePriority(getByAliases(row, FIELD_ALIASES.priority)),
    status: normalizeStatus(getByAliases(row, FIELD_ALIASES.status)),
    category: normalizedCategory,
    customerTier: normalizeTier(getByAliases(row, FIELD_ALIASES.customerTier)),
    assignee,
    tags,
    resolutionTime,
    estimatedResolutionTime: resolutionTime,
    estimatedTime: resolutionTime !== undefined ? `${resolutionTime}h` : undefined,
    createdAt,
    updatedAt: createdAt,
  };
}

async function run() {
  const dataFile = parseArgs();
  if (!dataFile) {
    console.error('No dataset file found. Pass one explicitly: node scripts/importData.js --file=/absolute/path/to/tickets.json or .csv');
    process.exit(1);
  }

  const ext = path.extname(dataFile).toLowerCase();
  if (ext !== '.json' && ext !== '.csv') {
    console.error(`Unsupported dataset format: ${ext}. This importer supports JSON and CSV.`);
    process.exit(1);
  }

  await connectDB();

  let rawRows;
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    if (ext === '.json') {
      const parsed = JSON.parse(raw);
      rawRows = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.tickets) ? parsed.tickets : []);
    } else {
      rawRows = parseCsv(raw);
    }
  } catch (err) {
    console.error(`Failed to parse dataset ${ext.toUpperCase()}:`, err.message);
    process.exit(1);
  }

  if (!rawRows.length) {
    console.error('Dataset is empty or does not contain a top-level array / tickets array.');
    process.exit(1);
  }

  console.log(`Dataset loaded from: ${dataFile}`);
  console.log(`Rows detected: ${rawRows.length}`);

  const assigneeMap = await ensureAssigneeMap(rawRows);

  await Ticket.deleteMany({});
  console.log('Cleared existing tickets collection.');

  const transformed = rawRows.map(row => transformRow(row, assigneeMap));
  await Ticket.insertMany(transformed, { ordered: false });

  // Ensure indexes are created/updated after import.
  await Ticket.syncIndexes();

  const total = await Ticket.countDocuments();
  const byPriority = await Ticket.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]);
  const byCategory = await Ticket.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]);

  console.log('Import complete.');
  console.log(`Tickets imported: ${total}`);
  console.log('Priority distribution:', byPriority);
  console.log('Top categories:', byCategory);

  process.exit(0);
}

run().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
