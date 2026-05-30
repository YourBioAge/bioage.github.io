/**
 * BioAge WebGL hero shader
 * Adapted from aliimam's web-gl-shader (21st.dev).
 * Pure WebGL — no external dependencies.
 * Colors: navy #0D1B2A · teal #00E5CC · amber #FFB347
 *
 * The canvas is position:fixed at z-index:-1, so it renders
 * behind every page's content automatically.
 */
(function () {
  'use strict';

  var canvas = document.getElementById('bg-canvas');
  if (!canvas) return;

  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return; // graceful fallback — body background colour shows instead

  // ── Compile helper ────────────────────────────────────────
  function mkShader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  // ── Vertex shader — covers full clip space ────────────────
  var vert = mkShader(gl.VERTEX_SHADER, [
    'attribute vec2 a_pos;',
    'void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }'
  ].join('\n'));

  // ── Fragment shader — BioAge-branded chromatic wave ───────
  // Three sine-wave lines with chromatic-aberration-style x-offset.
  //   Wave 1 → teal  #00E5CC  (0.000, 0.898, 0.800)
  //   Wave 2 → amber #FFB347  (1.000, 0.702, 0.278)
  //   Wave 3 → white highlight (subtle depth)
  //   Background: navy #0D1B2A (0.051, 0.106, 0.165)
  var frag = mkShader(gl.FRAGMENT_SHADER, [
    'precision highp float;',
    'uniform vec2  u_res;',
    'uniform float u_t;',
    '',
    'void main() {',
    '  vec2 p = (gl_FragCoord.xy * 2.0 - u_res) / min(u_res.x, u_res.y);',
    '',
    '  float d  = length(p) * 0.07;',
    '  float x1 = p.x * (1.0 + d);',
    '  float x2 = p.x;',
    '  float x3 = p.x * (1.0 - d);',
    '',
    '  float w1 = 0.042 / abs(p.y        + sin((x1 + u_t * 0.62) * 1.45) * 0.38);',
    '  float w2 = 0.024 / abs(p.y + 0.22 + sin((x3 + u_t * 0.48) * 1.10) * 0.30);',
    '  float w3 = 0.014 / abs(p.y - 0.30 + sin((x2 + u_t * 0.38) * 1.72) * 0.20);',
    '',
    '  float r = 0.051 + 0.000*w1 + 1.000*w2 + 0.85*w3;',
    '  float g = 0.106 + 0.898*w1 + 0.702*w2 + 0.92*w3;',
    '  float b = 0.165 + 0.800*w1 + 0.278*w2 + 1.00*w3;',
    '',
    '  gl_FragColor = vec4(clamp(vec3(r, g, b), 0.0, 1.0), 1.0);',
    '}'
  ].join('\n'));

  if (!vert || !frag) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  // ── Full-screen quad (two triangles) ─────────────────────
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,   1, -1,   -1,  1,
     1, -1,   1,  1,   -1,  1
  ]), gl.STATIC_DRAW);

  var posLoc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, 'u_res');
  var uT   = gl.getUniformLocation(prog, 'u_t');

  // ── Resize — match canvas to viewport ────────────────────
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  }

  resize();
  window.addEventListener('resize', resize, { passive: true });

  // ── Render loop ───────────────────────────────────────────
  var t = 0;
  function loop() {
    t += 0.007;
    gl.uniform1f(uT, t);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(loop);
  }
  loop();
})();
