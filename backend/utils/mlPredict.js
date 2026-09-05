const path = require('path');
const fs = require('fs');
let ort;
try {
  ort = require('onnxruntime-node');
} catch {
  // Graceful fallback if onnxruntime-node is not installed
}

const onnxModelPath = path.join(__dirname, '..', 'models', 'priority_model.onnx');
const { sendAlert } = require('./notify');
let session = null;
// Runtime metrics for monitoring
const metrics = {
  predictionsTotal: 0,
  predictionErrors: 0,
  totalPredictionTimeMs: 0,
  avgPredictionTimeMs: 0,
  lastPredictionAt: null,
  lastPredictionLatencyMs: 0,
  modelLoadAttempts: 0,
  modelLoadSuccess: 0,
  lastModelLoadAt: null,
  lastModelLoadError: null,
  modelFileMtime: null,
  modelSizeBytes: null,
};

async function loadModel() {
  if (!ort || !fs.existsSync(onnxModelPath)) return null;
  metrics.modelLoadAttempts += 1;
  metrics.lastModelLoadAt = new Date().toISOString();
  if (!session) {
    try {
      session = await ort.InferenceSession.create(onnxModelPath);
      metrics.modelLoadSuccess += 1;
      try {
        const st = fs.statSync(onnxModelPath);
        metrics.modelFileMtime = st.mtime.toISOString();
        metrics.modelSizeBytes = st.size;
      } catch (error) {
        console.warn('Failed to read ONNX model metadata:', error.message);
      }
    } catch (e) {
      metrics.lastModelLoadError = e.message;
      console.warn("Failed to load ONNX model:", e.message);
    }
  }
  return session;
}

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
  [
    'error', 'login', 'payment', 'api', 'crash', 'performance', 'ui', 'database',
    'email', 'upload', 'download', 'auth', 'sso', 'security', 'rate-limit',
    'timeout', 'latency', 'outage', 'billing', 'invoice', 'permission', 'mfa',
    'token', 'webhook', 'sync', 'mobile', 'report', 'export', 'attachment'
  ].forEach((k) => {
    if (words.includes(k)) tags.add(k);
  });
  return Array.from(tags).slice(0, 6);
}

function estimateResolutionTime(priority) {
  switch (priority) {
    case 'Critical': return '4h-12h';
    case 'High': return '12h-48h';
    case 'Medium': return '2d-5d';
    default: return '1w';
  }
}

const PRIORITY_RANK = {
  Low: 0,
  Medium: 1,
  High: 2,
  Critical: 3,
};

const KEYWORD_RULES = [
  // Critical severity
  { priority: 'Critical', weight: 45, pattern: /\b(crash|crashes|crashed|kernel panic|panic|service down|system down|production down|outage|sev1|p1)\b/i },
  { priority: 'Critical', weight: 42, pattern: /\b(data loss|data corruption|security breach|unauthorized access|account takeover|ransomware)\b/i },
  { priority: 'Critical', weight: 38, pattern: /\b(payment failed|duplicate charge|billing failure|cannot process payment)\b/i },

  // High severity
  { priority: 'High', weight: 22, pattern: /\b(fail|fails|failed|failure|unable to|cannot|can't|won't)\b/i },
  { priority: 'High', weight: 18, pattern: /\b(timeout|timed out|latency|very slow|degraded|stuck|hangs|freezes)\b/i },
  { priority: 'High', weight: 18, pattern: /\b(login issue|login failed|mfa|sso|auth|authentication|permission denied|access denied)\b/i },
  { priority: 'High', weight: 16, pattern: /\b(api error|500|502|503|rate limit|webhook fail|sync fail)\b/i },

  // Medium severity
  { priority: 'Medium', weight: 14, pattern: /\b(intermittent|sometimes|occasionally|retry|delay|queued|slow)\b/i },
  { priority: 'Medium', weight: 12, pattern: /\b(ui issue|display|alignment|formatting|export issue|report mismatch)\b/i },

  // Low severity
  { priority: 'Low', weight: -12, pattern: /\b(cosmetic|minor|typo|enhancement|feature request|nice to have)\b/i },
];

function derivePriorityFromScore(score) {
  if (score >= 90) return 'Critical';
  if (score >= 48) return 'High';
  if (score >= 22) return 'Medium';
  return 'Low';
}

function maxPriority(a, b) {
  return PRIORITY_RANK[a] >= PRIORITY_RANK[b] ? a : b;
}

