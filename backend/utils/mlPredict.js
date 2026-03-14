// Simple rule-based prediction for MVP
const keywordsPriority = {
  critical: ['crash', 'data loss', 'payment', 'security', 'unauthorized', 'panic', 'deadlock'],
  high: ['error', 'failed', 'timeout', 'broken', 'down', 'unable'],
  medium: ['slow', 'performance', 'issue', 'bug'],
  low: ['ui', 'typo', 'minor', 'cosmetic']
};

function detectSentiment(text = '') {
  const t = text.toLowerCase();
  if (t.includes('angry') || t.includes('furious') || t.includes('outraged')) return 'Angry';
  if (t.includes('frustrat') || t.includes('annoyed')) return 'Frustrated';
  if (t.includes('happy') || t.includes('thanks') || t.includes('great')) return 'Happy';
  return 'Neutral';
}

function extractTags(text = '') {
  const words = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  const tags = new Set();
  ['error','login','payment','api','crash','performance','ui','database','email','upload','download','auth','sso','security','rate-limit'].forEach(k => { if (words.includes(k)) tags.add(k); });
  return Array.from(tags).slice(0, 6);
}

function calculatePriorityScore(title = '', description = '', customerTier = '') {
  const text = (title + ' ' + (description || '')).toLowerCase();
  let score = 0;
  if (/enterprise|enterprise customer|enterprise account/.test(customerTier.toLowerCase())) score += 20;
  Object.entries(keywordsPriority).forEach(([level, keys]) => {
    keys.forEach(k => { if (text.includes(k)) score += level === 'critical' ? 30 : level === 'high' ? 20 : level === 'medium' ? 10 : 4; });
  });
  // length contributes slightly
  score += Math.min(Math.floor((title.length + description.length) / 50), 20);
  return Math.min(Math.max(score, 0), 100);
}

function getPriorityFromScore(score) {
  if (score >= 60) return 'Critical';
  if (score >= 40) return 'High';
  if (score >= 20) return 'Medium';
  return 'Low';
}

function estimateResolutionTime(priority) {
  switch (priority) {
    case 'Critical': return '4h-12h';
    case 'High': return '12h-48h';
    case 'Medium': return '2d-5d';
    default: return '1w';
  }
}

async function predictPriority(title, description, customerTier) {
  const score = calculatePriorityScore(title, description, customerTier || '');
  const priority = getPriorityFromScore(score);
  const confidence = Math.min(Math.round(score * 0.8 + 10), 95);
  return {
    priority,
    confidence,
    sentiment: detectSentiment(description),
    tags: extractTags(title + ' ' + description),
    estimatedTime: estimateResolutionTime(priority),
    reasoning: `Score ${score} from keyword and tier heuristics`
  };
}

module.exports = { predictPriority, detectSentiment, extractTags };
