/**
 * BioAge WebGL background shader
 * Ported from aliimam's web-gl-shader (21st.dev) — pure WebGL, no Three.js.
 *
 * Original uniforms preserved exactly:
 *   resolution · time · xScale · yScale · distortion
 *
 * The canvas is position:fixed at z-index:-1, rendering behind all page content.
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

  // ── Vertex shader ─────────────────────────────────────────
  var vert = mkShader(gl.VERTEX_SHADER, [
    'attribute vec3 position;',
    'void main() { gl_Position = vec4(position, 1.0); }'
  ].join('\n'));

  // ── Fragment shader (aliimam original) ────────────────────
  // Single chromatic-aberration sine wave split into R / G / B channels.
  // Black background, bright RGB line rendered at the screen centre.
  var frag = mkShader(gl.FRAGMENT_SHADER, [
    'precision highp float;',
    'uniform vec2  resolution;',
    'uniform float time;',
    'uniform float xScale;',
    'uniform float yScale;',
    'uniform float distortion;',
    '',
    'void main() {',
    '  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);',
    '',
    '  float d  = length(p) * distortion;',
    '',
    '  float rx = p.x * (1.0 + d);',
    '  float gx = p.x;',
    '  float bx = p.x * (1.0 - d);',
    '',
    '  float r = 0.05 / abs(p.y + sin((rx + time) * xScale) * yScale);',
    '  float g = 0.05 / abs(p.y + sin((gx + time) * xScale) * yScale);',
    '  float b = 0.05 / abs(p.y + sin((bx + time) * xScale) * yScale);',
    '',
    '  gl_FragColor = vec4(r, g, b, 1.0);',
    '}'
  ].join('\n'));

  if (!vert || !frag) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  // ── Full-screen quad (two triangles, vec3 positions) ─────
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1.0, -1.0, 0.0,
     1.0, -1.0, 0.0,
    -1.0,  1.0, 0.0,
     1.0, -1.0, 0.0,
    -1.0,  1.0, 0.0,
     1.0,  1.0, 0.0
  ]), gl.STATIC_DRAW);

  var posLoc = gl.getAttribLocation(prog, 'position');
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

  var uRes        = gl.getUniformLocation(prog, 'resolution');
  var uTime       = gl.getUniformLocation(prog, 'time');
  var uXScale     = gl.getUniformLocation(prog, 'xScale');
  var uYScale     = gl.getUniformLocation(prog, 'yScale');
  var uDistortion = gl.getUniformLocation(prog, 'distortion');

  // aliimam original default values
  gl.uniform1f(uXScale,     1.0);
  gl.uniform1f(uYScale,     0.5);
  gl.uniform1f(uDistortion, 0.05);

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
    t += 0.01;
    gl.uniform1f(uTime, t);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    requestAnimationFrame(loop);
  }
  loop();
})();
