const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

router.get('/locales', (req, res) => {
  const dir = path.join(__dirname, '..', 'locales');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const locales = files.map(f => ({ code: f.replace('.json',''), file: `/api/i18n/locale/${f.replace('.json','')}` }));
  res.json({ success: true, data: locales });
});

router.get('/locale/:code', (req, res) => {
  const code = req.params.code;
  const file = path.join(__dirname, '..', 'locales', `${code}.json`);
  if (!fs.existsSync(file)) return res.status(404).json({ success: false, message: 'Locale not found' });
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  res.json({ success: true, data });
});

module.exports = router;
