const { spawn } = require('child_process');
const path = require('path');

async function runRetrain() {
  return new Promise((resolve, reject) => {
    const script = path.join(__dirname, '..', 'scripts', 'train.py');
    const py = process.env.PYTHON || 'python';
    const proc = spawn(py, [script], { cwd: path.join(__dirname, '..'), env: process.env });

    let out = '';
    let err = '';
    proc.stdout.on('data', (d) => { out += d.toString(); });
    proc.stderr.on('data', (d) => { err += d.toString(); });

    proc.on('close', (code) => {
      const result = { code, stdout: out.trim(), stderr: err.trim(), timestamp: new Date().toISOString() };
      if (code === 0) return resolve(result);
      return reject(new Error(`Retrain failed (code ${code}): ${err || out}`));
    });
    proc.on('error', (e) => reject(e));
  });
}

module.exports = { runRetrain };