function runKeywordHeuristics(text, customerTier, sentiment) {
  const normalizedText = String(text || '').toLowerCase();
  let score = 5;
  let strongestPriority = 'Low';
  const matched = [];

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(normalizedText)) {
      score += rule.weight;
      strongestPriority = maxPriority(strongestPriority, rule.priority);
      matched.push(rule.priority);
    }
  }

  // Blast radius signals
  if (/\b(all users|multiple users|entire team|companywide|across organization|everyone)\b/i.test(normalizedText)) {
    score += 14;
    strongestPriority = maxPriority(strongestPriority, 'High');
  }
  if (/\b(single user|one user|specific user)\b/i.test(normalizedText)) {
    score -= 6;
  }

  // Customer tier impact
  if (/enterprise|enterprise customer|enterprise account/.test((customerTier || '').toLowerCase())) {
    score += 12;
    strongestPriority = maxPriority(strongestPriority, 'Medium');
  }

  // Sentiment signal
  if (sentiment === 'Angry') score += 8;
  if (sentiment === 'Frustrated') score += 4;
  if (sentiment === 'Happy') score -= 3;

  // Description depth
  score += Math.min(Math.floor(normalizedText.length / 80), 16);

  // Guardrail: crash/outage/security/data-loss + wide impact should always be Critical.
  const hardCritical = /\b(crash|outage|service down|system down|security breach|data loss|data corruption)\b/i.test(normalizedText)
    && /\b(all users|multiple users|companywide|across organization|production)\b/i.test(normalizedText);
  if (hardCritical) strongestPriority = 'Critical';

  score = Math.min(Math.max(score, 0), 100);
  const scorePriority = derivePriorityFromScore(score);
  const finalPriority = maxPriority(scorePriority, strongestPriority);
  const confidence = Math.min(96, Math.max(45, Math.round(48 + score * 0.48 + matched.length * 3)));

  return {
    priority: finalPriority,
    confidence,
    score,
    matchedCount: matched.length,
  };
}

function buildFallbackPrediction(text, customerTier, sentiment) {
  const heuristic = runKeywordHeuristics(text, customerTier, sentiment);

  return {
    priority: heuristic.priority,
    confidence: heuristic.confidence,
    sentiment,
    tags: extractTags(text),
    estimatedTime: estimateResolutionTime(heuristic.priority),
    reasoning: `Keyword heuristic score ${heuristic.score} with ${heuristic.matchedCount} priority signals`
  };
}

function normalizePredictedLabel(value) {
  const priorityMap = { 0: 'Critical', 1: 'High', 2: 'Medium', 3: 'Low' };
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber) && priorityMap[asNumber]) return priorityMap[asNumber];

  const asString = String(value || '').trim().toLowerCase();
  if (asString === 'critical') return 'Critical';
  if (asString === 'high') return 'High';
  if (asString === 'medium') return 'Medium';
  if (asString === 'low') return 'Low';

  return 'Medium';
}

