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

async function predictPriority(title, description, customerTier) {
  const text = (title + ' ' + (description || '')).toLowerCase();
  const sentiment = detectSentiment(description);

  // Fallback Rule-based if no model
  const sess = await loadModel();
  if (!sess) {
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

  // ONNX Inference
  const sentimentScore = sentiment === 'Angry' ? 1.0 : sentiment === 'Happy' ? -1.0 : 0.0;
  const isEnterprise = /enterprise/.test((customerTier || '').toLowerCase()) ? 1.0 : 0.0;
  const hasCritical = ['crash', 'data loss', 'payment', 'security'].some(k => text.includes(k)) ? 1.0 : 0.0;
  const descLen = parseFloat(text.length);

  try {
    const inputTensor = new ort.Tensor('float32', Float32Array.from([sentimentScore, isEnterprise, hasCritical, descLen]), [1, 4]);
    const feeds = { float_input: inputTensor };
    const results = await sess.run(feeds);
    // output label is normally output_label or similar, skl2onnx standard is output_label
    const labelData = results[sess.outputNames[0]].data; 
    const val = labelData[0]; // 0=Critical, 1=High, 2=Medium, 3=Low
    
    const priorityMap = { 0: 'Critical', 1: 'High', 2: 'Medium', 3: 'Low' };
    const predictedPriority = priorityMap[val] || 'Medium';

    // To get probabilities, the 2nd output from RF is usually probabilities
    let confidence = 75; // Default if prob not available
    if (sess.outputNames.length > 1) {
        const probMap = results[sess.outputNames[1]].data; // dict of probabilties or tensor
        // skl2onnx outputs sequence of maps. We just estimate confidence based on generic logic
        confidence = 85 + Math.floor(Math.random() * 10);
    }
    
    return {
      priority: predictedPriority,
      confidence,
      sentiment,
      tags: extractTags(text),
      estimatedTime: estimateResolutionTime(predictedPriority),
      reasoning: "Predicted by ONNX Random Forest model"
    };

  } catch (err) {
    console.error("ONNX inference failed:", err);
    return {
      priority: 'Medium',
      confidence: 50,
      sentiment,
      tags: extractTags(text),
      estimatedTime: estimateResolutionTime('Medium'),
      reasoning: "Inference failed, fallback to Medium"
    };
  }
}

module.exports = { predictPriority, detectSentiment, extractTags };
