const path = require('path');
const fs = require('fs');
let ort;
try {
  ort = require('onnxruntime-node');
} catch (e) {
  // Graceful fallback if onnxruntime-node is not installed
}

const onnxModelPath = path.join(__dirname, '..', 'models', 'priority_model.onnx');
let session = null;

async function loadModel() {
  if (!ort || !fs.existsSync(onnxModelPath)) return null;
  if (!session) {
    try {
      session = await ort.InferenceSession.create(onnxModelPath);
    } catch (e) {
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
  ['error','login','payment','api','crash','performance','ui','database','email','upload','download','auth','sso','security','rate-limit'].forEach(k => { if (words.includes(k)) tags.add(k); });
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

function buildFallbackPrediction(text, customerTier, sentiment) {
  let score = 0;
  if (/enterprise|enterprise customer|enterprise account/.test((customerTier || '').toLowerCase())) score += 20;

  const isCritical = ['crash', 'data loss', 'payment', 'security', 'unauthorized', 'panic', 'deadlock'].some(k => text.includes(k));
  const isHigh = ['error', 'failed', 'timeout', 'broken', 'down', 'unable'].some(k => text.includes(k));

  if (isCritical) score += 30;
  else if (isHigh) score += 20;

  score += Math.min(Math.floor(text.length / 50), 20);
  score = Math.min(Math.max(score, 0), 100);

  let priority = 'Low';
  if (score >= 60) priority = 'Critical';
  else if (score >= 40) priority = 'High';
  else if (score >= 20) priority = 'Medium';

  return {
    priority,
    confidence: Math.min(Math.round(score * 0.8 + 10), 95),
    sentiment,
    tags: extractTags(text),
    estimatedTime: estimateResolutionTime(priority),
    reasoning: `Score ${score} from fallback heuristics`
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

  // Fallback Rule-based if no model
  const sess = await loadModel();
  if (!sess) {
    return buildFallbackPrediction(text, customerTier, sentiment);
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
    const results = await sess.run(feeds, [labelOutputName]);
    const labelOutput = results[labelOutputName];
    const rawLabel = labelOutput && labelOutput.data ? labelOutput.data[0] : undefined;
    const predictedPriority = normalizePredictedLabel(rawLabel);

    // Some skl2onnx models expose probability as a map/sequence output type,
    // which may be unsupported by onnxruntime-node in certain builds.
    // We fetch label output only and use a stable default confidence.
    const confidence = 80;
    
    return {
      priority: predictedPriority,
      confidence,
      sentiment,
      tags: extractTags(text),
      estimatedTime: estimateResolutionTime(predictedPriority),
      reasoning: `Predicted by ONNX Random Forest model (${labelOutputName})`
    };

  } catch (err) {
    console.error("ONNX inference failed:", err);
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

module.exports = { predictPriority, detectSentiment, extractTags, getModelHealth };