async function predictPriority(title, description, customerTier) {
  const text = (title + ' ' + (description || '')).toLowerCase();
  const sentiment = detectSentiment(description);
  const heuristic = buildFallbackPrediction(text, customerTier, sentiment);

  // Fallback Rule-based if no model
  const sess = await loadModel();
  if (!sess) {
    return heuristic;
  }

  // ONNX Inference
  const sentimentScore = sentiment === 'Angry' ? 1.0 : sentiment === 'Happy' ? -1.0 : 0.0;
  const isEnterprise = /enterprise/.test((customerTier || '').toLowerCase()) ? 1.0 : 0.0;
  const hasCritical = ['crash', 'data loss', 'payment', 'security'].some(k => text.includes(k)) ? 1.0 : 0.0;
  const descLen = parseFloat(text.length);

  try {
    const inputTensor = new ort.Tensor('float32', Float32Array.from([sentimentScore, isEnterprise, hasCritical, descLen]), [1, 4]);
    const inputName = sess.inputNames[0] || 'float_input';
    const feeds = { [inputName]: inputTensor };
    const labelOutputName = sess.outputNames[0];
    const start = Date.now();
    const results = await sess.run(feeds, [labelOutputName]);
    const latency = Date.now() - start;
    metrics.predictionsTotal += 1;
    metrics.totalPredictionTimeMs += latency;
    metrics.avgPredictionTimeMs = Math.round(metrics.totalPredictionTimeMs / metrics.predictionsTotal);
    metrics.lastPredictionAt = new Date().toISOString();
    metrics.lastPredictionLatencyMs = latency;
    const labelOutput = results[labelOutputName];
    const rawLabel = labelOutput && labelOutput.data ? labelOutput.data[0] : undefined;
    const predictedPriority = normalizePredictedLabel(rawLabel);
    const finalPriority = maxPriority(predictedPriority, heuristic.priority);
    const finalConfidence = finalPriority === heuristic.priority
      ? Math.max(heuristic.confidence, 82)
      : 80;

    // Some skl2onnx models expose probability as a map/sequence output type,
    // which may be unsupported by onnxruntime-node in certain builds.
    // We fetch label output only and use a stable default confidence.
    const wasEscalated = finalPriority !== predictedPriority;

    const resultObj = {
      priority: finalPriority,
      confidence: finalConfidence,
      sentiment,
      tags: heuristic.tags,
      estimatedTime: estimateResolutionTime(finalPriority),
      reasoning: wasEscalated
        ? `ONNX predicted ${predictedPriority}; escalated to ${finalPriority} based on keyword severity`
        : `Predicted by ONNX Random Forest model (${labelOutputName})`
    };

    // Notify on high-severity detections
    try {
      if (resultObj.priority === 'Critical' && (resultObj.confidence || 0) >= 80) {
        sendAlert({ title, description: description || '', priority: resultObj.priority, confidence: resultObj.confidence });
      }
    } catch (error) { console.warn('Priority alert failed:', error.message); }

    return resultObj;

  } catch (err) {
    metrics.predictionErrors += 1;
    console.error("ONNX inference failed:", err);
    try {
      sendAlert({ title, description: description || '', priority: 'InternalError', confidence: 0, extra: `ONNX error: ${err && err.message}` });
    } catch (error) {
      console.warn('Model failure alert failed:', error.message);
    }
    const fallback = buildFallbackPrediction(text, customerTier, sentiment);
    return {
      ...fallback,
      reasoning: `${fallback.reasoning}; ONNX inference failed`
    };
  }
}

async function getModelHealth() {
  const modelExists = fs.existsSync(onnxModelPath);
  const runtimeAvailable = Boolean(ort);
  const sess = await loadModel();

  return {
    modelPath: onnxModelPath,
    modelExists,
    runtimeAvailable,
    modelLoaded: Boolean(sess),
    inputNames: sess ? sess.inputNames : [],
    outputNames: sess ? sess.outputNames : []
  };
}

function getModelMetrics() {
  return {
    ...metrics,
    modelPath: onnxModelPath,
    modelExists: fs.existsSync(onnxModelPath),
    runtimeAvailable: Boolean(ort),
  };
}

module.exports = { predictPriority, detectSentiment, extractTags, getModelHealth, getModelMetrics };
async function explainPrediction(title, description, customerTier) {
  const text = (title + ' ' + (description || '')).toLowerCase();
  const sentiment = detectSentiment(description);
  const heuristic = buildFallbackPrediction(text, customerTier, sentiment);

  // Attempt to read metadata
  const metaPath = path.join(__dirname, '..', 'models', 'priority_model.meta.json');
  let meta = null;
  try {
    if (fs.existsSync(metaPath)) {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    }
  } catch (error) {
    meta = null;
    console.warn('Failed to parse model metadata:', error.message);
  }

  const features = {
    sentiment_score: sentiment === 'Angry' ? 1.0 : sentiment === 'Happy' ? -1.0 : 0.0,
    is_enterprise: /enterprise/.test((customerTier || '').toLowerCase()) ? 1.0 : 0.0,
    has_critical: ['crash', 'data loss', 'payment', 'security'].some(k => text.includes(k)) ? 1.0 : 0.0,
    desc_len: parseFloat(text.length || 0),
  };

  let contributions = [];
  if (meta && Array.isArray(meta.importances)) {
    const totalImp = meta.importances.reduce((a, b) => a + b, 0) || 1;
    const names = meta.feature_names || Object.keys(features);
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const imp = meta.importances[i] || 0;
      const val = features[name] || 0;
      contributions.push({ feature: name, importance: imp, value: val, score: imp * val / totalImp });
    }
    contributions.sort((a, b) => Math.abs(b.score) - Math.abs(a.score));
  }

  return {
    input: { title, description, customerTier },
    sentiment,
    heuristic,
    features,
    contributions,
  };
}

module.exports = { predictPriority, detectSentiment, extractTags, getModelHealth, getModelMetrics, explainPrediction };
