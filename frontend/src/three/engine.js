/* eslint-disable */
// Motor 3D de People Damm (three.js r128).
// Les escenes (La Plaça i Damm World) es construeixen una sola vegada i es reutilitzen.
// Els personatges són il·lustratius: no representen cap persona real.
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { DAMM_BEERS } from '../data/beers';

var RM = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var renderer = null;
var MAXANI = 8;
// densitat de píxel màxima: per sobre d'1,5 la diferència gairebé no es veu i el cost es dispara (2× = 4 vegades més píxels)
var MAXPR = 1.5;
var SMALL = typeof window !== 'undefined' && Math.min(window.innerWidth, window.innerHeight) < 700;
var pmrem = null;

// ---------- utilitats ----------
var seed = 11;
function rnd(){ seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
function rr(a, b){ return a + rnd() * (b - a); }
function pick(a){ return a[Math.floor(rnd() * a.length)]; }
function V(x, y, z){ return new THREE.Vector3(x, y, z); }
function shade(hex, l){ var c = new THREE.Color(hex); c.offsetHSL(0, 0, l); return '#' + c.getHexString(); }

function makeTex(w, h, draw, rx, ry){
  var c = document.createElement('canvas'); c.width = w; c.height = h;
  var g = c.getContext('2d'); draw(g, w, h);
  var t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx || 1, ry || 1);
  t.encoding = THREE.sRGBEncoding; t.anisotropy = MAXANI;
  return t;
}
function rep(tex, rx, ry){ var t = tex.clone(); t.needsUpdate = true; t.repeat.set(rx, ry); return t; }
function speckle(g, w, h, n, cols, amax){
  amax = amax || .08;
  for (var i = 0; i < n; i++) { g.globalAlpha = rnd() * amax + .015; g.fillStyle = cols[i % cols.length]; g.fillRect(rnd() * w, rnd() * h, rnd() * 3 + 1, rnd() * 3 + 1); }
  g.globalAlpha = 1;
}
function rrect(g, x, y, w, h, r){ g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }

var GC = {};
function geoBox(w, h, d){ var k = 'b' + w + ',' + h + ',' + d; return GC[k] || (GC[k] = new THREE.BoxGeometry(w, h, d)); }
var MC = {};
function std(c, r, m, ex){
  var k = c + '|' + (r == null ? .8 : r) + '|' + (m || 0) + '|' + (ex ? JSON.stringify(ex) : '');
  if (!MC[k]) MC[k] = new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: r == null ? .8 : r, metalness: m || 0 }, ex || {}));
  return MC[k];
}
function mesh(geo, mat, x, y, z, parent, cast, recv){
  var m = new THREE.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0);
  m.castShadow = cast !== false; m.receiveShadow = recv !== false;
  if (parent) parent.add(m); return m;
}
function bx(w, h, d, mat, x, y, z, p, cast, recv){ return mesh(geoBox(w, h, d), mat, x, y, z, p, cast, recv); }

// ---------- textures ----------
var T = {};
function buildTextures(){
  T.cobble = makeTex(512, 512, function(g, w, h){
    g.fillStyle = '#8C7D66'; g.fillRect(0, 0, w, h);
    var rows = 14, cols = 10, cw = w / cols, ch = h / rows;
    var tones = ['#CDB998', '#C2AD8C', '#D6C4A4', '#B9A587', '#C9B493', '#BBA98D', '#D1BFA0'];
    for (var r = 0; r < rows; r++) {
      var off = (r % 2) * cw / 2;
      for (var c = -1; c <= cols; c++) {
        var x = c * cw + off + (rnd() - .5) * 4, y = r * ch + (rnd() - .5) * 3, base = pick(tones);
        var gr = g.createLinearGradient(x, y, x + cw * .4, y + ch);
        gr.addColorStop(0, shade(base, .07)); gr.addColorStop(1, shade(base, -.09));
        g.fillStyle = gr; rrect(g, x + 2.5, y + 2.5, cw - 5, ch - 5, 8); g.fill();
      }
    }
    speckle(g, w, h, 9000, ['#000', '#fff'], .09);
  }, 20, 17);
  T.grass = makeTex(256, 256, function(g, w, h){ g.fillStyle = '#6EA24A'; g.fillRect(0, 0, w, h); speckle(g, w, h, 14000, ['#4E8433', '#8CC461', '#5E9A3F', '#A2CF78', '#3F6F28'], .35); }, 24, 24);
  T.tiles = makeTex(256, 256, function(g, w, h){
    g.fillStyle = '#7E3A22'; g.fillRect(0, 0, w, h);
    var rows = 8, cols = 8;
    for (var r = 0; r < rows; r++) for (var c = -1; c <= cols; c++) {
      var x = c * w / cols + (r % 2) * w / cols / 2, y = r * h / rows;
      var gr = g.createLinearGradient(x, y, x, y + h / rows);
      gr.addColorStop(0, pick(['#CC6C43', '#C46440', '#D07A4E'])); gr.addColorStop(1, '#86391F');
      g.fillStyle = gr; g.beginPath(); g.ellipse(x + w / cols / 2, y + h / rows * .55, w / cols * .5, h / rows * .6, 0, 0, Math.PI * 2); g.fill();
    }
    speckle(g, w, h, 3000, ['#000', '#fff'], .08);
  }, .35, .35);
  T.brick = makeTex(256, 256, function(g, w, h){
    g.fillStyle = '#D8CBB5'; g.fillRect(0, 0, w, h);
    var rows = 16, bw = 32, bh = h / rows;
    for (var r = 0; r < rows; r++) for (var c = -1; c < w / bw + 1; c++) {
      var x = c * bw + (r % 2) * bw / 2; g.fillStyle = pick(['#A8452F', '#B5523A', '#9B3F2B', '#B85D40', '#A04A33', '#AE5038']);
      g.fillRect(x + 1.5, r * bh + 1.5, bw - 3, bh - 3);
    }
    speckle(g, w, h, 4000, ['#000', '#fff'], .1);
  }, 1, 1);
  T.asphalt = makeTex(256, 256, function(g, w, h){ g.fillStyle = '#4A4E56'; g.fillRect(0, 0, w, h); speckle(g, w, h, 12000, ['#2E3138', '#6C717B', '#5A5E66'], .4); }, 10, 10);
  T.metal = makeTex(256, 128, function(g, w, h){
    for (var x = 0; x < w; x += 8) { var gr = g.createLinearGradient(x, 0, x + 8, 0); gr.addColorStop(0, '#E7EAEE'); gr.addColorStop(.5, '#C4CAD2'); gr.addColorStop(1, '#F1F3F5'); g.fillStyle = gr; g.fillRect(x, 0, 8, h); }
    speckle(g, w, h, 1500, ['#000'], .05);
  }, 1, 1);
  T.earth = makeTex(256, 128, function(g, w, h){
    var bands = ['#7C5A3A', '#6B4B30', '#8A6644', '#5E4129', '#73523A', '#4F3622'];
    var y = 0; while (y < h) { var bh = rr(8, 22); g.fillStyle = pick(bands); g.fillRect(0, y, w, bh); y += bh; }
    speckle(g, w, h, 6000, ['#000', '#C9A27A'], .25);
    g.fillStyle = '#5E9A3F'; g.fillRect(0, 0, w, 7);
  }, 6, 1);
  T.shutter = makeTex(64, 128, function(g, w, h){ g.fillStyle = '#3E6A4A'; g.fillRect(0, 0, w, h); for (var y = 0; y < h; y += 8) { g.fillStyle = '#2C4F37'; g.fillRect(0, y + 5, w, 3); g.fillStyle = '#5F8F68'; g.fillRect(0, y, w, 1.5); } g.strokeStyle = '#26402E'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4); });
  T.rail = makeTex(256, 64, function(g, w, h){ g.clearRect(0, 0, w, h); g.fillStyle = '#1E1E22'; g.fillRect(0, 0, w, 5); g.fillRect(0, h - 4, w, 4); for (var x = 3; x < w; x += 12) g.fillRect(x, 0, 2.5, h); g.strokeStyle = '#1E1E22'; g.lineWidth = 2.2; for (var x2 = 3; x2 < w; x2 += 24) { g.beginPath(); g.arc(x2 + 12, h / 2, 7, 0, Math.PI * 2); g.stroke(); } });
  T.awning = function(col){ return makeTex(128, 64, function(g, w, h){ for (var x = 0; x < w; x += 16) { g.fillStyle = (x / 16) % 2 ? '#F6F1E8' : col; g.fillRect(x, 0, 16, h); } var gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,.12)'); gr.addColorStop(1, 'rgba(0,0,0,.18)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }, 2, 1); };
  T.curtain = makeTex(256, 128, function(g, w, h){ for (var x = 0; x < w; x += 2) { var v = .5 + .5 * Math.sin(x / 9); g.fillStyle = 'rgb(' + Math.round(120 + v * 90) + ',' + Math.round(10 + v * 14) + ',' + Math.round(28 + v * 18) + ')'; g.fillRect(x, 0, 2, h); } }, 1, 1);
  T.office = makeTex(256, 512, function(g, w, h){
    g.fillStyle = '#1D2A3A'; g.fillRect(0, 0, w, h);
    var cols = 12, rows = 30, cw = w / cols, ch = h / rows;
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      var lit = rnd() < .22; var gr = g.createLinearGradient(0, r * ch, 0, r * ch + ch);
      if (lit) { gr.addColorStop(0, '#FFE2A6'); gr.addColorStop(1, '#F2B866'); } else { gr.addColorStop(0, '#5B7A99'); gr.addColorStop(1, '#2F4660'); }
      g.fillStyle = gr; g.fillRect(c * cw + 2, r * ch + 2, cw - 4, ch - 5);
    }
  }, 1, 1);
  T.soft = makeTex(128, 128, function(g){ var r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.45, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
  T.glow = makeTex(128, 128, function(g){ var r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,248,214,1)'); r.addColorStop(.25, 'rgba(255,214,120,.85)'); r.addColorStop(1, 'rgba(255,190,80,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
  T.rays = makeTex(256, 256, function(g){ g.translate(128, 128); for (var i = 0; i < 12; i++) { g.rotate(Math.PI / 6); var gr = g.createLinearGradient(0, 0, 0, -128); gr.addColorStop(0, 'rgba(255,220,130,.8)'); gr.addColorStop(1, 'rgba(255,220,130,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(-7, -30); g.lineTo(7, -30); g.lineTo(2, -126); g.lineTo(-2, -126); g.closePath(); g.fill(); } });
  T.bang = makeTex(128, 128, function(g){ g.fillStyle = '#B08A45'; g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.stroke(); g.fillStyle = '#fff'; g.font = '800 84px Figtree, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', 64, 70); });
  T.barrier = makeTex(128, 32, function(g, w, h){ for (var x = -32; x < w + 32; x += 32) { g.fillStyle = '#F26A1B'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 16, 0); g.lineTo(x + 32, h); g.lineTo(x + 16, h); g.closePath(); g.fill(); } g.globalCompositeOperation = 'destination-over'; g.fillStyle = '#FFFFFF'; g.fillRect(0, 0, w, h); }, 4, 1);
}
function textTex(text, o){
  o = o || {}; var w = o.w || 512, h = o.h || 128;
  return makeTex(w, h, function(g){
    g.fillStyle = o.bg || '#C8102E'; g.fillRect(0, 0, w, h);
    if (o.border) { g.strokeStyle = o.border; g.lineWidth = 8; g.strokeRect(8, 8, w - 16, h - 16); }
    g.fillStyle = o.fg || '#fff'; g.font = o.font || '800 64px Figtree, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2 + 3);
  });
}
function stucco(col, rx){
  return makeTex(256, 256, function(g, w, h){
    g.fillStyle = col; g.fillRect(0, 0, w, h); speckle(g, w, h, 7000, ['#000', '#fff'], .07);
    for (var i = 0; i < 6; i++) { var x = rnd() * w; var gr = g.createLinearGradient(x, 0, x, h); gr.addColorStop(0, 'rgba(90,60,30,0)'); gr.addColorStop(1, 'rgba(90,60,30,.07)'); g.fillStyle = gr; g.fillRect(x, 0, rr(8, 30), h); }
    var b = g.createLinearGradient(0, 0, 0, h); b.addColorStop(.75, 'rgba(70,50,30,0)'); b.addColorStop(1, 'rgba(70,50,30,.16)'); g.fillStyle = b; g.fillRect(0, 0, w, h);
  }, rx || 1, 1);
}

// ---------- entorn ----------
function skyDome(scene, top, bottom){
  var m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color(top) }, bottom: { value: new THREE.Color(bottom) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = clamp(vP.y * 1.5 + 0.06, 0.0, 1.0); gl_FragColor = vec4(mix(bottom, top, pow(h, 0.75)), 1.0); }'
  });
  var s = new THREE.Mesh(new THREE.SphereGeometry(600, 32, 16), m); scene.add(s); return s;
}

function envFrom(top, bottom){ var es = new THREE.Scene(); skyDome(es, top, bottom); var g = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshBasicMaterial({ color: bottom })); g.rotation.x = -Math.PI / 2; g.position.y = -20; es.add(g); return pmrem.fromScene(es, .04).texture; }
function sunLight(scene, pos, ext, intensity, map){
  scene.add(new THREE.HemisphereLight(0xDCEBFF, 0x9A7A58, .45));
  var d = new THREE.DirectionalLight(0xFFEBD0, intensity || 1.9); d.position.set(pos[0], pos[1], pos[2]);
  d.castShadow = true; d.shadow.mapSize.set(map || 2048, map || 2048);
  var c = d.shadow.camera; c.left = -ext; c.right = ext; c.top = ext; c.bottom = -ext; c.near = 1; c.far = 260;
  d.shadow.bias = -0.0004; d.shadow.normalBias = 0.035; d.shadow.radius = 3;
  scene.add(d); return d;
}

// ---------- personatges ----------
var BOTTLE = {
  glass: new THREE.LatheGeometry([[0, 0], [.044, 0], [.05, .012], [.05, .16], [.046, .19], [.024, .24], [.019, .3], [.022, .305], [0, .305]].map(function(p){ return new THREE.Vector2(p[0], p[1]); }), 18),
  label: new THREE.CylinderGeometry(.0515, .0515, .075, 18, 1, true),
  neck: new THREE.CylinderGeometry(.0215, .0235, .03, 14, 1, true),
  cap: new THREE.CylinderGeometry(.024, .024, .014, 14),
  glassM: std('#5A2A0C', .12, .15),
  labelM: std('#C8102E', .55),
  capM: std('#D9A93A', .3, .7)
};
function mii(o){
  // a Damm World els personatges es veuen petits: amb ~40 % dels segments no es nota i estalvia molts triangles
  var sg = o.lo ? function(n){ return Math.max(5, Math.round(n * .4)); } : function(n){ return n; };
  var g = new THREE.Group();
  var skin = std(o.skin, .55), shirt = std(o.shirt, .78), pants = std(o.pants || '#2B3346', .85);
  var hairM = std(o.hair || '#2E1F17', .65, 0, { side: THREE.DoubleSide });
  var dark = std('#18141C', .25), shoe = std('#2A2522', .45);
  var P = {};
  [-1, 1].forEach(function(s){
    var hip = new THREE.Group(); hip.position.set(s * .09, .46, 0); g.add(hip);
    mesh(new THREE.CylinderGeometry(.075, .065, .42, sg(12)), pants, 0, -.21, 0, hip);
    mesh(new THREE.SphereGeometry(.085, sg(14), sg(10)), shoe, 0, -.43, .04, hip).scale.set(1, .62, 1.5);
    if (s < 0) P.hipL = hip; else P.hipR = hip;
  });
  var prof = [[0, .42], [.165, .43], [.205, .52], [.2, .7], [.172, .85], [.1, .93], [0, .955]].map(function(p){ return new THREE.Vector2(p[0], p[1]); });
  P.body = mesh(new THREE.LatheGeometry(prof, sg(28)), shirt, 0, 0, 0, g);
  // en mode lleuger (Damm World) ometem els detalls minúsculs: cadascun seria una crida de dibuix més per personatge
  if (o.logo && !o.lo) {
    var lightShirt = ['#F4EFE6', '#FFFFFF', '#F4F5F7', '#B08A45'].indexOf(o.shirt) >= 0;
    mesh(new THREE.CylinderGeometry(.205, .207, .1, sg(24), 1, true, -.66, 1.32), new THREE.MeshStandardMaterial({ map: logoTex(lightShirt ? '#C8102E' : '#FFFFFF'), transparent: true, roughness: .7, depthWrite: false }), 0, .69, 0, g, false, false);
  }
  if (o.vest) { mesh(new THREE.CylinderGeometry(.207, .207, .05, sg(28), 1, true), std('#E8ECEF', .25, .5), 0, .62, 0, g, false); mesh(new THREE.CylinderGeometry(.203, .203, .05, sg(28), 1, true), std('#E8ECEF', .25, .5), 0, .74, 0, g, false); }
  [-1, 1].forEach(function(s){
    var sh = new THREE.Group(); sh.position.set(s * .215, .865, 0); sh.rotation.z = s * .12; g.add(sh);
    mesh(new THREE.CylinderGeometry(.056, .048, .36, sg(12)), shirt, 0, -.18, 0, sh);
    mesh(new THREE.SphereGeometry(.058, sg(12), sg(10)), skin, 0, -.39, 0, sh);
    if (s < 0) P.shL = sh; else P.shR = sh;
  });
  if (o.beer) {
    // ampolla de vidre marró amb etiqueta vermella i xapa daurada (geometria compartida entre tots els personatges)
    var bg = new THREE.Group(); bg.position.set(0, -.5, .02); P.shR.add(bg);
    mesh(BOTTLE.glass, BOTTLE.glassM, 0, 0, 0, bg, false);
    mesh(BOTTLE.label, BOTTLE.labelM, 0, .1, 0, bg, false);
    mesh(BOTTLE.neck, BOTTLE.labelM, 0, .245, 0, bg, false);
    mesh(BOTTLE.cap, BOTTLE.capM, 0, .307, 0, bg, false);
    P.beer = bg;
  }
  mesh(new THREE.CylinderGeometry(.055, .062, .08, sg(12)), skin, 0, .97, 0, g);
  var head = new THREE.Group(); head.position.y = 1.245; g.add(head); P.head = head;
  mesh(new THREE.SphereGeometry(.27, sg(36), sg(28)), skin, 0, 0, 0, head).scale.set(1, 1.04, .97);
  [-1, 1].forEach(function(s){
    mesh(new THREE.SphereGeometry(.06, sg(12), sg(10)), skin, s * .262, -.02, -.01, head).scale.set(.55, 1, .8);
    var e = mesh(new THREE.SphereGeometry(.042, sg(16), sg(12)), dark, s * .092, .015, .236, head, false); e.scale.set(.82, 1.2, .5);
    if (!o.lo) mesh(new THREE.SphereGeometry(.012, sg(8), sg(6)), std('#FFFFFF', .2), s * .092 + .013, .04, .254, head, false);
    var b = bx(.09, .02, .02, hairM, s * .095, .118, .243, head, false); b.rotation.z = o.worried ? s * -.32 : s * .07;
    if (!o.lo) { var ch = mesh(new THREE.CircleGeometry(.045, sg(18)), new THREE.MeshBasicMaterial({ color: '#FF8C9C', transparent: true, opacity: .32, depthWrite: false }), s * .158, -.065, .212, head, false, false);
    ch.rotation.y = s * .62; }
  });
  mesh(new THREE.SphereGeometry(.03, sg(12), sg(8)), skin, 0, -.045, .262, head);
  if (!o.lo) {
    var mo = mesh(new THREE.TorusGeometry(.052, .011, sg(8), sg(20), Math.PI), std('#7A2B35', .5), 0, -.115, .238, head, false);
    if (o.worried) { mo.position.y = -.145; mo.scale.set(.8, .6, 1); } else { mo.rotation.z = Math.PI; }
    mo.rotation.x = -.18;
  }
  hair(head, o.hairStyle || 0, hairM, sg);
  if (o.hat) hardHat(head, o.hat);
  g.userData.P = P;
  return g;
}
var LOGOC = {};
function logoTex(col){
  if (!LOGOC[col]) LOGOC[col] = makeTex(256, 64, function(g, w, h){ g.clearRect(0, 0, w, h); g.fillStyle = col; g.font = '800 44px Figtree, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('DAMM', w / 2, h / 2 + 2); });
  return LOGOC[col];
}
function hair(head, style, m, sg){
  sg = sg || function(n){ return n; };
  var H = new THREE.Group(); head.add(H);
  if (style === 3 || style === 0) {
    var cap = mesh(new THREE.SphereGeometry(.288, sg(32), sg(16), 0, Math.PI * 2, 0, Math.PI * .46), m, 0, .01, -.012, H); cap.rotation.x = -.32;
    var fr = mesh(new THREE.SphereGeometry(.2, sg(20), sg(10), 0, Math.PI * 2, 0, Math.PI * .5), m, .05, .17, .115, H); fr.scale.set(1.15, .42, .95); fr.rotation.set(.35, 0, -.28);
    if (style === 3) mesh(new THREE.SphereGeometry(.11, sg(16), sg(12)), m, 0, .24, -.19, H);
  } else if (style === 1) {
    var cap2 = mesh(new THREE.SphereGeometry(.29, sg(32), sg(16), 0, Math.PI * 2, 0, Math.PI * .44), m, 0, .01, -.01, H); cap2.rotation.x = -.3;
    mesh(new THREE.SphereGeometry(.302, sg(32), sg(16), Math.PI * .78, Math.PI * 1.44, Math.PI * .3, Math.PI * .37), m, 0, -.01, -.01, H);
  } else {
    for (var i = 0; i < 16; i++) {
      var a = i / 16 * Math.PI * 2, x = Math.sin(a) * .235, z = Math.cos(a) * .235;
      if (z > .16) continue;
      mesh(new THREE.SphereGeometry(.095, sg(12), sg(10)), m, x, .1 + (i % 2) * .05, z - .02, H);
    }
    mesh(new THREE.SphereGeometry(.215, sg(18), sg(14)), m, 0, .19, -.03, H).scale.set(1, .8, 1);
    for (var j = -2; j <= 2; j++) mesh(new THREE.SphereGeometry(.07, sg(10), sg(8)), m, j * .08, .22, .17, H);
  }
  return H;
}
function hardHat(head, col){
  var m = std(col === true ? '#F5F5F2' : col, .3, .05);
  mesh(new THREE.SphereGeometry(.3, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), m, 0, .06, 0, head);
  var br = mesh(new THREE.CylinderGeometry(.35, .35, .025, 28), m, 0, .065, .03, head); br.scale.z = 1.08;
  bx(.06, .05, .52, m, 0, .34, 0, head);
}
function angDiff(a, b){ var d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
function makePerson(scene, list, o){
  if (list.lowPoly) o = Object.assign({ lo: true }, o);
  var c = mii(o); c.position.set(o.x, o.y || 0, o.z);
  var s = c.userData; s.ph = rnd() * 6.28; s.baseY = o.y || 0; s.talk = o.talk; s.wave = o.wave; s.seated = o.seated; s.beer = !!o.beer;
  s.walk = o.path ? { path: o.path.map(function(p){ return V(p[0], 0, p[1]); }), i: 0, speed: o.speed || 1.1 } : null;
  if (s.walk) c.position.copy(s.walk.path[0]);
  if (o.face) c.lookAt(o.face[0], c.position.y, o.face[1]);
  if (o.rot != null) c.rotation.y = o.rot;
  if (o.seated) { s.P.hipL.rotation.x = s.P.hipR.rotation.x = -Math.PI / 2; s.P.shL.rotation.x = s.P.shR.rotation.x = -.55; }
  scene.add(c); list.push(c); return c;
}
function animPeople(list, dt, t){
  for (var k = 0; k < list.length; k++) {
    var c = list[k], s = c.userData, P = s.P;
    if (s.walk && !RM) {
      var w = s.walk, tgt = w.path[(w.i + 1) % w.path.length];
      var dx = tgt.x - c.position.x, dz = tgt.z - c.position.z, L = Math.sqrt(dx * dx + dz * dz), step = w.speed * dt;
      if (L < step + .02) w.i = (w.i + 1) % w.path.length;
      else { c.position.x += dx / L * step; c.position.z += dz / L * step; c.rotation.y += angDiff(Math.atan2(dx, dz), c.rotation.y) * Math.min(1, dt * 7); }
      var ph = t * 7.2 * w.speed + s.ph, sw = Math.sin(ph) * .55;
      P.hipL.rotation.x = sw; P.hipR.rotation.x = -sw; P.shL.rotation.x = -sw * .7; if (!s.beer) P.shR.rotation.x = sw * .7;
      c.position.y = s.baseY + Math.abs(Math.cos(ph)) * .035;
      P.head.rotation.y = Math.sin(t * .8 + s.ph) * .12;
    } else if (s.go) {
      // el teu personatge caminant (la posició la mou la plaça)
      var ph2 = t * 9 + s.ph, sw2 = RM ? 0 : Math.sin(ph2) * .55;
      P.hipL.rotation.x = sw2; P.hipR.rotation.x = -sw2; P.shL.rotation.x = -sw2 * .7; P.shR.rotation.x = sw2 * .7; P.shR.rotation.z = .12;
      c.position.y = s.baseY + (RM ? 0 : Math.abs(Math.cos(ph2)) * .035);
    } else if (s.seated) {
      P.head.rotation.y = Math.sin(t * .5 + s.ph) * .35; if (!s.beer) P.shR.rotation.x = -.55 + Math.sin(t * 1.3 + s.ph) * .12;
    } else {
      c.position.y = s.baseY + Math.sin(t * 2.1 + s.ph) * .012;
      P.head.rotation.y = Math.sin(t * .6 + s.ph) * .28; P.head.rotation.x = Math.sin(t * 1.6 + s.ph) * .06;
      if (s.talk && !s.beer) { P.shR.rotation.x = -.35 + Math.sin(t * 3 + s.ph) * .3; P.shL.rotation.x = -.08 + Math.sin(t * 2.2 + s.ph) * .1; }
      if (s.talk && s.beer) { P.shL.rotation.x = -.35 + Math.sin(t * 3 + s.ph) * .3; }
      if (s.wave) { P.shR.rotation.z = 2.5 + Math.sin(t * 7) * .35; P.shR.rotation.x = 0; }
    }
    if (s.beer && P.beer) {
      var sip = RM ? 0 : Math.max(0, Math.sin(t * .45 + s.ph) * 6 - 5);
      var ax = -.8 - sip * 1.45;
      P.shR.rotation.x = ax; P.shR.rotation.z = .12 - sip * .25; P.beer.rotation.x = -ax - sip * .7;
    }
  }
}

// ---------- mobiliari comú ----------
var TREE_BALL = new THREE.SphereGeometry(1, 11, 8);
function tree(scene, x, z, s, shadowsOnly){
  var g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s || 1);
  var bark = std('#8E7C63', .95);
  mesh(new THREE.CylinderGeometry(.2, .32, 4.4, 10), bark, 0, 2.2, 0, g);
  var b1 = mesh(new THREE.CylinderGeometry(.08, .14, 1.8, 8), bark, .45, 4.1, 0, g); b1.rotation.z = -.6;
  var b2 = mesh(new THREE.CylinderGeometry(.08, .14, 1.6, 8), bark, -.4, 4.0, .2, g); b2.rotation.z = .55;
  var greens = ['#5C8C38', '#6C9C42', '#7AA84D', '#527E30', '#668F3C'];
  for (var i = 0; i < 10; i++) { var r = rr(1, 1.7); var m = mesh(TREE_BALL, std(pick(greens), .92), rr(-1.7, 1.7), rr(4.4, 6.4), rr(-1.7, 1.7), g); m.scale.set(r, r * .82, r); }
  scene.add(g); return g;
}
function bench(scene, x, z, ry){
  var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry || 0;
  var wood = std('#8A5A36', .7), iron = std('#2A2D30', .45, .6);
  for (var i = 0; i < 4; i++) bx(1.9, .06, .12, wood, 0, .48, -.2 + i * .13, g);
  for (var j = 0; j < 3; j++) { var s = bx(1.9, .09, .04, wood, 0, .66 + j * .13, -.3, g); s.rotation.x = -.15; }
  [-.82, .82].forEach(function(px){ bx(.06, .48, .52, iron, px, .24, -.05, g); bx(.06, .5, .06, iron, px, .72, -.3, g); });
  scene.add(g); return g;
}
function lamp(scene, x, z, bulbs){
  var g = new THREE.Group(); g.position.set(x, 0, z);
  var iron = std('#2E3A33', .45, .6);
  mesh(new THREE.CylinderGeometry(.07, .12, 4.3, 12), iron, 0, 2.15, 0, g);
  mesh(new THREE.CylinderGeometry(.18, .22, .3, 12), iron, 0, .15, 0, g);
  bx(.44, .62, .44, iron, 0, 4.55, 0, g);
  var gl = bx(.34, .48, .34, std('#FFF3CF', .3, 0, { emissive: '#FFC977', emissiveIntensity: .55 }), 0, 4.55, 0, g, false);
  var cap = mesh(new THREE.ConeGeometry(.36, .3, 4), iron, 0, 5.0, 0, g); cap.rotation.y = Math.PI / 4;
  scene.add(g); return g;
}
function catenary(scene, a, b, sag, n){
  var pts = [];
  for (var i = 0; i <= n; i++) { var t = i / n, p = a.clone().lerp(b, t); p.y -= 4 * sag * t * (1 - t); pts.push(p); }
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#3A3230' })));
  return pts;
}

// =====================================================
//  LA PLAÇA (versió compacta)
// =====================================================
function buildPlaza(){
  var S = new THREE.Scene();
  skyDome(S, '#6FAEDC', '#F4E4C8');
  S.environment = envFrom('#8FC0E6', '#E9D8BC');
  S.fog = new THREE.Fog('#EFE0C8', 55, 150);
  sunLight(S, [20, 32, 16], 30, 1.9, SMALL ? 1024 : 2048);
  var anims = [], people = [], pickables = [];

  var ground = mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ map: rep(T.grass, 60, 60), roughness: 1 }), 0, -.02, 0, S, false); ground.rotation.x = -Math.PI / 2;
  var floor = mesh(new THREE.PlaneGeometry(38, 32), new THREE.MeshStandardMaterial({ map: rep(T.cobble, 14, 12), roughness: .9 }), 0, 0, -1, S, false); floor.rotation.x = -Math.PI / 2;
  bx(38.6, .16, .4, std('#D8CDBB', .8), 0, .08, 15.1, S);

  var STONE = std('#E8DECF', .85), GLASS = std('#2A3743', .12, .55), DOOR = std('#5B3A24', .65);
  var SHUT = new THREE.MeshStandardMaterial({ map: T.shutter, roughness: .7 });
  var RAIL = new THREE.MeshStandardMaterial({ map: T.rail, transparent: true, alphaTest: .4, side: THREE.DoubleSide, roughness: .5, metalness: .5 });
  var POT = std('#B3633B', .8), LEAF = std('#4F8A34', .9), FLOW = std('#D6334A', .7);
  function building(p){
    var g = new THREE.Group(); g.position.set(p.x, 0, p.z); g.rotation.y = p.rot || 0;
    var w = p.w, d = p.d || 9, gh = 4, fh = 3.1, h = gh + p.floors * fh + .6;
    var wm = new THREE.MeshStandardMaterial({ map: stucco(p.color, Math.max(1, Math.round(w / 5))), roughness: .93 });
    bx(w, h, d, wm, 0, h / 2, -d / 2, g);
    bx(w + .3, .5, .7, STONE, 0, h - .1, .15, g);
    bx(w + .05, .9, .16, STONE, 0, .45, .06, g, false);
    for (var f = 1; f <= p.floors; f++) bx(w, .14, .24, STONE, 0, gh + (f - 1) * fh - .08, .1, g, false);
    if (p.roof === 'tiles') {
      var sh = new THREE.Shape(); sh.moveTo(-d / 2 - .4, 0); sh.lineTo(d / 2 + .4, 0); sh.lineTo(0, 2.6); sh.closePath();
      var r = mesh(new THREE.ExtrudeGeometry(sh, { depth: w + .4, bevelEnabled: false }), new THREE.MeshStandardMaterial({ map: T.tiles, roughness: .85 }), -(w + .4) / 2, h + .15, -d / 2, g);
      r.rotation.y = Math.PI / 2;
    } else { bx(w, 1, .28, wm, 0, h + .5, -.12, g); bx(w, .2, d, STONE, 0, h + .02, -d / 2, g, false); }
    var cols = Math.max(2, Math.floor(w / 2.8)), sp = w / cols;
    for (var fl = 0; fl < p.floors; fl++) {
      var y = gh + fl * fh + 1.35;
      for (var c = 0; c < cols; c++) {
        var wx = -w / 2 + sp * (c + .5);
        bx(1.3, 2.1, .12, STONE, wx, y, .04, g, false); bx(.98, 1.8, .1, GLASS, wx, y, .08, g, false);
        if ((fl + c) % 3 !== 1) { bx(.5, 1.8, .05, SHUT, wx - .78, y, .1, g, false); bx(.5, 1.8, .05, SHUT, wx + .78, y, .1, g, false); }
        else bx(.98, .9, .06, SHUT, wx, y + .44, .13, g, false);
        if (fl === 0 || (fl === 1 && c % 2 === 1)) {
          bx(1.8, .13, .8, STONE, wx, y - .97, .4, g);
          mesh(new THREE.PlaneGeometry(1.8, .9), RAIL, wx, y - .48, .79, g, false, false);
          var rl = mesh(new THREE.PlaneGeometry(.78, .9), RAIL, wx - .9, y - .48, .4, g, false, false); rl.rotation.y = Math.PI / 2;
          var rr2 = mesh(new THREE.PlaneGeometry(.78, .9), RAIL, wx + .9, y - .48, .4, g, false, false); rr2.rotation.y = Math.PI / 2;
          if (rnd() < .6) { bx(.32, .26, .26, POT, wx - .55, y - .78, .55, g); mesh(new THREE.SphereGeometry(.22, 10, 8), LEAF, wx - .55, y - .56, .55, g); mesh(new THREE.SphereGeometry(.07, 8, 6), FLOW, wx - .48, y - .44, .66, g, false); }
        }
      }
    }
    if (p.ground === 'shop' || p.ground === 'bar') {
      var n = Math.max(1, Math.floor(w / 4)), aw = new THREE.MeshStandardMaterial({ map: T.awning(p.awn || '#C8102E'), roughness: .8, side: THREE.DoubleSide });
      for (var i = 0; i < n; i++) {
        var sx = -w / 2 + w / n * (i + .5), sw = w / n - 1;
        bx(sw + .3, 3.1, .14, DOOR, sx, 1.75, .05, g, false); bx(sw - .2, 2.7, .12, std('#3A4652', .1, .5), sx, 1.75, .1, g, false);
        var a = bx(sw + .4, .07, 1.5, aw, sx, 3.45, .8, g); a.rotation.x = .36;
      }
      if (p.ground === 'bar') mesh(new THREE.PlaneGeometry(4.2, .7), new THREE.MeshStandardMaterial({ map: textTex('BAR  ·  TERRASSA', { w: 768, h: 128, bg: '#7A0C1E', fg: '#F6EBD9', font: '600 64px "DM Serif Display", Georgia, serif' }), roughness: .6 }), 0, 3.9, .17, g, false);
    } else if (p.ground === 'arcade') {
      bx(w, 3.6, .2, std('#3B302A', .9), 0, 1.8, -.4, g, false);
      for (var k = 0; k <= Math.floor(w / 3); k++) bx(.55, 3.7, .55, STONE, -w / 2 + .3 + k * (w - .6) / Math.floor(w / 3), 1.85, .45, g);
      bx(w, .6, .9, STONE, 0, 3.95, .45, g);
    } else {
      bx(1.7, 3, .14, DOOR, 0, 1.5, .07, g); bx(2.1, .3, .3, STONE, 0, 3.15, .12, g, false);
      bx(1.1, 1.5, .1, GLASS, -w / 4 - .4, 2, .07, g, false); bx(1.1, 1.5, .1, GLASS, w / 4 + .4, 2, .07, g, false);
    }
    S.add(g); return g;
  }
  // ---------- edificis de Damm ----------
  // Inspirats en edificis reals de Damm (la fàbrica històrica, la seva torre, la cerveseria de maó i la nau vermella moderna).
  // Els rètols fan servir tipografia genèrica, no el logotip oficial.
  var CREAM = new THREE.MeshStandardMaterial({ map: stucco('#F1E2C2', 4), roughness: .92 });
  var CREAM_T = new THREE.MeshStandardMaterial({ map: stucco('#F1E2C2', 1), roughness: .92 });
  var TERRA = std('#D2703F', .85), TERRA_DK = std('#B5562B', .85);
  var WINGLASS = std('#2E3640', .18, .4), MULL = std('#3B2A22', .7);
  var GOLD = std('#F2B705', .32, .55, { emissive: '#7A5200', emissiveIntensity: .3 });
  var AW = {};
  function archGeo(w, h){
    var k = w + 'x' + h; if (AW[k]) return AW[k];
    var r = w / 2, sh = new THREE.Shape(); sh.moveTo(-r, 0); sh.lineTo(r, 0); sh.lineTo(r, h - r); sh.absarc(0, h - r, r, 0, Math.PI, false); sh.lineTo(-r, 0);
    return (AW[k] = new THREE.ShapeGeometry(sh, 16));
  }
  // finestra amb arc de mig punt i marc de terracota; (x, y) és el centre de la base
  function archWin(p, x, y, w, h, z){
    mesh(archGeo(w + .34, h + .17), TERRA, x, y - .1, z + .01, p, false);
    mesh(archGeo(w, h), WINGLASS, x, y, z + .03, p, false);
    bx(.06, h - .1, .03, MULL, x, y + (h - .1) / 2, z + .05, p, false);
    bx(w, .06, .03, MULL, x, y + h * .45, z + .05, p, false);
    bx(w + .5, .14, .22, TERRA, x, y - .12, z + .1, p, false);
  }
  function starShape(R, r){
    var sh = new THREE.Shape();
    for (var i = 0; i < 10; i++) { var a = Math.PI / 2 + i * Math.PI / 5, d = i % 2 ? r : R; if (i) sh.lineTo(Math.cos(a) * d, Math.sin(a) * d); else sh.moveTo(Math.cos(a) * d, Math.sin(a) * d); }
    sh.closePath(); return sh;
  }
  function star3d(R, depth, mat){
    var g = new THREE.ExtrudeGeometry(starShape(R, R * .42), { depth: depth, bevelEnabled: true, bevelThickness: depth * .5, bevelSize: R * .07, bevelSegments: 2 });
    g.center(); var m = new THREE.Mesh(g, mat); m.castShadow = true; return m;
  }
  // text sobre fons transparent (lletres aplicades a la façana)
  function letterTex(text, col, font, w, h){
    return makeTex(w || 1024, h || 256, function(g, W, H){ g.clearRect(0, 0, W, H); g.fillStyle = col; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, W / 2, H / 2 + 6); });
  }
  function medallion(p, x, y, z){
    mesh(new THREE.CircleGeometry(.62, 32), std('#F6EBD2', .6), x, y, z, p, false);
    mesh(new THREE.RingGeometry(.5, .6, 32), std('#2A2522', .6), x, y, z + .01, p, false);
    mesh(new THREE.ShapeGeometry(starShape(.36, .15)), std('#2A2522', .6), x, y, z + .02, p, false);
  }

  // --- La fàbrica històrica (fons de la plaça) ---
  (function(){
    var g = new THREE.Group(); g.position.set(0, 0, -15); S.add(g);
    var W2 = 36, D = 9, H = 12.4, n = 9, bay = (W2 - .8) / n;
    bx(W2, H, D, CREAM, 0, H / 2, -D / 2, g);
    bx(W2 + .2, 1.5, D + .2, TERRA, 0, .75, -D / 2, g);
    [4.6, 8.4].forEach(function(y){ bx(W2 + .1, .28, .3, TERRA, 0, y, .1, g, false); });
    bx(W2 + .4, .55, .6, TERRA, 0, H - .1, .15, g); bx(W2 + .2, .22, .4, TERRA_DK, 0, H - .5, .12, g, false);
    for (var i = 0; i <= n; i++) bx(.8, H - .4, .3, TERRA, -W2 / 2 + .4 + i * bay, (H - .4) / 2, .12, g);
    for (var b = 0; b < n; b++) {
      var cx = -W2 / 2 + .4 + (b + .5) * bay;
      archWin(g, cx, 1.9, 1.5, 2.3, .08); archWin(g, cx, 5.4, 1.3, 2.2, .08); archWin(g, cx, 9.1, 1.2, 2.0, .08);
    }
    for (var m = 0; m < 30; m++) bx(.62, .8, .5, TERRA, -W2 / 2 + .6 + m * (W2 - 1.2) / 29, H + .55, .05, g);
    // àtic central amb el rètol
    bx(14, 3.6, 1.4, CREAM_T, 0, H + 1.8, -.4, g);
    [-6.9, 6.9].forEach(function(x){ bx(.7, 3.6, .3, TERRA, x, H + 1.8, .35, g); });
    bx(14.4, .4, 1.6, TERRA, 0, H + 3.75, -.35, g);
    for (var k = 0; k < 11; k++) bx(.6, .75, .45, TERRA, -6.6 + k * 1.32, H + 4.3, .2, g);
    mesh(new THREE.PlaneGeometry(11, .95), new THREE.MeshStandardMaterial({ map: textTex('FÀBRICA DE CERVESA', { w: 1024, h: 88, bg: '#F1E2C2', fg: '#2A2522', font: '700 62px Figtree, sans-serif' }), roughness: .8 }), 0, H + 2.85, .31, g, false);
    mesh(new THREE.PlaneGeometry(12.6, 1.4), new THREE.MeshStandardMaterial({ map: textTex('S.A.  DAMM', { w: 1024, h: 114, bg: '#E2B458', fg: '#2A2522', font: '400 92px "DM Serif Display", Georgia, serif' }), roughness: .7 }), 0, H + 1.35, .31, g, false);
    medallion(g, -5.3, H + 1.35, .33); medallion(g, 5.3, H + 1.35, .33);
  })();

  // --- La torre amb el rètol i l'estrella ---
  (function(){
    var g = new THREE.Group(); g.position.set(-16.6, 0, -16.3); S.add(g);
    var w = 5.6, H = 15.5;
    bx(w, H, w, CREAM_T, 0, H / 2, 0, g);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function(c){ bx(.8, H, .8, TERRA, c[0] * (w / 2 - .3), H / 2, c[1] * (w / 2 - .3), g); });
    bx(w + .2, 1.5, w + .2, TERRA, 0, .75, 0, g);
    [7.2, 11.9].forEach(function(y){ bx(w + .3, .35, w + .3, TERRA, 0, y, 0, g, false); });
    bx(w + .7, .7, w + .7, TERRA, 0, H - .2, 0, g); bx(w + .5, .25, w + .5, TERRA_DK, 0, H - .75, 0, g, false);
    for (var s4 = 0; s4 < 4; s4++) {
      var side = new THREE.Group(); side.rotation.y = s4 * Math.PI / 2; g.add(side);
      archWin(side, 0, 3.4, 1.3, 2.3, w / 2); archWin(side, 0, 9.2, 1.3, 2.4, w / 2); archWin(side, 0, 12.6, 1.1, 1.7, w / 2);
      for (var m = 0; m < 4; m++) bx(.7, m % 3 === 0 ? 1.3 : .9, .4, TERRA, -w / 2 + .45 + m * (w - .9) / 3, H + .6, w / 2 + .1, side);
    }
    // caixa del rètol, de llistons vermells, sobre una estructura metàl·lica
    var steel = std('#3A3D40', .5, .5);
    [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]].forEach(function(c){ bx(.14, 1.4, .14, steel, c[0], H + 1, c[1], g); });
    var slat = new THREE.MeshStandardMaterial({ roughness: .75, map: makeTex(128, 128, function(gg, W, Hh){ gg.fillStyle = '#B83A22'; gg.fillRect(0, 0, W, Hh); for (var y = 0; y < Hh; y += 11) { gg.fillStyle = 'rgba(60,10,0,.4)'; gg.fillRect(0, y, W, 2); } }) });
    bx(4.6, 2.3, 4.6, slat, 0, H + 2.85, 0, g);
    var signM = new THREE.MeshStandardMaterial({ map: textTex('Damm', { w: 512, h: 200, bg: '#B3121C', fg: '#FFFFFF', border: '#E8B83A', font: '400 136px "DM Serif Display", Georgia, serif' }), roughness: .6 });
    [0, Math.PI / 2, Math.PI, -Math.PI / 2].forEach(function(r){ var sg = new THREE.Group(); sg.rotation.y = r; g.add(sg); mesh(new THREE.PlaneGeometry(3.9, 1.5), signM, 0, H + 2.85, 2.32, sg, false); });
    // estrella daurada sobre un pal
    mesh(new THREE.CylinderGeometry(.07, .09, 2.2, 8), steel, 0, H + 5, 0, g);
    var st = star3d(1.5, .3, GOLD); st.position.set(0, H + 7.1, 0); g.add(st);
    anims.push(function(dt, t){ st.rotation.y = .35 + Math.sin(t * .4) * .25; });
  })();

  // --- La cerveseria de maó (costat esquerre): vidrieres amb tancs de coure a dins ---
  (function(){
    var g = new THREE.Group(); g.position.set(-17.5, 0, -.5); g.rotation.y = Math.PI / 2; S.add(g);
    var L = 27, D = 9, H1 = 6.4, H2 = 10.8, rec = 1.7;
    var STONEB = std('#E7DFD0', .85), BRICKM = new THREE.MeshStandardMaterial({ map: rep(T.brick, 10, 2), roughness: .9 });
    var PALE = new THREE.MeshStandardMaterial({ roughness: .9, map: makeTex(128, 128, function(gg, W, Hh){ gg.fillStyle = '#CFC4B2'; gg.fillRect(0, 0, W, Hh); for (var r = 0; r < 16; r++) for (var c = -1; c < 5; c++) { gg.fillStyle = pick(['#EDE5D6', '#E6DCCB', '#F1EADD']); gg.fillRect(c * 32 + (r % 2) * 16 + 1, r * 8 + 1, 30, 6); } }) });
    bx(L, H1, D - rec, STONEB, 0, H1 / 2, -(D + rec) / 2, g);
    bx(L, H2 - H1, D, BRICKM, 0, (H1 + H2) / 2, -D / 2, g);
    bx(L + .3, .7, .9, STONEB, 0, H1 + .1, .1, g);
    bx(L + .4, .55, 1.1, STONEB, 0, H2 + .2, .05, g);
    bx(L, .25, rec, std('#8D8274', .9), 0, .12, -rec / 2, g, false);
    var interior = std('#4A2E1E', .9, 0, { emissive: '#7A3E14', emissiveIntensity: .35 });
    var copper = std('#C8763A', .28, .85);
    var GL = std('#A9C1CC', .05, .3, { transparent: true, opacity: .28 });
    var frame = std('#2B2D31', .5, .4);
    var bays = [-11, -7, -3, 3, 7, 11];
    bays.forEach(function(x){
      bx(3.6, H1 - .6, .05, interior, x, (H1 - .6) / 2 + .3, -rec + .05, g, false);
      [-.95, .95].forEach(function(dx){
        mesh(new THREE.CylinderGeometry(.62, .62, 3.2, 20), copper, x + dx, 2.2, -.95, g, false);
        mesh(new THREE.SphereGeometry(.62, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), copper, x + dx, 3.8, -.95, g, false);
      });
      bx(3.6, H1 - .7, .04, GL, x, (H1 - .7) / 2 + .35, -.05, g, false, false);
      [-1.8, -.6, .6, 1.8].forEach(function(dx){ bx(.12, H1 - .6, .14, frame, x + dx, (H1 - .6) / 2 + .3, -.05, g, false); });
      [1.6, 4.4].forEach(function(y){ bx(3.6, .1, .14, frame, x, y, -.05, g, false); });
      [-1.2, 0, 1.2].forEach(function(dx){ bx(.62, 2.8, .1, WINGLASS, x + dx, H1 + 2.2, .04, g, false); bx(.82, .14, .2, STONEB, x + dx, H1 + .72, .1, g, false); });
    });
    [-13.2, -9, -5, 5, 9, 13.2].forEach(function(x){ bx(.6, H1, rec, STONEB, x, H1 / 2, -rec / 2, g); });
    // portal central de maó clar, amb estrella i lletres daurades
    bx(4.4, H1 + 1.8, 1.6, PALE, 0, (H1 + 1.8) / 2, .2, g);
    bx(1.9, 2.8, .1, std('#2B2D31', .3, .4), 0, 1.75, 1.02, g, false);
    bx(3.4, .2, 1.1, STONEB, 0, .1, 1.5, g); bx(3.4, .2, .6, STONEB, 0, .3, 1.25, g);
    var gs = star3d(.55, .14, GOLD); gs.position.set(0, 5.7, 1.1); g.add(gs);
    mesh(new THREE.PlaneGeometry(2.6, .65), new THREE.MeshStandardMaterial({ map: letterTex('DAMM', '#D9A93A', '400 190px "DM Serif Display", Georgia, serif'), transparent: true, roughness: .4, metalness: .5 }), 0, 4.7, 1.02, g, false, false);
    [-1, 1].forEach(function(s){ bx(.05, .9, 1.1, std('#9A9EA4', .3, .7), s * 1.4, .75, 1.6, g, false).rotation.x = .35; });
    bx(.7, 1.6, .1, WINGLASS, 0, H1 + 3.6, .1, g, false);
  })();

  // --- costat dret: el bar de la terrassa, un edifici amb rètol al terrat i la nau vermella moderna ---
  building({ w: 9, floors: 3, color: '#F2E6D2', roof: 'flat', ground: 'bar', x: 17.5, z: -9.5, rot: -Math.PI / 2 });
  building({ w: 8, floors: 4, color: '#DFAE85', roof: 'flat', ground: 'shop', awn: '#7A0C1E', x: 17.5, z: -1, rot: -Math.PI / 2 });
  (function(){
    // rètol de terrat, com els de la ciutat
    var g = new THREE.Group(); g.position.set(18.5, 17.1, -1); g.rotation.y = -Math.PI / 2; S.add(g);
    var steel = std('#3A3D40', .5, .5);
    [-2.2, 0, 2.2].forEach(function(x){ bx(.12, 1.4, .12, steel, x, .7, -.4, g); bx(.1, 1.6, .1, steel, x, .9, -1.2, g).rotation.x = .5; });
    bx(6.4, 2.3, .25, std('#C8432A', .7), 0, 2.4, -.4, g);
    mesh(new THREE.PlaneGeometry(6, 1.9), new THREE.MeshStandardMaterial({ map: textTex('Damm', { w: 640, h: 200, bg: '#C8432A', fg: '#F6EBD9', font: '400 150px "DM Serif Display", Georgia, serif' }), roughness: .6 }), 0, 2.4, -.26, g, false);
    var st = star3d(1.1, .25, GOLD); st.position.set(2.6, 4.1, -.4); st.rotation.z = .2; g.add(st);
  })();
  (function(){
    var g = new THREE.Group(); g.position.set(17.5, 0, 7.5); g.rotation.y = -Math.PI / 2; S.add(g);
    var W3 = 9, D = 9, H = 13.4, lo = 4.6;
    var panel = new THREE.MeshStandardMaterial({ roughness: .55, map: makeTex(256, 256, function(gg, W, Hh){ gg.fillStyle = '#D9262B'; gg.fillRect(0, 0, W, Hh); gg.fillStyle = 'rgba(90,0,0,.35)'; for (var y = 0; y < Hh; y += 32) gg.fillRect(0, y, W, 2); for (var x = 0; x < W; x += 64) gg.fillRect(x, 0, 2, Hh); }) });
    bx(W3, lo, D - 2, std('#3A3634', .8), 0, lo / 2, -(D + 2) / 2, g);
    bx(W3, H - lo, D, panel, 0, lo + (H - lo) / 2, -D / 2, g);
    bx(W3 + .3, .7, 1.2, std('#C21F25', .5), 0, H + .1, .15, g);
    [-3.8, 3.8].forEach(function(x){ bx(.5, lo, .5, std('#C9CBCE', .6), x, lo / 2, -.4, g); });
    mesh(new THREE.PlaneGeometry(6.6, 1.9), new THREE.MeshStandardMaterial({ map: letterTex('Damm', '#FFFFFF', '400 210px "DM Serif Display", Georgia, serif'), transparent: true, roughness: .5 }), 0, 10.2, .02, g, false, false);
    var pal = std('#2F6FB0', .7);
    [[-2.4, 0], [-1.2, 0], [-2.4, 1]].forEach(function(p){ bx(1.1, .9, 1.1, pal, p[0], .45 + p[1] * .92, -1.3, g); });
  })();

  // font (compacta)
  (function(){
    var g = new THREE.Group(); g.position.set(0, 0, -2); g.scale.setScalar(.8); S.add(g);
    var st = new THREE.MeshStandardMaterial({ map: stucco('#ECE3D3', 2), roughness: .7 });
    var lp = function(arr){ return new THREE.LatheGeometry(arr.map(function(p){ return new THREE.Vector2(p[0], p[1]); }), 64); };
    mesh(lp([[0, 0], [4.3, 0], [4.5, .15], [4.5, .78], [4.1, .84], [4.0, .35], [0, .35]]), st, 0, 0, 0, g);
    var water = mesh(new THREE.CircleGeometry(4.02, 64), new THREE.MeshStandardMaterial({ color: '#4FA3C4', roughness: .05, metalness: .2, transparent: true, opacity: .88 }), 0, .62, 0, g, false); water.rotation.x = -Math.PI / 2;
    mesh(lp([[0, .35], [.6, .35], [.42, .6], [.34, 2.2], [.5, 2.35], [0, 2.35]]), st, 0, 0, 0, g);
    mesh(lp([[0, 2.3], [1.45, 2.45], [1.65, 2.66], [1.5, 2.72], [0, 2.56]]), st, 0, 0, 0, g);
    mesh(lp([[0, 2.6], [.22, 2.62], [.16, 3.0], [.24, 3.1], [0, 3.25]]), st, 0, 0, 0, g);
    var N = 460, pos = new Float32Array(N * 3), ph = new Float32Array(N), an = new Float32Array(N), kind = new Uint8Array(N);
    for (var i = 0; i < N; i++) { ph[i] = Math.random(); an[i] = Math.random() * Math.PI * 2; kind[i] = i % 3 === 0 ? 0 : 1; }
    var geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: '#E4F7FF', size: .1, transparent: true, opacity: .85, depthWrite: false })));
    anims.push(function(dt, t){
      for (var i = 0; i < N; i++) {
        var L = (t * (kind[i] ? .7 : .9) + ph[i]) % 1, a = an[i];
        if (kind[i] === 0) { var r = L * .9; pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 2] = Math.sin(a) * r; pos[i * 3 + 1] = 3.25 + L * 1.5 - L * L * 2.6; }
        else { var t2 = L * .62, r2 = 1.62 + t2 * .5; pos[i * 3] = Math.cos(a) * r2; pos[i * 3 + 2] = Math.sin(a) * r2; pos[i * 3 + 1] = 2.68 - t2 * t2 * 5.2; }
      }
      geo.attributes.position.needsUpdate = true;
    });
  })();

  // arbres, bancs, fanals
  // arbres als costats perquè no tapin la vista de la càmera
  [[-17, 13.5], [17, 13.5]].forEach(function(p){ tree(S, p[0], p[1], .8); });
  bench(S, -10, 12.6, Math.PI); bench(S, 10, 12.6, Math.PI);
  [[-7, -8], [7, -8], [-7.5, 8.5], [7.5, 8.5]].forEach(function(p){ lamp(S, p[0], p[1]); });

  // guirnaldes (primera fita de la Festa de la setmana: es veuen a partir del 25 %)
  var garland = new THREE.Group(); garland.userData.keep = true; S.add(garland);
  var bulbA = std('#FFF4D6', .4, 0, { emissive: '#FFCB6B', emissiveIntensity: .9 }), bulbB = std('#FFD9DD', .4, 0, { emissive: '#E8435A', emissiveIntensity: .7 });
  var flagMats = [std('#C8102E', .8, 0, { side: THREE.DoubleSide }), std('#F6EFE2', .8, 0, { side: THREE.DoubleSide }), std('#B08A45', .7, 0, { side: THREE.DoubleSide })];
  var BULB_G = new THREE.SphereGeometry(.1, 8, 6);
  var tri = new THREE.Shape(); tri.moveTo(-.2, 0); tri.lineTo(.2, 0); tri.lineTo(0, -.45); tri.closePath(); var triG = new THREE.ShapeGeometry(tri);
  [-10, -3, 4].forEach(function(z, zi){
    catenary(garland, V(-17, 8, z), V(17, 8, z), 1.8, 30).forEach(function(p, i){
      if (i % 2 === 0) mesh(BULB_G, (i / 2) % 2 ? bulbA : bulbB, p.x, p.y - .12, p.z, garland, false, false);
      else if (zi !== 1) mesh(triG, flagMats[i % 3], p.x, p.y, p.z, garland, false, false);
    });
  });
  anims.push(function(dt, t){ bulbA.emissiveIntensity = .75 + Math.sin(t * 2.4) * .25; bulbB.emissiveIntensity = .6 + Math.sin(t * 2.4 + Math.PI) * .25; });

  // ---------- mobiliari de terrassa d'estil Damm ----------
  // Els rètols són tipografia genèrica ("DAMM"); el logotip oficial es pot posar substituint BRAND_W / BRAND_INK.
  var PINE_M = new THREE.MeshStandardMaterial({ roughness: .78, map: makeTex(256, 64, function(g, w, h){
    g.fillStyle = '#D9B07A'; g.fillRect(0, 0, w, h);
    for (var i = 0; i < 46; i++) { var y = rr(0, h); g.strokeStyle = pick(['rgba(150,95,40,.28)', 'rgba(255,236,205,.3)', 'rgba(120,72,30,.2)']); g.lineWidth = rr(.6, 2.2); g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * .3, y + rr(-5, 5), w * .65, y + rr(-5, 5), w, y + rr(-4, 4)); g.stroke(); }
    for (var k = 0; k < 3; k++) { g.fillStyle = 'rgba(120,70,30,.35)'; g.beginPath(); g.ellipse(rr(20, w - 20), rr(10, h - 10), rr(3, 6), rr(2, 3), 0, 0, Math.PI * 2); g.fill(); }
    speckle(g, w, h, 900, ['#7A4A20'], .18);
  }) });
  var TEAK = std('#9A5B32', .6);
  // vermell una mica fosc: amb el sol directe i el tone mapping, un vermell pur es veu rosat
  var CANVAS = std('#9C0D19', .9, 0, { side: THREE.DoubleSide });
  var REDPLANK = new THREE.MeshStandardMaterial({ roughness: .8, map: makeTex(256, 256, function(g, w, h){
    g.fillStyle = '#B3121C'; g.fillRect(0, 0, w, h);
    for (var y = 0; y < h; y += 21) { g.fillStyle = 'rgba(60,0,8,.45)'; g.fillRect(0, y, w, 2); g.fillStyle = 'rgba(255,190,190,.1)'; g.fillRect(0, y + 2, w, 2); }
    speckle(g, w, h, 2500, ['#000', '#fff'], .08);
  }) });
  var BRAND_W = new THREE.MeshStandardMaterial({ map: logoTex('#FFFFFF'), transparent: true, roughness: .7, depthWrite: false });
  var BRAND_INK = new THREE.MeshStandardMaterial({ map: logoTex('#1F2A44'), transparent: true, roughness: .8, depthWrite: false });
  var BRAND_G = new THREE.PlaneGeometry(.46, .115), STEN_G = new THREE.PlaneGeometry(.5, .125);
  var VAL_M = new THREE.MeshStandardMaterial({ map: textTex('DAMM', { w: 864, h: 64, bg: '#B3121C', fg: '#FFFFFF', font: '800 40px Figtree, sans-serif' }), roughness: .85, side: THREE.DoubleSide });
  var VAL_G = new THREE.PlaneGeometry(2.69, .2), PARA_G = new THREE.ConeGeometry(1.9, .5, 4, 1, true);
  var DOT_G = new THREE.SphereGeometry(.022, 8, 6), RED_DOT = std('#C8102E', .4);
  var LEAF_G = new THREE.ConeGeometry(.045, .5, 5), LEAF_M = std('#5E8F3A', .85);
  var BUSH_G = new THREE.SphereGeometry(.17, 10, 8), SPIKE_G = new THREE.CylinderGeometry(.022, .022, .3, 5), LAV = std('#8C6CC0', .8);
  var GREENS = [std('#5C8C38', .92), std('#6E9E45', .92), std('#7FA36A', .9)];
  var BEER_M = std('#E3A33A', .06, 0, { transparent: true, opacity: .9 }), FOAM_M = std('#FFF9EC', .85);

  function glass(p, x, z){ mesh(new THREE.CylinderGeometry(.042, .035, .14, 14), BEER_M, x, .83, z, p, false); mesh(new THREE.CylinderGeometry(.043, .043, .035, 14), FOAM_M, x, .915, z, p, false); }
  // cadira de director: fusta i lona vermella amb el nom al respatller (per les dues cares)
  function directorChair(parent, x, z, ry){
    var c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; parent.add(c);
    [-1, 1].forEach(function(s){
      var px = s * .27;
      var l1 = bx(.04, .6, .04, TEAK, px, .24, 0, c); l1.rotation.x = .62;
      var l2 = bx(.04, .6, .04, TEAK, px, .24, 0, c); l2.rotation.x = -.62;
      bx(.04, 1.0, .04, TEAK, px, .5, -.2, c);
      bx(.04, .62, .04, TEAK, px, .31, .2, c);
      bx(.06, .04, .48, TEAK, px, .66, 0, c);
    });
    bx(.54, .03, .42, CANVAS, 0, .46, 0, c);
    bx(.5, .03, .03, TEAK, 0, .44, .2, c, false); bx(.5, .03, .03, TEAK, 0, .44, -.2, c, false);
    bx(.58, .26, .02, CANVAS, 0, .84, -.2, c);
    mesh(BRAND_G, BRAND_W, 0, .84, -.188, c, false, false);
    mesh(BRAND_G, BRAND_W, 0, .84, -.212, c, false, false).rotation.y = Math.PI;
    return c;
  }
  // taula quadrada amb para-sol vermell i quatre cadires; `sitters` posa gent asseguda a les cadires indicades
  function terraceSet(x, z, ry, sitters){
    ry = ry || 0;
    var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; S.add(g);
    mesh(new THREE.CylinderGeometry(.24, .28, .12, 20), std('#55585C', .6, .3), 0, .06, 0, g);
    mesh(new THREE.CylinderGeometry(.035, .035, 2.95, 10), std('#3A3D40', .45, .5), 0, 1.47, 0, g);
    mesh(PARA_G, CANVAS, 0, 2.86, 0, g).rotation.y = Math.PI / 4;
    for (var k = 0; k < 4; k++) { var v = mesh(VAL_G, VAL_M, Math.sin(k * Math.PI / 2) * 1.345, 2.51, Math.cos(k * Math.PI / 2) * 1.345, g, false); v.rotation.y = k * Math.PI / 2; }
    mesh(new THREE.ConeGeometry(.06, .16, 8), std('#3A3D40', .45, .5), 0, 3.18, 0, g);
    bx(.84, .04, .84, PINE_M, 0, .74, 0, g);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function(p){ bx(.05, .72, .05, TEAK, p[0] * .36, .36, p[1] * .36, g); });
    glass(g, .22, .2); glass(g, -.2, -.18);
    var c = Math.cos(ry), s = Math.sin(ry);
    for (var i = 0; i < 4; i++) {
      var a = i * Math.PI / 2, d = .82;
      directorChair(g, Math.sin(a) * d, Math.cos(a) * d, a + Math.PI);
      if (sitters && sitters[i]) {
        var lx = Math.sin(a) * (d - .05), lz = Math.cos(a) * (d - .05);
        makePerson(S, people, Object.assign({ x: x + lx * c + lz * s, y: .01, z: z - lx * s + lz * c, seated: true, rot: ry + a + Math.PI }, sitters[i]));
      }
    }
    return g;
  }
  // butaca de palet amb el nom gravat al respatller
  function palletChair(x, z, ry){
    var c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; S.add(c);
    [-1, 1].forEach(function(s){
      bx(.09, .2, 1.0, PINE_M, s * .42, .2, 0, c);
      bx(.1, .5, .1, PINE_M, s * .45, .25, .42, c);
      bx(.12, .045, .62, PINE_M, s * .46, .52, .16, c);
      mesh(DOT_G, RED_DOT, s * .505, .38, .42, c, false); mesh(DOT_G, RED_DOT, s * .505, .2, .42, c, false);
    });
    for (var i = 0; i < 5; i++) bx(.78, .035, .13, PINE_M, 0, .34 - i * .02, .38 - i * .15, c).rotation.x = .1;
    var back = new THREE.Group(); back.position.set(0, .22, -.36); back.rotation.x = -.5; c.add(back);
    for (var j = 0; j < 6; j++) bx(.86, .14, .035, PINE_M, 0, .1 + j * .155, 0, back);
    [-1, 1].forEach(function(s){ bx(.07, .98, .07, PINE_M, s * .4, .5, -.05, back); });
    mesh(STEN_G, BRAND_INK, 0, .875, .02, back, false, false);
    return c;
  }
  // tauleta baixa de fusta amb un test
  function lowTable(x, z, ry){
    var t = new THREE.Group(); t.position.set(x, 0, z); t.rotation.y = ry || 0; S.add(t);
    for (var i = 0; i < 5; i++) bx(.19, .045, .62, PINE_M, -.4 + i * .2, .4, 0, t);
    bx(.98, .1, .06, PINE_M, 0, .32, .26, t); bx(.98, .1, .06, PINE_M, 0, .32, -.26, t);
    [-1, 1].forEach(function(s){ [-1, 1].forEach(function(u){ bx(.08, .44, .08, PINE_M, s * .4, .2, u * .2, t).rotation.z = s * .22; mesh(DOT_G, RED_DOT, s * .4, .3, u * .245, t, false); }); });
    mesh(new THREE.CylinderGeometry(.15, .12, .26, 18), std('#C97B4E', .85), 0, .55, 0, t);
    for (var k = 0; k < 10; k++) mesh(LEAF_G, LEAF_M, 0, .82, 0, t).rotation.set(rr(-.9, .9), rr(0, 6.3), rr(-.9, .9));
    return t;
  }
  // gandula plegable de lona vermella
  function deckChair(x, z, ry){
    var c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = ry; S.add(c);
    var sl = new THREE.Group(); sl.position.set(0, .55, -.15); sl.rotation.x = -.6; c.add(sl);
    bx(.52, 1.05, .02, CANVAS, 0, 0, 0, sl);
    [-1, 1].forEach(function(s){ bx(.04, 1.18, .04, TEAK, s * .29, 0, 0, sl); });
    mesh(BRAND_G, BRAND_W, 0, .25, -.013, sl, false, false).rotation.y = Math.PI;
    [-1, 1].forEach(function(s){
      bx(.04, .52, .04, TEAK, s * .29, .26, .2, c).rotation.x = -.25;
      bx(.04, .95, .04, TEAK, s * .31, .44, -.42, c).rotation.x = .38;
    });
    bx(.62, .04, .04, TEAK, 0, .5, -.6, c, false);
    return c;
  }
  // jardinera de fusta amb herbes (i espígol)
  function planter(x, z, len, ry, flowers){
    var p = new THREE.Group(); p.position.set(x, 0, z); p.rotation.y = ry || 0; S.add(p);
    for (var i = 0; i < 3; i++) bx(len, .15, .52, PINE_M, 0, .085 + i * .16, 0, p);
    bx(len - .08, .04, .44, std('#4A3424', .95), 0, .47, 0, p, false);
    var n = Math.max(2, Math.round(len * 3));
    for (var k = 0; k < n; k++) {
      var px = -len / 2 + .22 + k * (len - .44) / (n - 1);
      mesh(BUSH_G, pick(GREENS), px, .6, rr(-.1, .1), p).scale.set(1, rr(1.1, 1.7), 1);
      if (flowers) for (var f = 0; f < 3; f++) mesh(SPIKE_G, LAV, px + rr(-.12, .12), .84, rr(-.12, .12), p, false);
    }
    return p;
  }

  // racó de butaques de palet (fons esquerra)
  palletChair(-12.5, -10.3, .75); palletChair(-9.9, -10.3, -.75); lowTable(-11.2, -9.5, 0);
  // gandules a la cantonada de davant, mirant cap a la font
  deckChair(-14.6, 8.4, 2.1); deckChair(-13.2, 9.5, 2.35);
  // jardineres que tanquen la terrassa i decoren la vora
  planter(11.2, -4.9, 3.2, 0, true); planter(7.7, -9.9, 3, Math.PI / 2, false);
  planter(15.4, 7.6, 3, Math.PI / 2, true); planter(-16, 3.2, 2.6, Math.PI / 2, false);

  // caixes de cervesa de plàstic vermell, amb el nom als costats i ampolles a la de dalt
  var CRATE_M = std('#6E0309', .8), CRATE_IN = std('#3A0105', .9), CR_GLASS = std('#1E0A02', .35, .1), SLOT_M = std('#3A0408', .8);
  var CR = { w: .58, h: .3, d: .4 };
  var NECK_G = new THREE.CylinderGeometry(.02, .044, .1, 8), TOP_G = new THREE.CylinderGeometry(.019, .021, .08, 8), CAP_G = new THREE.CylinderGeometry(.024, .024, .016, 8);
  function crate(p, y, ry, full){
    var c = new THREE.Group(); c.position.y = y; c.rotation.y = ry; p.add(c);
    var t = .028, W = CR.w, H = CR.h, D = CR.d;
    bx(W, .03, D, CRATE_IN, 0, .015, 0, c);
    [-1, 1].forEach(function(s){
      bx(W, H, t, CRATE_M, 0, H / 2, s * (D - t) / 2, c);
      bx(t, H, D - t * 2, CRATE_M, s * (W - t) / 2, H / 2, 0, c);
      // nom als costats llargs i nansa als curts
      var lg = mesh(BRAND_G, BRAND_W, 0, H * .45, s * (D / 2 + .002), c, false, false); if (s < 0) lg.rotation.y = Math.PI;
      bx(.006, .05, .16, SLOT_M, s * (W / 2 + .001), H - .065, 0, c, false, false);
      // nervis horitzontals que marquen la vora
      bx(W + .012, .03, t + .012, CRATE_M, 0, H - .015, s * (D - t) / 2, c, false);
      bx(t + .012, .03, D, CRATE_M, s * (W - t) / 2, H - .015, 0, c, false);
    });
    if (full) for (var i = 0; i < 4; i++) for (var j = 0; j < 3; j++) {
      var bxp = -W / 2 + .08 + i * (W - .16) / 3, bzp = -D / 2 + .08 + j * (D - .16) / 2;
      mesh(NECK_G, CR_GLASS, bxp, H - .03, bzp, c, false);
      mesh(TOP_G, CR_GLASS, bxp, H + .06, bzp, c, false);
      mesh(CAP_G, BOTTLE.capM, bxp, H + .105, bzp, c, false);
    }
    return c;
  }
  // pila de `n` caixes una mica desquadrades; només la de dalt porta ampolles a la vista
  function crateStack(x, z, ry, n, full){
    var g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry || 0; S.add(g);
    for (var k = 0; k < n; k++) crate(g, k * (CR.h + .005), rr(-.12, .12), full !== false && k === n - 1);
    return g;
  }
  // al costat de l'escenari, de la barra, de les terrasses i a les cantonades
  crateStack(-4.9, -11.4, .2, 3); crateStack(-4.3, -10.8, -.3, 1, false); crateStack(5, -11.5, -.15, 2);
  crateStack(-15.1, -1.7, .5, 2); crateStack(-14.5, -1.1, .9, 1);
  crateStack(12.4, -12.1, .1, 3, false); crateStack(13, -11.5, .6, 1);
  crateStack(12.6, 10.8, -.4, 2); crateStack(13.3, 11.2, .3, 1, false);
  crateStack(-12.3, 10.7, .25, 1); crateStack(8.5, 9.4, -.6, 1);

  // parada de l'enquesta
  var kiosk = new THREE.Group(); kiosk.position.set(-13, 0, -4.5); kiosk.rotation.y = .55; S.add(kiosk); kiosk.userData.action = 'survey';
  // barra de fusta vermella amb pèrgola, canyís i llums, com les terrasses Damm
  bx(3.6, 1.1, 1.1, REDPLANK, 0, .55, 0, kiosk);
  bx(3.8, .07, 1.3, PINE_M, 0, 1.135, .05, kiosk);
  mesh(new THREE.PlaneGeometry(2.6, .55), new THREE.MeshStandardMaterial({ map: textTex('ENQUESTA', { bg: '#F6EBD9', fg: '#9E0C24', font: '800 76px Figtree, sans-serif' }), roughness: .6 }), 0, .62, .556, kiosk, false);
  bx(3.6, 2.5, .12, REDPLANK, 0, 1.25, -1.45, kiosk);
  mesh(BRAND_G, BRAND_W, 0, 2.15, -1.385, kiosk, false, false).scale.setScalar(2.2);
  var BOT_G = new THREE.CylinderGeometry(.045, .05, .26, 10), BOT_M = std('#5A2E0E', .2, .1);
  [1.0, 1.6].forEach(function(y){ bx(3.0, .05, .22, PINE_M, 0, y, -1.3, kiosk); for (var b = 0; b < 9; b++) mesh(BOT_G, BOT_M, -1.28 + b * .32, y + .155, -1.3, kiosk, false); });
  [[-1.85, .6], [1.85, .6], [-1.85, -1.45], [1.85, -1.45]].forEach(function(p){ bx(.14, 3.2, .14, PINE_M, p[0], 1.6, p[1], kiosk); });
  bx(4.0, .14, .16, PINE_M, 0, 3.2, .6, kiosk); bx(4.0, .14, .16, PINE_M, 0, 3.2, -1.45, kiosk);
  for (var rf = 0; rf < 8; rf++) bx(.08, .1, 2.5, PINE_M, -1.75 + rf * .5, 3.32, -.42, kiosk);
  bx(3.9, .03, 2.3, std('#D6BD86', .95), 0, 3.39, -.42, kiosk);
  mesh(new THREE.CylinderGeometry(.15, .15, 3.9, 16), std('#B3121C', .92), 0, 3.0, .7, kiosk).rotation.z = Math.PI / 2;
  (function(){
    var pts = [], a = V(-1.85, 2.78, .74), b = V(1.85, 2.78, .74);
    for (var i = 0; i <= 13; i++) { var t = i / 13, p = a.clone().lerp(b, t); p.y -= 4 * .28 * t * (1 - t); pts.push(p); if (i > 0 && i < 13) mesh(new THREE.SphereGeometry(.065, 8, 6), i % 2 ? bulbA : bulbB, p.x, p.y - .1, p.z, kiosk, false, false); }
    kiosk.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: '#3A3230' })));
  })();
  var bang = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.bang, depthWrite: false })); bang.position.set(0, 4.5, .2); kiosk.add(bang);
  anims.push(function(dt, t){ bang.position.y = 4.5 + Math.sin(t * 3) * .14; });
  pickables.push(kiosk);
  makePerson(kiosk, people, { x: 0, z: -.85, skin: '#F2C7A5', hair: '#2E1F17', shirt: '#C8102E', hairStyle: 0, logo: true, wave: true, rot: 0 });

  // bústia d'idees
  var box = new THREE.Group(); box.position.set(15, 0, -2.5); box.rotation.y = -.8; S.add(box); box.userData.action = 'idea';
  var red = std('#C8102E', .35, .15);
  mesh(new THREE.CylinderGeometry(.09, .11, 1.1, 10), std('#2E2A28', .5, .5), 0, .55, 0, box);
  bx(1.1, 1.0, .8, red, 0, 1.6, 0, box);
  var topM = mesh(new THREE.CylinderGeometry(.4, .4, 1.1, 24, 1, false, 0, Math.PI), red, 0, 2.1, 0, box); topM.rotation.z = Math.PI / 2;
  bx(.62, .06, .04, std('#3A0610', .6), 0, 1.85, .41, box, false);
  mesh(new THREE.PlaneGeometry(.9, .32), new THREE.MeshStandardMaterial({ map: textTex('IDEES', { w: 256, h: 96, bg: '#C8102E', fg: '#FFFFFF', font: '800 56px Figtree, sans-serif' }), roughness: .4 }), 0, 1.4, .41, box, false);
  pickables.push(box);

  // ---------- LA BARRA: cerveses de Damm (pèrgola de fusta, canyís, para-sol enrotllat i garlandes) ----------
  // Els noms van amb tipografia genèrica; els logotips oficials es poden posar més endavant.
  var bartenders = [];
  (function(){
    var g = new THREE.Group(); g.position.set(0, 0, -12.2); S.add(g); g.userData.action = 'stage';
    var BW = 9.6, ZF = 1.6, ZB = -2.1; // amplada, front del taulell i paret del fons (relatius al grup)
    var post = PINE_M, reed = new THREE.MeshStandardMaterial({ roughness: .95, side: THREE.DoubleSide, map: makeTex(256, 128, function(gg, W, H){
      gg.fillStyle = '#C9A877'; gg.fillRect(0, 0, W, H);
      for (var x = 0; x < W; x += 3) { gg.fillStyle = pick(['#B8945F', '#D8BC8A', '#A9844F', '#E2C89A']); gg.fillRect(x, 0, 2, H); }
      for (var y = 10; y < H; y += 28) { gg.fillStyle = 'rgba(90,60,30,.35)'; gg.fillRect(0, y, W, 2); }
    }) });
    // tarima i paret del fons de llistons vermells
    bx(BW + .6, .12, 4.6, PINE_M, 0, .06, -.2, g, false);
    bx(BW, 3.7, .25, REDPLANK, 0, 1.85, ZB, g);
    [-1, 1].forEach(function(sd){ bx(.25, 3.7, 2.2, REDPLANK, sd * (BW / 2 - .12), 1.85, ZB + 1.1, g); });
    // taulell: llistons vermells, sobre de fusta i una línia de llum càlida sota la vora
    bx(BW - .4, 1.05, .7, REDPLANK, 0, .52, ZF, g);
    bx(BW - .1, .08, 1.0, PINE_M, 0, 1.09, ZF - .1, g);
    bx(BW - .5, .04, .04, std('#FFE3A6', .4, 0, { emissive: '#FFB54D', emissiveIntensity: 1.1 }), 0, .99, ZF + .42, g, false);
    mesh(new THREE.PlaneGeometry(3.6, .5), new THREE.MeshStandardMaterial({ map: letterTex('La Barra', '#FFFFFF', 'italic 400 170px "DM Serif Display", Georgia, serif', 1024, 160), transparent: true, depthWrite: false }), -1.6, .55, ZF + .36, g, false, false);
    // tiradors: un per cada cervesa de barril, amb el disc del color de l'etiqueta i les inicials
    var taps = DAMM_BEERS.filter(function(b){ return b.tap; }), chrome = std('#D9DDE2', .18, .95);
    taps.forEach(function(b, i){
      var x = -3.9 + i * (7.8 / (taps.length - 1));
      mesh(new THREE.CylinderGeometry(.045, .055, .42, 10), chrome, x, 1.34, ZF - .25, g, false);
      bx(.05, .05, .2, chrome, x, 1.5, ZF - .16, g, false);
      var badge = mesh(new THREE.CircleGeometry(.12, 20), new THREE.MeshStandardMaterial({ roughness: .4, map: makeTex(96, 96, function(gg, W, H){
        gg.clearRect(0, 0, W, H); gg.fillStyle = '#FFFFFF'; gg.beginPath(); gg.arc(48, 48, 47, 0, Math.PI * 2); gg.fill();
        gg.fillStyle = b.label; gg.beginPath(); gg.arc(48, 48, 41, 0, Math.PI * 2); gg.fill();
        gg.fillStyle = b.ink; gg.font = '800 30px Figtree, sans-serif'; gg.textAlign = 'center'; gg.textBaseline = 'middle';
        gg.fillText(b.name.replace(/[^A-Za-zÀ-ÿ ]/g, '').split(' ').map(function(w){ return w[0]; }).join('').slice(0, 2).toUpperCase(), 48, 50);
      }), transparent: true }), x, 1.72, ZF - .24, g, false, false);
      bx(.03, .2, .03, std('#1F1A18', .5), x, 1.58, ZF - .24, g, false);
    });
    // gots apilats al taulell
    for (var cs = 0; cs < 3; cs++) for (var ch = 0; ch < 4; ch++) mesh(new THREE.CylinderGeometry(.075, .06, .17, 10), std('#EEF3F5', .2, 0, { transparent: true, opacity: .7 }), 3.6 + cs * .2, 1.21 + ch * .1, ZF - .3, g, false);
    // prestatges amb una ampolla de cada cervesa (etiqueta del seu color)
    var labG = new THREE.CylinderGeometry(.052, .052, .08, 12, 1, true);
    // etiqueta amb textura (els colors de textura surten fidels; un color de material es veuria pàl·lid)
    var LABC = {};
    function labM(b){ return LABC[b.key] || (LABC[b.key] = new THREE.MeshStandardMaterial({ roughness: .55, map: makeTex(64, 32, function(gg, W, H){ gg.fillStyle = b.label; gg.fillRect(0, 0, W, H); gg.fillStyle = b.ink; gg.fillRect(0, H * .42, W, H * .16); }) })); }
    [1.55, 2.15, 2.75].forEach(function(y, row){
      bx(3.9, .06, .32, PINE_M, -2.5, y, ZB + .3, g);
      for (var k = 0; k < 9; k++) {
        var b = DAMM_BEERS[(row * 9 + k) % DAMM_BEERS.length], bx0 = -4.2 + k * .42;
        var bo = new THREE.Group(); bo.position.set(bx0, y + .03, ZB + .3); bo.scale.setScalar(1.55); g.add(bo);
        mesh(BOTTLE.glass, b.key === 'free' || b.key === 'lemon' ? std('#3E6B2A', .15, .1) : BOTTLE.glassM, 0, 0, 0, bo, false);
        mesh(labG, labM(b), 0, .1, 0, bo, false);
        mesh(BOTTLE.cap, BOTTLE.capM, 0, .307, 0, bo, false);
      }
    });
    // jardineres de fusta apilades amb herbes (al mig de la paret)
    [1.4, 2.2, 3.0].forEach(function(y){ bx(.9, .32, .32, PINE_M, .25, y, ZB + .28, g); for (var p = 0; p < 3; p++) mesh(BUSH_G, pick(GREENS), -.05 + p * .3, y + .25, ZB + .28, g).scale.set(.9, .8, .9); });
    // estrella daurada i nom (tipografia genèrica) a la dreta, com a la foto
    var st = star3d(.42, .1, std('#E6B422', .28, .75)); st.position.set(2.75, 3.15, ZB + .2); g.add(st);
    mesh(new THREE.PlaneGeometry(2.4, .6), new THREE.MeshStandardMaterial({ map: letterTex('DAMM', '#FFFFFF', '800 200px Figtree, sans-serif', 1024, 256), transparent: true, depthWrite: false }), 2.75, 2.55, ZB + .14, g, false, false);
    // carta amb totes les cerveses (es pot llegir apropant-s'hi)
    var cartaT = makeTex(1024, 560, function(gg, W, H){
      gg.fillStyle = '#F7F4EC'; gg.fillRect(0, 0, W, H); gg.fillStyle = '#2E6B4E'; gg.fillRect(0, 0, W, 86);
      gg.fillStyle = '#FFFFFF'; gg.font = '800 50px Figtree, sans-serif'; gg.textAlign = 'left'; gg.textBaseline = 'middle'; gg.fillText('CERVESES DAMM', 30, 45);
      var half = Math.ceil(DAMM_BEERS.length / 2);
      DAMM_BEERS.forEach(function(b, i){
        var col = i < half ? 0 : 1, row = i % half, x = 30 + col * 500, y = 120 + row * 50;
        gg.fillStyle = b.label; gg.beginPath(); gg.arc(x + 12, y, 12, 0, Math.PI * 2); gg.fill();
        gg.fillStyle = '#1F1A18'; gg.font = '700 32px Figtree, sans-serif'; gg.fillText(b.name, x + 34, y + 2);
        if (b.tap) { gg.fillStyle = '#2E6B4E'; gg.font = '700 22px Figtree, sans-serif'; gg.fillText('BARRIL', x + 380, y + 2); }
      });
    });
    bx(2.5, 1.42, .06, std('#2E6B4E', .6), 2.75, 1.62, ZB + .14, g, false);
    mesh(new THREE.PlaneGeometry(2.4, 1.32), new THREE.MeshStandardMaterial({ map: cartaT, roughness: .7 }), 2.75, 1.62, ZB + .18, g, false, false);
    // pèrgola de fusta amb canyís i para-sol vermell enrotllat
    [[-BW / 2, ZF + .15], [BW / 2, ZF + .15], [-BW / 2, ZB], [BW / 2, ZB], [0, ZF + .15]].forEach(function(p){ bx(.2, 4, .2, post, p[0], 2, p[1], g); });
    [ZF + .15, ZB].forEach(function(z){ bx(BW + .6, .22, .22, post, 0, 4.05, z, g); });
    for (var cb = -2; cb <= 2; cb++) bx(.14, .16, ZF - ZB + .8, post, cb * BW / 4.2, 4.22, (ZF + ZB) / 2, g);
    var roofP = mesh(new THREE.PlaneGeometry(BW + .4, ZF - ZB + .7), reed, 0, 4.32, (ZF + ZB) / 2, g); roofP.rotation.x = -Math.PI / 2 + .06;
    var roll = mesh(new THREE.CylinderGeometry(.24, .24, BW + .3, 18), CANVAS, 0, 3.78, ZF + .3, g); roll.rotation.z = Math.PI / 2;
    for (var rr2 = -4; rr2 <= 4; rr2 += .5) mesh(new THREE.TorusGeometry(.245, .02, 4, 16), std('#7A0A14', .8), rr2, 3.78, ZF + .3, g, false).rotation.y = Math.PI / 2;
    // cartells de preus penjats dels pals
    [-BW / 2 + .5, BW / 2 - .5].forEach(function(x){
      bx(.9, .6, .04, std('#FFFFFF', .6), x, 3.15, ZF + .3, g, false); bx(.9, .14, .045, std('#2E6B4E', .6), x, 3.4, ZF + .3, g, false);
    });
    // garlandes de llums sota la pèrgola
    var bulbBar = std('#FFF1C4', .3, 0, { emissive: '#FFC86B', emissiveIntensity: 1 });
    [[ZF + .2, .5], [ZB + .4, .35]].forEach(function(r){
      catenary(g, V(-BW / 2, 3.95, r[0]), V(BW / 2, 3.95, r[0]), r[1], 20).forEach(function(p, i){ if (i % 2 === 0) mesh(BULB_G, bulbBar, p.x, p.y - .1, p.z, g, false, false); });
    });
    pickables.push(g);
  })();
  // cambrers darrere el taulell i gent fent una canya
  [[-2.4, -12.1, 0], [1.6, -12.2, 0]].forEach(function(p, i){
    var c = makePerson(S, people, { x: p[0], z: p[1], rot: p[2], skin: ['#EFC3A1', '#B57A52'][i], hair: ['#2E1F17', '#5A3A22'][i], shirt: '#C8102E', hairStyle: i ? 3 : 1, logo: true });
    bartenders.push(c);
  });
  [[-3.3, -9.65, '#F4EFE6', true], [-1.0, -9.6, '#E86A1C', false], [.6, -9.65, '#8FBF6A', true], [3.2, -9.6, '#5C7C8A', true]].forEach(function(p, i){
    makePerson(S, people, { x: p[0], z: p[1], rot: Math.PI, skin: ['#F6D7C3', '#D9A074', '#8A5A3B', '#EFC3A1'][i], hair: ['#5A3A22', '#2E1F17', '#1D1D24', '#D9B15A'][i], shirt: p[2], hairStyle: i % 4, beer: p[3], talk: !p[3] });
  });

  // coloms
  var pigeons = [];
  [[2.2, 3.4], [2.9, 3.8], [-2.4, 3.6]].forEach(function(p){
    var g = new THREE.Group(); g.position.set(p[0], 0, p[1]); g.rotation.y = rnd() * 6; S.add(g);
    mesh(new THREE.SphereGeometry(.12, 12, 10), std('#8D93A0', .7), 0, .15, 0, g).scale.set(1, .85, 1.5);
    var hd = new THREE.Group(); hd.position.set(0, .24, .14); g.add(hd);
    mesh(new THREE.SphereGeometry(.065, 10, 8), std('#5E6573', .6), 0, 0, 0, hd);
    g.userData.ph = rnd() * 6; pigeons.push({ g: g, hd: hd });
  });
  anims.push(function(dt, t){ pigeons.forEach(function(p){ p.hd.rotation.x = Math.sin(t * 5 + p.g.userData.ph) > .6 ? .9 : 0; }); });

  // gent: cinc grups ben separats, cadascun amb el seu missatge
  var SK = ['#F6D7C3', '#EFC3A1', '#D9A074', '#B57A52', '#8A5A3B', '#5E3B26'];
  var HR = ['#2E1F17', '#5A3A22', '#A8642F', '#1D1D24', '#D9B15A', '#8B8B92'];
  var SH = ['#C8102E', '#1E2A44', '#F4EFE6', '#7A0C1E', '#3A3532', '#B08A45', '#5C7C8A'];
  function pair(cx, cz, a, b){
    makePerson(S, people, Object.assign({ x: cx - .65, z: cz - .2, face: [cx + .65, cz + .2] }, a));
    makePerson(S, people, Object.assign({ x: cx + .65, z: cz + .2, face: [cx - .65, cz - .2] }, b));
  }
  pair(-10.5, 4.5, { skin: SK[2], hair: HR[3], shirt: SH[0], hairStyle: 1, logo: true, beer: true, talk: true }, { skin: SK[1], hair: HR[4], shirt: SH[5], hairStyle: 2 });
  pair(-5, -7.6, { skin: SK[4], hair: HR[0], shirt: SH[2], hairStyle: 0, logo: true, talk: true }, { skin: SK[1], hair: HR[5], shirt: SH[4], hairStyle: 3 });
  pair(3.6, 6, { skin: SK[0], hair: HR[2], shirt: SH[0], hairStyle: 3, logo: true, talk: true }, { skin: SK[5], hair: HR[3], shirt: SH[2], hairStyle: 2, logo: true, beer: true });
  // terrassa davant del bar: taules amb para-sols i cadires de director
  terraceSet(10, -10.6, 0, { 2: { skin: SK[0], hair: HR[2], shirt: SH[2], hairStyle: 1, logo: true, beer: true }, 1: { skin: SK[3], hair: HR[0], shirt: SH[1], hairStyle: 0 } });
  terraceSet(13.9, -7.6, .3, { 3: { skin: SK[4], hair: HR[3], shirt: SH[0], hairStyle: 0, logo: true, beer: true } });
  // dues taules més a tocar de la font, perquè la terrassa es vegi des de la vista inicial
  terraceSet(-8.7, -.4, .35, { 2: { skin: SK[1], hair: HR[1], shirt: SH[0], hairStyle: 2, logo: true, beer: true } });
  terraceSet(8.6, .2, -.3, { 2: { skin: SK[2], hair: HR[5], shirt: SH[4], hairStyle: 3 }, 3: { skin: SK[5], hair: HR[0], shirt: SH[0], hairStyle: 1, logo: true, beer: true } });
  pair(11, 4.8, { skin: SK[3], hair: HR[1], shirt: SH[6], hairStyle: 1, beer: true, talk: true }, { skin: SK[1], hair: HR[0], shirt: SH[0], hairStyle: 0, logo: true });
  makePerson(S, people, { x: 0, z: 0, skin: SK[2], hair: HR[4], shirt: SH[1], hairStyle: 1, speed: .9, path: [[-5, -2], [-3.5, 2], [0, 3.6], [3.5, 2], [5, -2], [3.5, -6], [-3.5, -6]] });

  // =========== FESTA DE LA SETMANA: el que es veu a l'escena segons la participació a la Plaça ===========
  // 25 % garlandes · 40 % bancs nous · 60 % s'obre el teló i toca un grup · 75 % focs artificials

  // bancs nous (fusta i ferro vermell), davant de la font
  var newBenches = new THREE.Group(); newBenches.userData.keep = true; S.add(newBenches);
  [[-3.1, 1.3], [3.1, 1.3]].forEach(function(p){
    var b = new THREE.Group(); b.position.set(p[0], 0, p[1]); b.rotation.y = Math.atan2(-p[0], -2 - p[1]); newBenches.add(b);
    var iron = std('#B3121C', .45, .4);
    for (var i = 0; i < 4; i++) bx(1.9, .06, .13, PINE_M, 0, .47, -.2 + i * .14, b);
    for (var j = 0; j < 2; j++) bx(1.9, .12, .05, PINE_M, 0, .7 + j * .16, -.3, b).rotation.x = -.12;
    [-.8, .8].forEach(function(x){ bx(.07, .47, .5, iron, x, .235, -.03, b); bx(.07, .55, .06, iron, x, .75, -.3, b); });
    mesh(STEN_G, BRAND_INK, 0, .79, -.27, b, false, false).scale.setScalar(.8);
  });

  // focs artificials (partícules)
  var FW_B = 3, FW_P = 90, FWN = FW_B * FW_P;
  var fwPos = new Float32Array(FWN * 3), fwVel = new Float32Array(FWN * 3), fwCol = new Float32Array(FWN * 3), fwLife = new Float32Array(FW_B), fwBase = [];
  for (var fi2 = 0; fi2 < FWN; fi2++) fwPos[fi2 * 3 + 1] = -100;
  var fwG = new THREE.BufferGeometry(); fwG.setAttribute('position', new THREE.BufferAttribute(fwPos, 3)); fwG.setAttribute('color', new THREE.BufferAttribute(fwCol, 3));
  var fw = new THREE.Points(fwG, new THREE.PointsMaterial({ size: .95, map: T.glow, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  fw.frustumCulled = false; fw.visible = false; S.add(fw);
  var FWC = [new THREE.Color('#FFD45C'), new THREE.Color('#FF4D5E'), new THREE.Color('#FFFFFF'), new THREE.Color('#7FD3FF')];
  var fwOn = false;
  function fireworks(){
    if (RM) return;
    for (var b = 0; b < FW_B; b++) launch(b);
    fwOn = true; fw.visible = true;
  }
  function launch(b){
    var cx = (Math.random() - .5) * 18, cy = 11 + Math.random() * 4, cz = -9 + Math.random() * 6, c = FWC[Math.floor(Math.random() * FWC.length)];
    fwBase[b] = c; fwLife[b] = 1.8;
    for (var i = 0; i < FW_P; i++) {
      var k = (b * FW_P + i) * 3, u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u), sp = 4.5 + Math.random() * 3;
      fwPos[k] = cx; fwPos[k + 1] = cy; fwPos[k + 2] = cz; fwVel[k] = r * Math.cos(a) * sp; fwVel[k + 1] = u * sp; fwVel[k + 2] = r * Math.sin(a) * sp;
    }
  }
  anims.push(function(dt, t){
    // cambrers tirant canyes: el braç baixa cap al tirador i torna
    if (!RM) bartenders.forEach(function(b, i){ var k = Math.max(0, Math.sin(t * 1.1 + i * 2.1)); b.userData.P.shR.rotation.x = -1.1 * k; b.userData.P.shL.rotation.x = -.4 * k; });
    if (!fwOn) return;
    for (var b = 0; b < FW_B; b++) {
      if (fwLife[b] <= 0) continue;
      fwLife[b] -= dt; var L = Math.max(0, fwLife[b] / 1.8), col = fwBase[b];
      for (var i = 0; i < FW_P; i++) {
        var k = (b * FW_P + i) * 3;
        fwVel[k] *= .985; fwVel[k + 1] = fwVel[k + 1] * .985 - 2.4 * dt; fwVel[k + 2] *= .985;
        fwPos[k] += fwVel[k] * dt; fwPos[k + 1] += fwVel[k + 1] * dt; fwPos[k + 2] += fwVel[k + 2] * dt;
        fwCol[k] = col.r * L; fwCol[k + 1] = col.g * L; fwCol[k + 2] = col.b * L;
        if (fwLife[b] <= 0) fwPos[k + 1] = -100;
      }
    }
    fwG.attributes.position.needsUpdate = true; fwG.attributes.color.needsUpdate = true;
    if (!fwLife.some(function(life){ return life > 0; })) { fwOn = false; fw.visible = false; }
  });
  function setFesta(p){
    garland.visible = true;
    newBenches.visible = true;
  }

  // tu
  var me = { obj: null };
  var ring = mesh(new THREE.RingGeometry(.48, .6, 48), new THREE.MeshBasicMaterial({ color: '#C8102E', transparent: true, opacity: .85, depthWrite: false }), 0, .03, 8.5, S, false, false); ring.rotation.x = -Math.PI / 2;
  anims.push(function(dt, t){ var s = 1 + Math.sin(t * 3) * .08; ring.scale.set(s, s, s); });
  var meAnchor = V(0, 2.25, 8.5);
  function rebuildMe(o){
    var px = 0, pz = 8.5, pr = 0;
    if (me.obj) { px = me.obj.position.x; pz = me.obj.position.z; pr = me.obj.rotation.y; S.remove(me.obj); people.splice(people.indexOf(me.obj), 1); }
    me.obj = makePerson(S, people, { x: px, z: pz, skin: o.skin, hair: o.hair, shirt: o.shirt, hairStyle: o.style, logo: o.logo, rot: pr });
    me.obj.userData.wave = true;
    setTimeout(function(){ if (me.obj) { me.obj.userData.wave = false; me.obj.userData.P.shR.rotation.z = .12; } }, 2600);
  }

  // confeti
  var CN = 320, cpos = new Float32Array(CN * 3), cvel = new Float32Array(CN * 3), ccol = new Float32Array(CN * 3);
  var cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(cpos, 3)); cg.setAttribute('color', new THREE.BufferAttribute(ccol, 3));
  var conf = new THREE.Points(cg, new THREE.PointsMaterial({ size: .2, vertexColors: true, transparent: true, opacity: 1, depthWrite: false })); conf.visible = false; S.add(conf);
  var confT = 0;
  function burst(){
    var cols = [new THREE.Color('#C8102E'), new THREE.Color('#F6EFE2'), new THREE.Color('#D4B26A')];
    for (var i = 0; i < CN; i++) { cpos[i * 3] = 0; cpos[i * 3 + 1] = 2.8; cpos[i * 3 + 2] = -2; var a = Math.random() * 6.28, sp = 1.5 + Math.random() * 4; cvel[i * 3] = Math.cos(a) * sp; cvel[i * 3 + 1] = 5 + Math.random() * 5; cvel[i * 3 + 2] = Math.sin(a) * sp; var c = cols[i % 3]; ccol[i * 3] = c.r; ccol[i * 3 + 1] = c.g; ccol[i * 3 + 2] = c.b; }
    cg.attributes.color.needsUpdate = true; confT = 4.5; conf.visible = true;
  }
  anims.push(function(dt){
    if (confT <= 0) return; confT -= dt;
    for (var i = 0; i < CN; i++) { cvel[i * 3 + 1] -= 9 * dt; if (cpos[i * 3 + 1] > .05) { cpos[i * 3] += cvel[i * 3] * dt; cpos[i * 3 + 1] += cvel[i * 3 + 1] * dt; cpos[i * 3 + 2] += cvel[i * 3 + 2] * dt; } }
    cg.attributes.position.needsUpdate = true; conf.material.opacity = Math.min(1, confT); if (confT <= 0) conf.visible = false;
  });

  anims.push(function(dt, t){ animPeople(people, dt, t); });

  // ---------- caminar per la plaça ----------
  // Zona caminable i obstacles (cercles [x, z, radi]): font, taules, barra, bústia, racó de butaques i fanals.
  var WALK = [-14.5, 14.5, -9.2, 13.8];
  var OBST = [[0, -2, 3.9], [-8.7, -.4, 1.6], [8.6, .2, 1.6], [10, -10.6, 1.6], [13.9, -7.6, 1.6], [-13, -4.5, 2.7], [15, -2.5, 1], [-11.2, -9.9, 2], [11.2, -4.9, 1.8],
    [-7, -8, .4], [7, -8, .4], [-3.1, 1.3, 1], [3.1, 1.3, 1], [-7.5, 8.5, .4], [7.5, 8.5, .4], [-14, 9, 1.3],
    [-4.7, -11.1, .8], [5, -11.5, .5], [-14.8, -1.4, .8], [12.7, -11.8, .7], [12.9, 11, .7], [-12.3, 10.7, .45], [8.5, 9.4, .45]];
  function outOfObstacles(x, z){
    for (var i = 0; i < OBST.length; i++) { var c = OBST[i], ex = x - c[0], ez = z - c[1], d = Math.sqrt(ex * ex + ez * ez); if (d < c[2]) { if (d < 1e-3) { ex = 1; ez = 0; d = 1; } x = c[0] + ex / d * c[2]; z = c[1] + ez / d * c[2]; } }
    return [Math.min(Math.max(x, WALK[0]), WALK[1]), Math.min(Math.max(z, WALK[2]), WALK[3])];
  }
  function walkTo(x, z){
    if (!me.obj || !me.obj.visible) return false;
    var p = outOfObstacles(x, z); me.obj.userData.go = V(p[0], 0, p[1]); me.obj.userData.wave = false; return true;
  }
  anims.push(function(dt){
    var o = me.obj; if (!o) return;
    var u = o.userData, P = u.P;
    if (u.go) {
      var dx = u.go.x - o.position.x, dz = u.go.z - o.position.z, L = Math.sqrt(dx * dx + dz * dz);
      if (L < .08) { u.go = null; P.hipL.rotation.x = P.hipR.rotation.x = P.shL.rotation.x = P.shR.rotation.x = 0; o.position.y = 0; }
      else {
        var st = Math.min(L, 3.4 * dt), nx = o.position.x + dx / L * st, nz = o.position.z + dz / L * st;
        var q = outOfObstacles(nx, nz);
        // si un obstacle ens bloqueja de cara, l'envoltem pel costat
        if (Math.hypot(q[0] - o.position.x, q[1] - o.position.z) < st * .3) q = outOfObstacles(o.position.x - dz / L * st, o.position.z + dx / L * st);
        if (Math.hypot(q[0] - o.position.x, q[1] - o.position.z) < 1e-4) u.go = null;
        o.position.x = q[0]; o.position.z = q[1];
        o.rotation.y += angDiff(Math.atan2(dx, dz), o.rotation.y) * Math.min(1, dt * 10);
      }
    }
    ring.position.x = o.position.x; ring.position.z = o.position.z; meAnchor.set(o.position.x, 2.25, o.position.z);
  });

  // a la vista de RRHH no hi ha "tu": s'amaga el personatge i l'anella
  function showMe(on){ ring.visible = on; if (me.obj) me.obj.visible = on; }
  return { scene: S, anims: anims, pickables: pickables, rebuildMe: rebuildMe, burst: burst, fireworks: fireworks, showMe: showMe, walkTo: walkTo, setFesta: setFesta,
    // la càmera segueix el personatge mentre camina
    follow: function(){ return me.obj && me.obj.visible && me.obj.userData.go ? me.obj.position : null; },
    me: function(){ return me.obj && me.obj.visible ? me.obj.position : null; },
    // bounds: on pot anar el punt de mira [xmin, xmax, zmin, zmax]; azim: gir màxim a cada costat
    view: { pos: V(0, 16, 32), target: V(0, 5, -2), min: 5, max: 36, polar: 1.4, bounds: [-11, 11, -9, 9], azim: .62,
      // la càmera no pot entrar dins dels edificis laterals ni del fons
      keepIn: function(p){ var mx = 15 + Math.max(0, p.z - 13) * 1.1; p.x = Math.min(Math.max(p.x, -mx), mx); if (p.z < -9) p.z = -9; if (p.y < 1.2) p.y = 1.2; } },
    bubbleAnchors: [V(-10.5, 2.35, 4.5), V(-5, 2.35, -7.6), V(3.6, 2.35, 6), V(12, 3.75, -9.1), V(11, 2.35, 4.8)],
    anchors: { kiosk: V(-13, 5.2, -4.5), idea: V(15, 2.9, -2.5), stage: V(0, 5.4, -12.2), me: meAnchor } };
}

// =====================================================
//  DAMM WORLD · inspirat en les fàbriques reals
// =====================================================
function buildWorld(){
  var W_SELF = null;
  var S = new THREE.Scene();
  skyDome(S, '#5FA6E0', '#EAF0EE');
  S.environment = envFrom('#9CC8E6', '#DCE6E2');
  S.fog = new THREE.Fog('#DCE7EA', 280, 650);
  sunLight(S, [70, 95, 50], 78, 2.05, SMALL ? 1024 : 2048);
  var anims = [], people = [], pickables = [], zones = {}, moving = [];
  people.lowPoly = true;
  var BLOB_G = new THREE.PlaneGeometry(1, 1), BLOB_M = new THREE.MeshBasicMaterial({ map: T.soft, color: '#000000', transparent: true, opacity: .32, depthWrite: false });
  function blob(obj, w, l, cz){ var b = mesh(BLOB_G, BLOB_M, 0, .08, cz || 0, obj, false, false); b.rotation.x = -Math.PI / 2; b.scale.set(w, l, 1); return b; }
  var IX = 58, IZ = 43, m4 = new THREE.Matrix4();
  function zone(name){ var g = new THREE.Group(); g.userData.zone = name; S.add(g); pickables.push(g); zones[name] = g; return g; }
  function cyl(rt, rb, h, seg, open, ts, tl){ return new THREE.CylinderGeometry(rt, rb, h, seg || 24, 1, !!open, ts || 0, tl == null ? Math.PI * 2 : tl); }
  function beam(a, b, w, h, mat, parent){ var m = mesh(geoBox(w, h, a.distanceTo(b)), mat, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2, parent); m.lookAt(b); return m; }
  var red = std('#C8102E', .45, .15), steel = std('#D3D8DE', .2, .9), copper = std('#C9733D', .28, .85);
  var dk = std('#24262B', .6, .4), metalGrey = std('#8E949C', .45, .6), cream = std('#EDE3D0', .8), concrete = std('#DCD6CB', .92);
  var gold = std('#E6B422', .28, .75);
  var met = new THREE.MeshStandardMaterial({ map: rep(T.metal, 10, 2), roughness: .45, metalness: .5 });
  var glass = new THREE.MeshStandardMaterial({ color: '#A9CBDD', roughness: .04, metalness: .3, transparent: true, opacity: .24, depthWrite: false });
  var glassD = std('#2B3A47', .08, .6);
  var inner = std('#EFE8DC', .9, 0, { side: THREE.BackSide });
  var RAILM = new THREE.MeshStandardMaterial({ map: T.rail, transparent: true, alphaTest: .4, side: THREE.DoubleSide, roughness: .5, metalness: .5 });
  var crM = std('#C98F4F', .85);
  function sign(text, w, h, x, y, z, parent, o){ o = o || {}; var p = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: textTex(text, { w: o.tw || 1024, h: o.th || 160, bg: o.bg || '#7A0C1E', fg: o.fg || '#F3E6CF', font: o.font || '400 92px "DM Serif Display", Georgia, serif' }), roughness: .6, side: THREE.DoubleSide }), x, y, z, parent, false); if (o.ry) p.rotation.y = o.ry; return p; }
  function letters(text, w, h, col, font){
    var t = makeTex(1024, Math.round(1024 * h / w), function(g, W, H){ g.clearRect(0, 0, W, H); g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(0,0,0,.25)'; g.fillText(text, W / 2 + 6, H / 2 + 10); g.fillStyle = col; g.fillText(text, W / 2, H / 2 + 4); });
    return new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: .4, depthWrite: false, side: THREE.DoubleSide });
  }
  function starGeo(R, r, depth){
    var s = new THREE.Shape();
    for (var i = 0; i < 10; i++) { var a = Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r : R; if (i) s.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); else s.moveTo(Math.cos(a) * rad, Math.sin(a) * rad); }
    s.closePath();
    var g = new THREE.ExtrudeGeometry(s, { depth: depth, bevelEnabled: true, bevelThickness: depth * .5, bevelSize: R * .07, bevelSegments: 2 }); g.center(); return g;
  }
  var ribTex = makeTex(256, 64, function(g, w, h){ for (var x = 0; x < w; x += 16) { var gr = g.createLinearGradient(x, 0, x + 16, 0); gr.addColorStop(0, '#F3F5F7'); gr.addColorStop(.45, '#C2C8CF'); gr.addColorStop(.55, '#9AA2AC'); gr.addColorStop(1, '#E6E9EC'); g.fillStyle = gr; g.fillRect(x, 0, 16, h); } }, 1, 1);
  var redPanel = makeTex(256, 256, function(g, w, h){ g.fillStyle = '#B3121C'; g.fillRect(0, 0, w, h); for (var y = 0; y < h; y += 32) for (var x = 0; x < w; x += 64) { var gr = g.createLinearGradient(x, y, x, y + 32); gr.addColorStop(0, '#C8161F'); gr.addColorStop(1, '#A90F18'); g.fillStyle = gr; g.fillRect(x + 1, y + 1, 62, 30); } speckle(g, w, h, 1500, ['#000', '#fff'], .05); }, 1, 1);

  // ---------- aigua i illa ----------
  var wgeo = new THREE.PlaneGeometry(640, 640, 40, 40);
  var water = mesh(wgeo, new THREE.MeshStandardMaterial({ color: '#4F8EA3', roughness: .16, metalness: .25 }), 0, -2.6, 0, S, false, true); water.rotation.x = -Math.PI / 2;
  var wp = wgeo.attributes.position, fN = 0;
  var wN = 0;
  anims.push(function(dt, t){ if (RM || (wN++ % 3)) return; for (var i = 0; i < wp.count; i++) { var x = wp.getX(i), y = wp.getY(i); wp.setZ(i, Math.sin(x * .1 + t * 1.1) * .25 + Math.cos(y * .09 + t * .8) * .25); } wp.needsUpdate = true; if ((fN++ & 3) === 0) wgeo.computeVertexNormals(); });
  var side = new THREE.MeshStandardMaterial({ map: rep(T.earth, 10, 1), roughness: 1 });
  var top = new THREE.MeshStandardMaterial({ map: rep(T.grass, 44, 32), roughness: 1 });
  mesh(new THREE.BoxGeometry(IX * 2 + 2, 10, IZ * 2 + 2), [side, side, top, side, side, side], 0, -5, 0, S, true, true);

  // ---------- carreteres ----------
  var road = new THREE.MeshStandardMaterial({ map: rep(T.asphalt, 40, 3), roughness: .85 });
  var walk = std('#D8D0C2', .85), dash = std('#F4F1EA', .6);
  bx(IX * 2, .06, 7, road, 0, .03, -3, S, false);
  bx(7, .062, 42.5, road, 16, .031, 21.75, S, false);
  bx(IX * 2, .14, 1, walk, 0, .07, -7, S); bx(70, .14, 1, walk, -23, .07, 1, S); bx(38, .14, 1, walk, 39, .07, 1, S);
  bx(1, .14, 42, walk, 12, .07, 22, S); bx(1, .14, 42, walk, 20, .07, 22, S);
  for (var x = -56; x <= 56; x += 3.4) if (Math.abs(x - 16) > 5) bx(1.6, .02, .16, dash, x, .07, -3, S, false);
  for (var z = 3; z <= 42; z += 3.4) bx(.16, .02, 1.6, dash, 16, .072, z, S, false);
  // fanals al llarg de l'avinguda
  for (var lx = -52; lx <= 52; lx += 13) { mesh(cyl(.09, .12, 7, 10), metalGrey, lx, 3.5, -7.6, S); bx(.25, .2, 1.4, metalGrey, lx, 7, -7.0, S); }

  // ---------- via i tren ----------
  bx(IX * 2, .18, 3.8, std('#8E8579', 1), 0, .09, -40.4, S, false);
  [-39.7, -41.1].forEach(function(z){ bx(IX * 2, .14, .14, std('#6B6E75', .35, .8), 0, .28, z, S, false); });
  var slp = new THREE.InstancedMesh(geoBox(.4, .12, 2.6), std('#5C4433', .9), 58);
  for (var i = 0; i < 58; i++) { m4.makeTranslation(-57 + i * 2, .2, -40.4); slp.setMatrixAt(i, m4); }
  slp.receiveShadow = true; slp.frustumCulled = false; S.add(slp);
  var train = new THREE.Group(); S.add(train);
  bx(9, 3, 2.6, red, 0, 2.2, 0, train); bx(2.8, 1.5, 2.6, red, 2.6, 4.45, 0, train);
  bx(2.84, .6, 2.64, std('#1F2A35', .05, .7), 2.6, 4.55, 0, train, false); bx(9.1, .35, 2.7, std('#F4EFE6', .5), 0, 1.5, 0, train, false);
  for (var wg = 0; wg < 3; wg++) {
    var wx = -10.4 - wg * 10;
    bx(9, 2.6, 2.6, std('#B08A45', .55, .4), wx, 2.4, 0, train); bx(8.6, .12, 2.2, std('#D9B97A', .9), wx, 3.66, 0, train, false);
    [wx - 3, wx + 3].forEach(function(px){ [-1.1, 1.1].forEach(function(pz){ var wl = mesh(cyl(.45, .45, .3, 14), dk, px, .65, pz, train); wl.rotation.x = Math.PI / 2; }); });
  }
  anims.push(function(dt, t){ train.position.set(8 + (RM ? 0 : Math.sin(t * .05)) * 20, 0, -40.4); });
  moving.push(train); blob(train, 44, 4.4).position.x = -15.6;

  // ---------- vehicles ----------
  function semi(){
    var g = new THREE.Group(); blob(g, 3.6, 13.5, -.4);
    bx(2.5, 3, 10, new THREE.MeshStandardMaterial({ map: rep(redPanel, 3, 1), roughness: .5 }), 0, 2.4, -1.6, g);
    bx(2.52, .35, 10.02, std('#F4EFE6', .5), 0, 1.2, -1.6, g, false);
    bx(2.4, 2.4, 2.2, std('#C8102E', .35, .2), 0, 1.9, 4.6, g);
    bx(2.2, .9, .06, std('#1F2A35', .05, .7), 0, 2.4, 5.72, g, false);
    var wgG = cyl(.48, .48, .34, 18), wm = std('#1C1C1E', .85);
    [-5.6, -4.4, -3.2, 3.6, 5].forEach(function(z){ [-1, 1].forEach(function(s){ var w = mesh(wgG, wm, s * 1.15, .48, z, g); w.rotation.z = Math.PI / 2; }); });
    return g;
  }
  function truck(col, cargo){
    var g = new THREE.Group(); blob(g, 3, 7.4, .2);
    bx(2, 2.2, 4.6, std(cargo || '#F4F5F7', .45, .1), 0, 1.65, -.7, g); bx(2.02, .28, 4.62, red, 0, 1.15, -.7, g, false);
    bx(2, 1.6, 1.5, std(col, .35, .2), 0, 1.25, 2.4, g); bx(1.8, .65, .06, std('#1F2A35', .05, .7), 0, 1.6, 3.16, g, false);
    var wgG = cyl(.42, .42, .32, 18), wm = std('#1C1C1E', .85);
    [-2.3, -1, 2.4].forEach(function(z){ [-1, 1].forEach(function(s){ var w = mesh(wgG, wm, s * .95, .42, z, g); w.rotation.z = Math.PI / 2; }); });
    return g;
  }
  function van(col){ var g = new THREE.Group(); blob(g, 2.8, 5.2); bx(1.8, 1.8, 3.8, std(col, .4, .15), 0, 1.15, 0, g); bx(1.6, .55, .06, std('#1F2A35', .05, .7), 0, 1.55, 1.92, g, false); bx(1.82, .22, 3.82, std('#F4F5F7', .5), 0, .9, 0, g, false); [-1.2, 1.2].forEach(function(z){ [-1, 1].forEach(function(s){ var w = mesh(cyl(.34, .34, .26, 16), std('#1C1C1E', .85), s * .85, .34, z, g); w.rotation.z = Math.PI / 2; }); }); return g; }
  function car(col){ var g = new THREE.Group(); bx(1.7, .7, 3.8, std(col, .3, .4), 0, .65, 0, g); bx(1.5, .6, 2, std('#25313C', .05, .6), 0, 1.25, -.2, g); [-1.2, 1.2].forEach(function(z){ [-1, 1].forEach(function(s){ var w = mesh(cyl(.3, .3, .22, 14), std('#1C1C1E', .85), s * .8, .3, z, g); w.rotation.z = Math.PI / 2; }); }); return g; }
  function forklift(){
    var g = new THREE.Group();
    bx(1.1, .9, 1.6, std('#E8A21B', .45), 0, .75, 0, g); bx(.9, .8, .7, std('#2A2D33', .3, .4), 0, 1.6, -.3, g);
    bx(.08, 2.4, .08, dk, -.35, 1.2, .9, g); bx(.08, 2.4, .08, dk, .35, 1.2, .9, g);
    bx(1.2, .15, 1.0, std('#2F6FB3', .6), 0, .55, 1.5, g); bx(1, .8, .9, crM, 0, 1.0, 1.5, g);
    [-1, 1].forEach(function(s){ [-.5, .5].forEach(function(z){ var w = mesh(cyl(.25, .25, .2, 14), std('#1C1C1E', .85), s * .58, .25, z, g); w.rotation.z = Math.PI / 2; }); });
    return g;
  }
  function mover(obj, path, speed, off){
    moving.push(obj);
    var pts = path.map(function(p){ return V(p[0], 0, p[1]); }), lens = [], total = 0;
    for (var i = 0; i < pts.length; i++) { var l = pts[i].distanceTo(pts[(i + 1) % pts.length]); lens.push(l); total += l; }
    S.add(obj);
    anims.push(function(dt, t){
      var d = ((RM ? 0 : t * speed) + off * total) % total, i = 0;
      while (d > lens[i]) { d -= lens[i]; i++; }
      var a = pts[i], b = pts[(i + 1) % pts.length];
      obj.position.lerpVectors(a, b, d / lens[i]); obj.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
    });
  }

  // ---------- fars d'estat dels equips ----------
  // Cada zona porta al terrat un far del color de l'emoció predominant (dada agregada, mai individual)
  // i un got que s'omple de cervesa segons la participació. Si hi ha alertes, hi parpelleja un avís.
  var BEACON_C = { happy: '#06701E', uneasy: '#C77A00', stressed: '#B00C08', nodata: '#59626C', lock: '#59626C' };
  var WARN_TEX = makeTex(128, 128, function(g){
    g.clearRect(0, 0, 128, 128);
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(64, 6); g.lineTo(124, 116); g.lineTo(4, 116); g.closePath(); g.fill();
    g.fillStyle = '#F2B01E'; g.beginPath(); g.moveTo(64, 20); g.lineTo(112, 108); g.lineTo(16, 108); g.closePath(); g.fill();
    g.fillStyle = '#2B201C'; g.font = '900 64px Figtree, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', 64, 76);
  });
  var B_MAST = new THREE.CylinderGeometry(.16, .22, 4.2, 10), B_BASE = new THREE.CylinderGeometry(.9, 1.1, .5, 18);
  var B_LAMP = new THREE.SphereGeometry(1.05, 24, 16), B_CAGE = new THREE.TorusGeometry(1.12, .08, 6, 24), B_CAP = new THREE.ConeGeometry(.75, .55, 18);
  var B_GLASS = new THREE.CylinderGeometry(.95, .78, 6, 24, 1, true), B_BEER = new THREE.CylinderGeometry(.86, .7, 1, 24), B_FOAM = new THREE.CylinderGeometry(.9, .9, .4, 24);
  var METAL = std('#3A3D42', .45, .6), GLASS_M = new THREE.MeshStandardMaterial({ color: '#E8F2F6', transparent: true, opacity: .16, roughness: .08, depthWrite: false, side: THREE.DoubleSide });
  var BEER_W = std('#8E3E02', .3, 0, { emissive: '#2A1000', emissiveIntensity: .5 }), FOAM_W = std('#FFF8EA', .9);
  var beacons = {};
  function beacon(key, x, y, z){
    var g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(1.7); g.userData.keep = true; S.add(g);
    // pal amb el llum
    mesh(B_BASE, METAL, 0, .25, 0, g);
    mesh(B_MAST, METAL, 0, 2.5, 0, g);
    var lampM = new THREE.MeshBasicMaterial({ color: '#FFFFFF', toneMapped: false });
    var lamp = mesh(B_LAMP, lampM, 0, 5.4, 0, g, false);
    [0, Math.PI / 2].forEach(function(r){ mesh(B_CAGE, METAL, 0, 5.4, 0, g, false).rotation.y = r; });
    mesh(B_CAP, METAL, 0, 6.65, 0, g, false);
    var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.soft, color: '#FFFFFF', transparent: true, opacity: .7, depthWrite: false, fog: false }));
    glow.position.y = 5.4; glow.scale.set(7, 7, 1); g.add(glow);
    // got de participació: s'omple segons el percentatge real, sense marca d'objectiu.
    var cup = new THREE.Group(); cup.position.set(2.6, .25, 0); g.add(cup);
    mesh(B_BASE, METAL, 0, 0, 0, cup).scale.set(1, .4, 1);
    var beer = mesh(B_BEER, BEER_W, 0, .5, 0, cup, false);
    var foam = mesh(B_FOAM, FOAM_W, 0, 1, 0, cup, false);
    mesh(B_GLASS, GLASS_M, 0, 3.1, 0, cup, false, false);
    var warn = new THREE.Sprite(new THREE.SpriteMaterial({ map: WARN_TEX, transparent: true, depthWrite: false, fog: false }));
    warn.position.set(-1.9, 6.6, 0); warn.scale.set(2.6, 2.6, 1); warn.visible = false; g.add(warn);
    var B = beacons[key] = { g: g, lamp: lamp, glow: glow, beer: beer, foam: foam, warn: warn, mood: 'nodata', fill: 0, target: 0, ph: x * .37 };
    set(B, 'nodata', 0, false);
    return B;
  }
  function set(B, mood, part, alert){
    var c = BEACON_C[mood] || BEACON_C.nodata;
    B.mood = mood; B.lamp.material.color.set(c); B.glow.material.color.set(c);
    B.target = Math.max(0, Math.min(1, part / 100)); B.warn.visible = !!alert;
  }
  function paintFill(B){
    var h = Math.max(.02, B.fill * 5.9);
    B.beer.scale.y = h; B.beer.position.y = .1 + h / 2;
    B.foam.position.y = .1 + h + .12; B.foam.visible = B.fill > .01;
  }
  function setZones(list){
    if (W_SELF) W_SELF.shadowDirty = true;
    Object.keys(beacons).forEach(function(k){ beacons[k].g.visible = false; });
    (list || []).forEach(function(z){
      var B = beacons[z.key] || beacons[ZONE_DEPT[z.sceneKey || z.key]];
      if (!B || z.absent) return;
      B.g.visible = true; set(B, z.mood, z.participation || 0, z.alerts > 0);
    });
  }

  anims.push(function(dt, t){
    Object.keys(beacons).forEach(function(k){
      var B = beacons[k], fast = B.mood === 'stressed';
      // el got s'omple a poc a poc quan arriben dades noves
      if (Math.abs(B.fill - B.target) > .002) { B.fill += (B.target - B.fill) * Math.min(1, dt * 2.2); paintFill(B); }
      var p = RM ? .5 : .5 + .5 * Math.sin(t * (fast ? 4.2 : 1.6) + B.ph);
      B.glow.material.opacity = B.mood === 'nodata' ? .2 : .35 + p * .4;
      var gs = (B.mood === 'nodata' ? 4 : 6) + p * (fast ? 2.6 : 1.4); B.glow.scale.set(gs, gs, 1);
      if (B.warn.visible) { var w = RM ? 1 : .55 + .45 * Math.abs(Math.sin(t * 2.6)); B.warn.material.opacity = w; B.warn.position.y = 6.6 + (RM ? 0 : Math.sin(t * 2.6) * .15); }
    });
  });

  // =========== RECEPCIÓ DE MALTA ===========
  var A = zone('malta');
  bx(14, .1, 16, concrete, -51, .05, -31, A, false);
  [-54, -49].forEach(function(x){ [-34.5, -29.5].forEach(function(z){
    mesh(cyl(2.2, 2.2, 12, 28), steel, x, 7.4, z, A); mesh(new THREE.ConeGeometry(2.3, 2, 28), steel, x, 14.4, z, A);
    mesh(cyl(2.2, .5, 1.4, 24), steel, x, .9, z, A);
    [4.5, 8.5, 12].forEach(function(y){ mesh(new THREE.TorusGeometry(2.22, .06, 6, 36), metalGrey, x, y, z, A, false).rotation.x = Math.PI / 2; });
  }); });
  bx(2.6, 18, 2.6, std('#B9BEC5', .5, .5), -45.5, 9, -32, A); bx(3.4, 2.4, 3.4, red, -45.5, 19, -32, A);
  beam(V(-49, 16, -32), V(-45.5, 18, -32), 1, 1, metalGrey, A);
  beam(V(-45.5, 17, -32), V(-38, 22, -32), 1.2, 1.2, metalGrey, A);
  var gt = truck('#C8102E', '#B08A45'); gt.position.set(-50, 0, -23.5); gt.rotation.y = Math.PI / 2; A.add(gt);

  // =========== FERMENTACIÓ · filera de tancs ===========
  var C = zone('fermentacio');
  bx(40, .1, 14, concrete, -21, .05, -31, C, false);
  bx(38, 1.4, 9.6, cream, -21, .7, -31.8, C); bx(38.2, .35, 9.8, red, -21, 1.25, -31.8, C, false);
  var ribM = new THREE.MeshStandardMaterial({ map: rep(ribTex, 9, 1), roughness: .26, metalness: .88 }), domeM = std('#D7DCE1', .22, .88);
  [[-34.5, -29.4, 9], [-36.3, -34.2, 10]].forEach(function(row){
    for (var k = 0; k < row[2]; k++) {
      var tx = row[0] + k * 3.65, tz = row[1];
      mesh(cyl(1.75, 1.75, 19, 30), ribM, tx, 10.9, tz, C);
      mesh(new THREE.SphereGeometry(1.75, 26, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeM, tx, 20.4, tz, C).scale.y = .78;
      mesh(cyl(.25, .25, .6, 10), domeM, tx, 21.9, tz, C);
      mesh(new THREE.TorusGeometry(1.77, .06, 6, 36), metalGrey, tx, 2.2, tz, C, false).rotation.x = Math.PI / 2;
    }
  });
  bx(36, .2, 1.4, metalGrey, -19.7, 21.6, -31.8, C);
  mesh(new THREE.PlaneGeometry(36, 1), RAILM, -19.7, 22.2, -31.1, C, false, false); mesh(new THREE.PlaneGeometry(36, 1), RAILM, -19.7, 22.2, -32.5, C, false, false);
  var tower = new THREE.Group(); tower.position.set(-1.2, 0, -31.8); C.add(tower);
  [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]].forEach(function(p){ bx(.18, 23, .18, dk, p[0], 11.5, p[1], tower); });
  for (var ty = 2.5; ty <= 22.5; ty += 2.5) { bx(2.6, .12, .12, dk, 0, ty, 1.2, tower, false); bx(2.6, .12, .12, dk, 0, ty, -1.2, tower, false); bx(.12, .12, 2.6, dk, 1.2, ty, 0, tower, false); bx(.12, .12, 2.6, dk, -1.2, ty, 0, tower, false); }
  for (var ty2 = 0; ty2 < 22.5; ty2 += 2.5) { beam(V(-1.2, ty2, 1.2), V(1.2, ty2 + 2.5, 1.2), .08, .08, dk, tower); beam(V(1.2, ty2, -1.2), V(1.2, ty2 + 2.5, 1.2), .08, .08, dk, tower); }
  sign('FERMENTACIÓ', 8, 1, -21, .75, -26.94, C, { bg: '#C8102E', fg: '#FFFFFF', font: '800 90px Figtree, sans-serif' });
  for (var px = -38; px <= 34; px += 8) { bx(.3, 8, .3, metalGrey, px, 4, -38.2, S); bx(.3, 8, .3, metalGrey, px, 4, -37, S); bx(.3, .3, 1.5, metalGrey, px, 8, -37.6, S); }
  [[-38, steel, .3], [-37.6, copper, .26], [-37.2, red, .2]].forEach(function(p){ var pp = mesh(cyl(p[2], p[2], 72, 14), p[1], -2, 8.4, p[0], S); pp.rotation.z = Math.PI / 2; });

  // =========== SALA DE COCCIÓ · l'antiga fàbrica ===========
  var B = zone('coccio');
  bx(26, .1, 20, concrete, 11, .05, -26, B, false);
  var stoneM = new THREE.MeshStandardMaterial({ map: stucco('#E8E0D0', 4), roughness: .85 });
  var brickUp = new THREE.MeshStandardMaterial({ map: rep(T.brick, 7, 3), roughness: .9 });
  mesh(new THREE.BoxGeometry(22, 6, 12), [stoneM, stoneM, stoneM, stoneM, glass, stoneM], 11, 3, -28, B);
  mesh(new THREE.BoxGeometry(21.8, 5.8, 11.8), inner, 11, 3, -28, B, false, true);
  bx(22, 8.4, 12, brickUp, 11, 10.2, -28, B);
  bx(22.6, .6, 12.6, cream, 11, 6.2, -28, B); bx(22.8, .8, 12.8, cream, 11, 14.6, -28, B);
  [-10.7, -6.5, -2.6, 2.6, 6.5, 10.7].forEach(function(dx){ bx(.7, 6, .5, stoneM, 11 + dx, 3, -21.85, B); });
  [-8.6, -4.55, 4.55, 8.6].forEach(function(dx){ for (var m = -1; m <= 1; m++) bx(.08, 5.6, .12, dk, 11 + dx + m * 1.1, 3, -21.95, B, false); bx(3.4, .08, .12, dk, 11 + dx, 4.4, -21.95, B, false); });
  bx(4.8, 8.8, 1, std('#DDD3C0', .85), 11, 4.4, -21.5, B);
  for (var by = .4; by < 8.6; by += .45) bx(4.82, .04, 1.02, std('#C9BEA9', .9), 11, by, -21.5, B, false);
  bx(1.9, 2.7, .12, glassD, 11, 2.35, -20.97, B, false);
  for (var st = 0; st < 3; st++) bx(4.4, .3, .6, std('#CFC6B6', .85), 11, .15 + st * .3, -20.4 + (2 - st) * .5, B);
  [-1.9, 1.9].forEach(function(dx){ beam(V(11 + dx, 1.9, -19.4), V(11 + dx, 1.3, -20.9), .06, .06, std('#B08A45', .3, .8), B); });
  var star1 = mesh(starGeo(.75, .32, .14), gold, 11, 5.4, -20.9, B, false);
  sign('ANTIGA FÀBRICA', 3.6, .55, 11, 4.4, -20.97, B, { tw: 768, th: 120, bg: '#DDD3C0', fg: '#8A6A25', font: '400 70px "DM Serif Display", Georgia, serif' });
  for (var wi = 0; wi < 14; wi++) { var wxx = 11 - 9.75 + wi * 1.5; if (Math.abs(wxx - 11) < 2) continue; bx(.95, 3.2, .1, cream, wxx, 10, -21.95, B, false); bx(.75, 3, .1, glassD, wxx, 10, -21.9, B, false); }
  bx(2.8, 2.6, .1, cream, 11, 10.2, -21.95, B, false); bx(2.4, 2.2, .1, glassD, 11, 10.2, -21.9, B, false);
  for (var sw = 0; sw < 6; sw++) { bx(.1, 3.2, .95, cream, 22.05, 10, -32.5 + sw * 1.6, B, false); bx(.1, 3, .75, glassD, 22.1, 10, -32.5 + sw * 1.6, B, false); }
  [-8.6, -4.55, 4.55, 8.6].forEach(function(dx){
    var kx = 11 + dx;
    mesh(cyl(1.4, 1.4, 3, 28), copper, kx, 1.6, -28.5, B); mesh(new THREE.SphereGeometry(1.4, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), copper, kx, 3.1, -28.5, B);
    mesh(cyl(.2, .2, 2.6, 12), copper, kx, 5.2, -28.5, B);
  });

  // =========== LOGÍSTICA · el cub vermell ===========
  var E = zone('logistica');
  bx(28, .1, 28, concrete, 44, .05, -22, E, false);
  var rp = new THREE.MeshStandardMaterial({ map: rep(redPanel, 6, 4), roughness: .55, metalness: .1 });
  bx(22, 5.2, 19, std('#3A3D44', .85), 44, 2.6, -26.5, E);
  bx(22, 15, 22, rp, 44, 12.7, -25, E);
  bx(22.8, 1.6, 23.2, std('#B5161F', .5, .1), 44, 20.6, -24.8, E);
  [36, 44, 52].forEach(function(x){ bx(.8, 5.2, .8, std('#BFC3C9', .6), x, 2.6, -14.5, E); });
  [38.5, 44, 49.5].forEach(function(x){ bx(3.4, 3.6, .1, std('#5B6068', .5, .4), x, 1.8, -16.95, E, false); });
  mesh(new THREE.PlaneGeometry(13, 4.4), letters('Damm', 13, 4.4, '#FFFFFF', '400 300px "DM Serif Display", Georgia, serif'), 44, 14, -13.95, E, false, false);
  var sideSign = mesh(new THREE.PlaneGeometry(13, 4.4), letters('Damm', 13, 4.4, '#FFFFFF', '400 300px "DM Serif Display", Georgia, serif'), 55.03, 14, -27, E, false, false); sideSign.rotation.y = Math.PI / 2;
  bx(.12, 13, 6, std('#7FA6C2', .05, .6), 55.05, 12.6, -17.5, E, false);
  var palG = geoBox(1.2, .16, 1), palM = std('#2F6FB3', .6), pals = [];
  [[38, -16], [39.4, -16], [48.6, -16], [50, -16], [51.4, -15.4]].forEach(function(c, ci){ var n = 6 + (ci % 3) * 3; for (var l = 0; l < n; l++) pals.push([c[0], .08 + l * .17, c[1]]); });
  var palI = new THREE.InstancedMesh(palG, palM, pals.length); pals.forEach(function(p, i){ m4.makeTranslation(p[0], p[1], p[2]); palI.setMatrixAt(i, m4); }); palI.castShadow = true; palI.frustumCulled = false; E.add(palI);
  var parked = semi(); parked.position.set(41, 0, -10.6); parked.rotation.y = Math.PI / 2; E.add(parked);
  var fk = forklift(); E.add(fk); moving.push(fk); blob(fk, 2, 3.4, .5);
  anims.push(function(dt, t){ var k = RM ? 0 : Math.sin(t * .5); fk.position.set(44 + k * 3.5, 0, -15.6); fk.rotation.y = Math.PI / 2 * (Math.cos(t * .5) > 0 ? 1 : -1); });

  // =========== ENVASAT ===========
  var D = zone('envasat');
  bx(24, .1, 18, concrete, 32, .05, 16, D, false);
  mesh(new THREE.BoxGeometry(20, 9, 13), [met, met, std('#5D6B80', .5, .4), met, glass, met], 32, 4.5, 15.5, D);
  mesh(new THREE.BoxGeometry(19.8, 8.8, 12.8), inner, 32, 4.5, 15.5, D, false, true);
  bx(20.4, 1.8, .4, red, 32, 8.1, 22.15, D);
  sign('ENVASAT', 7, 1.2, 32, 8.1, 22.4, D, { bg: '#C8102E', fg: '#FFFFFF', font: '800 96px Figtree, sans-serif' });
  for (var gx = 22.6; gx <= 41.4; gx += 2.35) bx(.14, 7, .18, dk, gx, 3.6, 22.05, D, false);
  bx(17, .25, .9, std('#2B2E35', .6, .2), 32.5, 1.25, 19.4, D);
  var bprof = [[0, 0], [.14, 0], [.15, .03], [.15, .45], [.1, .57], [.05, .68], [.05, .82], [.06, .84], [0, .84]].map(function(p){ return new THREE.Vector2(p[0], p[1]); });
  var bottleG = new THREE.LatheGeometry(bprof, 12), amber = std('#7A3E12', .1, .1);
  var NB = 48, bottles = new THREE.InstancedMesh(bottleG, amber, NB); bottles.castShadow = true; bottles.frustumCulled = false; D.add(bottles);
  anims.push(function(dt, t){ for (var i = 0; i < NB; i++) { var L = ((RM ? 0 : t * .05) + i / NB) % 1; m4.makeTranslation(24.6 + L * 15.6, 1.38, 19.4); bottles.setMatrixAt(i, m4); } bottles.instanceMatrix.needsUpdate = true; });
  var car0 = new THREE.Group(); car0.position.set(25.6, 0, 15.6); D.add(car0);
  mesh(cyl(1.3, 1.3, 1.2, 28), steel, 0, .6, 0, car0); var rot = new THREE.Group(); rot.position.y = 1.2; car0.add(rot);
  for (var cb = 0; cb < 12; cb++) { var a = cb / 12 * Math.PI * 2; mesh(bottleG, amber, Math.cos(a) * 1.05, 0, Math.sin(a) * 1.05, rot, false); }
  anims.push(function(dt, t){ rot.rotation.y = RM ? 0 : t * .8; });

  // =========== OFICINES · edifici històric amb torre ===========
  var F = zone('oficines');
  bx(32, .1, 26, std('#CFC8BC', .9), -41, .05, 22, F, false);
  var creamH = new THREE.MeshStandardMaterial({ map: stucco('#F3E7C8', 5), roughness: .9 });
  var ochre = std('#DE7A43', .8);
  var cx = -43, cz = 21, W = 26, Dp = 14, H = 15, front = cz + Dp / 2, east = cx + W / 2;
  bx(W, H, Dp, creamH, cx, H / 2, cz, F);
  bx(W + .2, 2.2, Dp + .2, ochre, cx, 1.1, cz, F);
  [5.8, 10.4].forEach(function(y){ bx(W + .3, .35, Dp + .3, ochre, cx, y, cz, F, false); });
  bx(W + .7, .9, Dp + .7, ochre, cx, H - .2, cz, F);
  for (var mx = cx - W / 2 + .5; mx <= cx + W / 2 - .4; mx += 1.6) { bx(.8, 1.1, .5, ochre, mx, H + .75, front + .1, F); bx(.8, 1.1, .5, ochre, mx, H + .75, cz - Dp / 2 - .1, F); }
  for (var mz = cz - Dp / 2 + .5; mz <= front - .4; mz += 1.6) { bx(.5, 1.1, .8, ochre, east + .1, H + .75, mz, F); bx(.5, 1.1, .8, ochre, cx - W / 2 - .1, H + .75, mz, F); }
  for (var pi = 0; pi <= 7; pi++) bx(.75, H - 2.6, .3, ochre, cx - W / 2 + pi * W / 7, 2.2 + (H - 2.6) / 2, front + .13, F, false);
  for (var pj = 0; pj <= 4; pj++) bx(.3, H - 2.6, .75, ochre, east + .13, 2.2 + (H - 2.6) / 2, cz - Dp / 2 + pj * Dp / 4, F, false);
  var arch = new THREE.CircleGeometry(.55, 18, 0, Math.PI), archO = new THREE.CircleGeometry(.75, 18, 0, Math.PI);
  function archWin(x, y, z, ry){
    var g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry || 0; F.add(g);
    bx(1.5, 1.7, .06, ochre, 0, -.05, 0, g, false); mesh(archO, ochre, 0, .8, .0, g, false, false);
    bx(1.1, 1.6, .08, glassD, 0, 0, .04, g, false); mesh(arch, glassD, 0, .8, .085, g, false, false);
    bx(1.1, .06, .1, cream, 0, 0, .1, g, false); bx(.06, 1.6, .1, cream, 0, 0, .1, g, false);
  }
  [3.7, 7.9, 12.1].forEach(function(y){
    for (var b = 0; b < 7; b++) archWin(cx - W / 2 + (b + .5) * W / 7, y, front + .02);
    for (var b2 = 0; b2 < 4; b2++) archWin(east + .02, y, cz - Dp / 2 + (b2 + .5) * Dp / 4, Math.PI / 2);
  });
  bx(13, 3.4, .7, ochre, cx, H + 1.7, front - .15, F);
  bx(13.6, .5, .9, std('#C9652F', .8), cx, H + 3.6, front - .15, F);
  sign('FÀBRICA DE CERVESA', 9, .95, cx, H + 2.75, front + .22, F, { tw: 1280, th: 136, bg: '#E8A86B', fg: '#5A2A14', font: '700 92px Figtree, sans-serif' });
  sign('S.A.  DAMM', 7.4, 1.25, cx, H + 1.25, front + .22, F, { tw: 1024, th: 172, bg: '#E8A86B', fg: '#3F1E0E', font: '800 128px Figtree, sans-serif' });
  [-5.4, 5.4].forEach(function(dx){ mesh(new THREE.CircleGeometry(.75, 28), cream, cx + dx, H + 1.8, front + .21, F, false, false); var s = mesh(starGeo(.5, .21, .08), std('#3F1E0E', .5), cx + dx, H + 1.8, front + .27, F, false); });
  // torre
  var tx0 = east - 3.2, tz0 = front - 3.2, TW = 5.6, TH = 27;
  bx(TW, TH, TW, creamH, tx0, TH / 2, tz0, F);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function(c){ bx(.7, TH - 2, .7, ochre, tx0 + c[0] * (TW / 2 - .15), TH / 2, tz0 + c[1] * (TW / 2 - .15), F); });
  [16.6, 20.8, 25].forEach(function(y){ bx(TW + .4, .4, TW + .4, ochre, tx0, y, tz0, F, false); });
  bx(TW + .9, .8, TW + .9, ochre, tx0, TH, tz0, F);
  for (var tm = -2.4; tm <= 2.5; tm += 1.2) { bx(.6, 1, .4, ochre, tx0 + tm, TH + .9, tz0 + TW / 2 + .2, F); bx(.6, 1, .4, ochre, tx0 + tm, TH + .9, tz0 - TW / 2 - .2, F); bx(.4, 1, .6, ochre, tx0 + TW / 2 + .2, TH + .9, tz0 + tm, F); bx(.4, 1, .6, ochre, tx0 - TW / 2 - .2, TH + .9, tz0 + tm, F); }
  [18.7, 22.9].forEach(function(y){ archWin(tx0, y, tz0 + TW / 2 + .02); archWin(tx0 + TW / 2 + .02, y, tz0, Math.PI / 2); });
  var board = new THREE.Group(); board.position.set(tx0, TH + 3.6, tz0); F.add(board);
  [[-1.8, -1.8], [1.8, -1.8], [-1.8, 1.8], [1.8, 1.8]].forEach(function(c){ bx(.12, 3, .12, dk, c[0], -1.5, c[1], board, false); });
  var boardM = std('#B8251E', .6);
  var bf = bx(5.6, 2.4, .18, boardM, 0, 0, 2.3, board); bx(5.9, .14, .2, gold, 0, 1.25, 2.3, board, false); bx(5.9, .14, .2, gold, 0, -1.25, 2.3, board, false);
  mesh(new THREE.PlaneGeometry(4.6, 1.8), letters('Damm', 4.6, 1.8, '#FFFFFF', '400 320px "DM Serif Display", Georgia, serif'), 0, -.05, 2.41, board, false, false);
  var bs = bx(.18, 2.4, 5.6, boardM, 2.3, 0, 0, board); bx(.2, .14, 5.9, gold, 2.3, 1.25, 0, board, false); bx(.2, .14, 5.9, gold, 2.3, -1.25, 0, board, false);
  var sideTxt = mesh(new THREE.PlaneGeometry(4.6, 1.8), letters('Damm', 4.6, 1.8, '#FFFFFF', '400 320px "DM Serif Display", Georgia, serif'), 2.41, -.05, 0, board, false, false); sideTxt.rotation.y = Math.PI / 2;
  mesh(cyl(.07, .07, 4, 8), metalGrey, 0, 3, 0, board);
  var bigStar = mesh(starGeo(1.8, .78, .45), gold, 0, 5.6, 0, board);
  anims.push(function(dt, t){ bigStar.rotation.y = RM ? .5 : t * .35; });
  tree(F, -54, 31.5, .85); tree(F, -46, 32.5, .8); tree(F, -38, 32.5, .85); tree(F, -30, 33, .8);
  ['#C8102E', '#F4F5F7', '#1E2A44', '#3A3532'].forEach(function(c, i){ var cc = car(c); cc.position.set(-55 + i * 3, 0, 38.5); F.add(cc); });

  // =========== COMERCIAL ===========
  var I = zone('comercial');
  bx(16, .1, 14, concrete, 49, .05, 33, I, false);
  bx(12, 6, 8, std('#F7F5F1', .6), 49.5, 3, 31, I);
  bx(11.2, 3.8, .1, glassD, 49.5, 2.2, 35.02, I, false);
  bx(12.2, 1.3, .3, red, 49.5, 5.1, 35.1, I);
  sign('COMERCIAL', 6, .9, 49.5, 5.1, 35.27, I, { bg: '#C8102E', fg: '#FFFFFF', font: '800 96px Figtree, sans-serif' });
  [[44.5, '#C8102E'], [47.8, '#F4F5F7'], [51.1, '#C8102E']].forEach(function(v){ var vv = van(v[1]); vv.position.set(v[0], 0, 39); vv.rotation.y = Math.PI; I.add(vv); });
  tree(S, 22.8, 41.5, .7); tree(S, 56, 20, .8);

  // =========== DETALLS DEL RECINTE ===========
  // Tot el que és estàtic es fusiona a freezeStatic(); el que es repeteix molt va amb InstancedMesh.
  function inst(geo, mat, list, shadow){
    var im = new THREE.InstancedMesh(geo, mat, list.length), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), p = new THREE.Vector3();
    list.forEach(function(o, i){ e.set(o[4] || 0, o[3] || 0, 0); q.setFromEuler(e); var k = o[5] || 1; sc.set(k, o[6] || k, k); p.set(o[0], o[1], o[2]); m4.compose(p, q, sc); im.setMatrixAt(i, m4); });
    im.castShadow = shadow !== false; im.receiveShadow = true; im.frustumCulled = false; S.add(im); return im;
  }
  var leafM = std('#5E9A3A', .92), leafM2 = std('#77AE4C', .92), flowerM = [std('#C8102E', .7), std('#F2C230', .7), std('#F4F1EA', .7), std('#9B6CC8', .7)];

  // --- vora de l'illa: platja i roques a la línia d'aigua ---
  bx(IX * 2 + 6, 2.2, IZ * 2 + 6, std('#D9C9A3', 1), 0, -3.2, 0, S, false, true);
  var rocks = [];
  for (var rk = 0; rk < 70; rk++) {
    var rs = rk % 4, u = rr(-1, 1), rx = rs < 2 ? u * (IX + 2) : (rs === 2 ? -1 : 1) * (IX + 2.4), rz = rs < 2 ? (rs ? -1 : 1) * (IZ + 2.4) : u * (IZ + 2);
    rocks.push([rx, -2.1, rz, rr(0, 6), rr(0, 3), rr(.6, 1.4), rr(.4, .8)]);
  }
  inst(new THREE.DodecahedronGeometry(1, 0), std('#9C9488', .95), rocks);

  // --- arbustos al llarg de les voreres i passos de zebra ---
  var bush = [];
  for (var hx = -55; hx <= 10; hx += 2.6) { bush.push([hx, .55, 2.1, 0, 0, rr(.75, 1), rr(.7, .9)]); }
  for (var hx2 = -55; hx2 <= 55; hx2 += 2.6) if (Math.abs(hx2 - 16) > 6) bush.push([hx2, .55, -8.4, 0, 0, rr(.7, .95), rr(.65, .85)]);
  for (var hz = 6; hz <= 41; hz += 2.6) { bush.push([10.9, .55, hz, 0, 0, rr(.7, .9), .75]); bush.push([21.1, .55, hz, 0, 0, rr(.7, .9), .75]); }
  inst(new THREE.SphereGeometry(1, 10, 8), leafM, bush);
  var zebra = [];
  for (var zb = 0; zb < 6; zb++) { zebra.push([13.5 + zb * 1, .075, 4.2]); zebra.push([-10, .075, -5.6 + zb * 1.05, Math.PI / 2]); zebra.push([30, .075, -5.6 + zb * 1.05, Math.PI / 2]); }
  inst(geoBox(.55, .02, 2.6), dash, zebra, false);

  // --- PARC CENTRAL amb el pavelló d'«Altres» ---
  // Distribució (x -25..10, z 4..42):
  //   nord-oest: pavelló d'Altres (serveis generals) amb terrassa davant · nord-est: parterres
  //   centre-est: plaça amb font · sud-oest: estany amb pont · sud-est: aparcament
  var stone = std('#D6CEC0', .8), waterM = std('#3C8FB0', .08, .3, { transparent: true, opacity: .85 });
  var tableM = std('#B5875A', .8), poleM = std('#E9E4DA', .5), umbM = std('#9C0D19', .85, 0, { side: THREE.DoubleSide });
  var paveM = std('#E4DCCD', .85), timber = std('#A8754A', .75), whiteW = std('#F4F1EA', .7);
  // camins: eix nord-sud des de l'avinguda fins a l'aparcament i eix est-oest per la plaça
  bx(2.6, .1, 25, walk, 2, .06, 16.5, S, false);
  bx(33, .1, 2.6, walk, -8.5, .061, 23, S, false);
  mesh(cyl(6, 6, .12, 40), paveM, 2, .07, 23, S, false);

  // ===== pavelló d'Altres: dues plantes, vidre a baix, llistons de fusta a dalt i coberta verda =====
  var O = zone('others');
  var OX = -14, OZ = 11.5, OW = 16, OD = 8;
  bx(OW + 3, .12, OD + 9, paveM, OX, .06, OZ + 2.5, O, false);
  // planta baixa de vidre amb pilars de fusta
  bx(OW, 3.4, OD, glassD, OX, 1.7, OZ, O);
  for (var op = 0; op <= 8; op++) bx(.35, 3.4, .35, timber, OX - OW / 2 + op * OW / 8, 1.7, OZ + OD / 2 + .05, O);
  // planta de dalt (volada) amb llistons
  bx(OW + 1.2, 3.2, OD + 1.2, whiteW, OX, 5.1, OZ, O);
  for (var sl = 0; sl < 34; sl++) bx(.16, 2.6, .12, timber, OX - OW / 2 - .3 + sl * (OW + .6) / 33, 5.1, OZ + OD / 2 + .66, O, false);
  bx(OW + 1.4, .3, OD + 1.4, std('#D9D3C7', .8), OX, 6.85, OZ, O);
  // coberta verda amb arbustos
  bx(OW + .6, .25, OD + .6, std('#6E9E45', .95), OX, 7.1, OZ, O, false);
  for (var gr = 0; gr < 14; gr++) mesh(new THREE.SphereGeometry(.5, 8, 6), pick([leafM, leafM2]), OX - OW / 2 + 1 + (gr % 7) * 2.2, 7.45, OZ - 2.4 + Math.floor(gr / 7) * 4.6, O).scale.y = .6;
  // marquesina d'entrada i rètol
  bx(5, .2, 2.4, whiteW, OX, 3.5, OZ + OD / 2 + 1.2, O); [-2.3, 2.3].forEach(function(dx){ bx(.15, 3.5, .15, timber, OX + dx, 1.75, OZ + OD / 2 + 2.3, O); });
  bx(7.4, 1.25, .12, std('#7A0C1E', .6), OX, 6.1, OZ + OD / 2 + .78, O, false);
  sign('ALTRES ÀREES', 7, 1, OX, 6.1, OZ + OD / 2 + .86, O, { tw: 1024, th: 146, bg: '#9C0D19', fg: '#FFFFFF', font: '800 100px Figtree, sans-serif' });
  // vidre de la porta i interior càlid
  bx(2.6, 2.6, .08, std('#FFE7B0', .4, 0, { emissive: '#FFC977', emissiveIntensity: .35 }), OX, 1.4, OZ + OD / 2 + .02, O, false);

  // terrassa del pavelló (cafeteria): taules de pícnic, para-sols i garlandes
  var umbG = new THREE.ConeGeometry(2.1, .75, 8, 1, true);
  var TABLES = [[-21, 19.5], [-15.5, 19.5], [-10, 19.5]];
  TABLES.forEach(function(p){
    var g = new THREE.Group(); g.position.set(p[0], 0, p[1]); S.add(g);
    bx(2.4, .1, 1, tableM, 0, .78, 0, g); [-.9, .9].forEach(function(dx){ bx(.1, .76, .9, tableM, dx, .38, 0, g, false); });
    [-.95, .95].forEach(function(dz){ bx(2.4, .08, .36, tableM, 0, .46, dz, g); bx(.08, .44, .3, tableM, -.9, .22, dz, g, false); bx(.08, .44, .3, tableM, .9, .22, dz, g, false); });
    mesh(cyl(.05, .05, 2.6, 8), poleM, 0, 1.3, 0, g, false); mesh(umbG, umbM, 0, 2.75, 0, g);
    for (var bt = 0; bt < 2; bt++) { var bb = mesh(BOTTLE.glass, BOTTLE.glassM, -.4 + bt * .8, .83, 0, g, false); bb.scale.setScalar(2.2); }
  });
  [[-21, 18.5, 0], [-15.5, 20.5, Math.PI], [-10, 18.5, 0], [-10.5, 20.5, Math.PI]].forEach(function(p, i){
    makePerson(S, people, { x: p[0], y: .02, z: p[1], seated: true, rot: p[2], beer: i !== 2, skin: pick(['#EFC3A1', '#B57A52', '#F6D7C3', '#8A5A3B']), shirt: pick(['#C8102E', '#F4EFE6', '#1E2A44', '#E8A21B']), hair: pick(['#2E1F17', '#5A3A22', '#D9B15A']), hairStyle: i % 4 }).scale.setScalar(1.15);
  });
  var GP = [[-23.5, 17.5], [-7.5, 17.5], [-7.5, 21.6], [-23.5, 21.6]], bulbs = [];
  GP.forEach(function(p){ mesh(cyl(.08, .1, 4.4, 8), dk, p[0], 2.2, p[1], S); });
  [[0, 1], [3, 2], [0, 3], [1, 2]].forEach(function(e){
    var p0 = V(GP[e[0]][0], 4.3, GP[e[0]][1]), p1 = V(GP[e[1]][0], 4.3, GP[e[1]][1]);
    catenary(S, p0, p1, .9, 16).forEach(function(q, qi){ if (qi % 2 === 0) bulbs.push([q.x, q.y - .12, q.z]); });
  });
  var bulbM = std('#FFF1C4', .3, 0, { emissive: '#FFC86B', emissiveIntensity: .9 });
  inst(new THREE.SphereGeometry(.13, 8, 6), bulbM, bulbs, false);
  anims.push(function(dt, t){ bulbM.emissiveIntensity = RM ? .9 : .75 + Math.sin(t * 2) * .25; });

  // ===== plaça amb font (centre-est) =====
  var PX = 2, PZ = 23;
  mesh(cyl(3.2, 3.4, .9, 36), stone, PX, .45, PZ, S); mesh(cyl(2.85, 2.85, .1, 36), waterM, PX, .82, PZ, S, false);
  mesh(cyl(.35, .5, 2.4, 14), stone, PX, 1.6, PZ, S); mesh(cyl(1.4, .5, .5, 24), stone, PX, 2.9, PZ, S); mesh(cyl(1.2, 1.2, .06, 24), waterM, PX, 3.13, PZ, S, false);
  var jetM = new THREE.MeshBasicMaterial({ color: '#E6F5FB', transparent: true, opacity: .6, depthWrite: false });
  var jet = mesh(cyl(.08, .22, 1.6, 10, true), jetM, PX, 3.9, PZ, S, false, false); jet.userData.keep = true;
  var drops = [];
  for (var dr = 0; dr < 8; dr++) { var dm = mesh(new THREE.SphereGeometry(.12, 8, 6), jetM, PX, 3, PZ, S, false, false); dm.userData.keep = true; drops.push(dm); }
  anims.push(function(dt, t){
    jet.scale.y = RM ? 1 : .85 + Math.sin(t * 6) * .15;
    drops.forEach(function(d, i){ var an = i / drops.length * Math.PI * 2, L = RM ? .5 : (t * .9 + i * .37) % 1; d.position.set(PX + Math.cos(an) * L * 1.5, 4.4 + L * 1.2 - L * L * 3.4, PZ + Math.sin(an) * L * 1.5); });
  });
  // bancs en cercle al voltant de la font
  for (var bn = 0; bn < 6; bn++) { if (bn % 3 === 0) continue; var ba = bn / 6 * Math.PI * 2 + Math.PI / 6; bench(S, PX + Math.cos(ba) * 4.9, PZ + Math.sin(ba) * 4.9, -ba - Math.PI / 2); }
  // parterres de flors (nord-est), entre l'avinguda i la plaça.
  // Els de l'oest queden centrats entre el paviment del pavelló (x -4,5) i el camí nord-sud (x 0,7),
  // amb ~0,6 de marge a cada costat perquè no toquin la planta volada (x -5,4).
  var flowers = [];
  [[-1.9, 9.5, 4, 4], [6.8, 9.5, 5, 4], [-1.9, 15, 4, 2.4], [6.8, 15, 5, 2.4]].forEach(function(bd){
    bx(bd[2], .45, bd[3], std('#7A5A3C', .9), bd[0], .22, bd[1], S);
    for (var fl = 0; fl < bd[2] * bd[3] * 1.4; fl++) flowers.push([bd[0] + rr(-bd[2] / 2 + .3, bd[2] / 2 - .3), .62, bd[1] + rr(-bd[3] / 2 + .3, bd[3] / 2 - .3), 0, 0, rr(.18, .28)]);
  });
  flowerM.forEach(function(fm, fi){ inst(new THREE.SphereGeometry(1, 6, 5), fm, flowers.filter(function(_, i){ return i % 4 === fi; }), false); });
  [[0, 5.5], [4, 5.5], [-6, 26.5], [6, 30], [-23, 26]].forEach(function(p){ lamp(S, p[0], p[1]); });

  // ===== estany amb pont (sud-oest) =====
  var pond = mesh(cyl(1, 1, .1, 40), waterM, -15, .1, 33.5, S, false); pond.scale.set(7.5, 1, 4.6);
  mesh(cyl(1, 1, .14, 40), std('#BDB4A2', .9), -15, .05, 33.5, S, false).scale.set(8.1, 1, 5.2);
  var bridge = new THREE.Group(); bridge.position.set(-15, 0, 33.5); bridge.rotation.y = Math.PI / 2; S.add(bridge);
  for (var pl = 0; pl < 11; pl++) bx(.5, .14, 2.2, tableM, -2.5 + pl * .5, .45 + Math.sin(pl / 10 * Math.PI) * .5, 0, bridge);
  [-1.1, 1.1].forEach(function(dz){ for (var rp2 = 0; rp2 < 6; rp2++) bx(.08, .8, .08, tableM, -2.5 + rp2, .9 + Math.sin(rp2 / 5 * Math.PI) * .5, dz, bridge, false); });
  var lily = []; for (var li = 0; li < 10; li++) lily.push([-15 + rr(-6, 6), .17, 33.5 + rr(-3.2, 3.2), 0, 0, rr(.35, .55), .1]);
  inst(cyl(1, 1, .4, 12), leafM2, lily, false);
  bx(2.4, .1, 11, walk, -15, .06, 25.5, S, false);

  // ===== aparcament (sud-est) =====
  bx(14, .08, 11, std('#6E7076', .9), 3.5, .05, 35.5, S, false);
  for (var ps = 0; ps < 5; ps++) { bx(.12, .02, 4, dash, -2 + ps * 2.6 + 1.3, .1, 32.4, S, false); bx(.12, .02, 4, dash, -2 + ps * 2.6 + 1.3, .1, 38.6, S, false); }
  ['#C8102E', '#F4F5F7', '#1E2A44', '#E8A21B', '#3A3532', '#7FA6C2'].forEach(function(c, i){ if (i === 4) return; var cc = car(c); cc.position.set(0 + (i % 3) * 2.6 + (i >= 3 ? 2.6 : 0), 0, i < 3 ? 32.4 : 38.6); cc.rotation.y = i < 3 ? 0 : Math.PI; S.add(cc); });

  // arbres: tanquen el parc pels costats i fan ombra a l'estany
  [[-24, 29], [-24, 36], [-24, 41], [-8, 29], [-7, 38], [-16, 41], [9, 18], [-24, 5], [-8.5, 5], [8.5, 41]].forEach(function(p, i){ tree(S, p[0], p[1], .55 + (i % 3) * .1); });
  // gent passejant
  [[-1.5, 19.5], [5.5, 26.5]].forEach(function(p, i){ makePerson(S, people, { x: p[0], z: p[1], skin: pick(['#EFC3A1', '#B57A52', '#F6D7C3']), shirt: pick(['#C8102E', '#F4EFE6', '#2F6FB3']), hair: pick(['#2E1F17', '#5A3A22']), hairStyle: i, talk: true, face: [PX, PZ] }).scale.setScalar(1.15); });
  makePerson(S, people, { x: 0, z: 0, skin: '#F6D7C3', shirt: '#E8A21B', hair: '#5A3A22', hairStyle: 3, speed: 1, path: [[-24, 23], [-3, 23], [2, 17.8], [7, 23], [10, 23], [7, 23], [2, 28.2], [-3, 23]] }).scale.setScalar(1.15);
  makePerson(S, people, { x: 0, z: 0, skin: '#8A5A3B', shirt: '#F4EFE6', hair: '#1D1D24', hairStyle: 2, speed: .9, path: [[2, 4], [2, 17], [-3.2, 23], [2, 28.8], [2, 31]] }).scale.setScalar(1.15);
  makePerson(S, people, { x: -14, z: 17, skin: '#D9A074', shirt: '#7A0C1E', hair: '#2E1F17', hairStyle: 1, talk: true, face: [-12.6, 17.4] }).scale.setScalar(1.15);
  makePerson(S, people, { x: -12.6, z: 17.4, skin: '#EFC3A1', shirt: '#F4EFE6', hair: '#D9B15A', hairStyle: 3, face: [-14, 17] }).scale.setScalar(1.15);

  // --- pati de barrils i caixes davant d'Envasat ---
  bx(17, .1, 13, concrete, 31, .05, 34.5, S, false);
  var kegG = new THREE.LatheGeometry([[0, 0], [.42, 0], [.47, .06], [.47, .14], [.44, .2], [.46, .4], [.44, .6], [.47, .66], [.47, .74], [.42, .8], [0, .8]].map(function(p){ return new THREE.Vector2(p[0], p[1]); }), 16);
  var kegs = [];
  for (var kx = 0; kx < 6; kx++) for (var kz = 0; kz < 4; kz++) for (var ky = 0; ky < 2; ky++) if (!(ky && (kx + kz) % 3 === 0)) kegs.push([24.5 + kx * 1, .1 + ky * .82, 30.5 + kz * 1, 0, 0, 1]);
  inst(kegG, steel, kegs);
  var crateM = std('#6E0309', .8), crates = [];
  for (var cx2 = 0; cx2 < 3; cx2++) for (var cz2 = 0; cz2 < 2; cz2++) { var h2 = 3 + ((cx2 + cz2) % 3); for (var cy = 0; cy < h2; cy++) crates.push([33 + cx2 * 1.5, .25 + cy * .45, 30.6 + cz2 * 1.9, rr(-.05, .05)]); }
  inst(geoBox(1.3, .42, 1.7), crateM, crates);
  var plt = []; crates.forEach(function(c){ if (c[1] < .3) plt.push([c[0], .08, c[2]]); }); inst(geoBox(1.45, .14, 1.85), std('#B5875A', .9), plt);
  // contenidor de mercaderies
  var cont = bx(9, 3.2, 3.2, new THREE.MeshStandardMaterial({ map: rep(redPanel, 6, 1), roughness: .55 }), 30, 1.65, 38.8, S);
  sign('DAMM', 3, .8, 30, 1.9, 40.42, S, { bg: '#9C0D19', fg: '#FFFFFF', font: '800 96px Figtree, sans-serif' });
  var fk2 = forklift(); fk2.position.set(36.5, 0, 36); fk2.rotation.y = -Math.PI / 2; S.add(fk2);
  makePerson(S, people, { x: 27.5, z: 35.2, skin: '#B57A52', shirt: '#E86A1C', vest: true, hat: '#E8B41B', talk: true, face: [29, 36] }).scale.setScalar(1.15);
  makePerson(S, people, { x: 29, z: 36, skin: '#EFC3A1', shirt: '#E86A1C', vest: true, hat: true, face: [27.5, 35.2] }).scale.setScalar(1.15);

  // --- xemeneia de maó de la sala de cocció, amb fum ---
  var chim = new THREE.MeshStandardMaterial({ map: rep(T.brick, 2, 8), roughness: .9 });
  mesh(cyl(1.1, 1.6, 24, 20), chim, 19.5, 12, -36, S); mesh(cyl(1.35, 1.35, .8, 20), std('#7A3A22', .9), 19.5, 23.8, -36, S);
  [8, 16].forEach(function(y){ mesh(new THREE.TorusGeometry(1.45 - y * .012, .12, 6, 24), dk, 19.5, y, -36, S, false).rotation.x = Math.PI / 2; });
  var smoke = [];
  for (var sm = 0; sm < 9; sm++) { var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.soft, color: '#ABA59C', transparent: true, opacity: .8, depthWrite: false })); S.add(sp); smoke.push({ s: sp, ph: sm / 9, x: 19.5, y: 24.5, z: -36 }); }
  for (var st2 = 0; st2 < 5; st2++) { var sp2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.soft, color: '#FFFFFF', transparent: true, opacity: .5, depthWrite: false })); S.add(sp2); smoke.push({ s: sp2, ph: st2 / 5, x: 36, y: 10, z: 12, small: true }); }
  anims.push(function(dt, t){
    smoke.forEach(function(o){
      var L = RM ? o.ph : (t * (o.small ? .16 : .09) + o.ph) % 1, k = o.small ? .5 : 1;
      o.s.position.set(o.x + L * 9 * k, o.y + L * 11 * k, o.z + L * 3 * k);
      var sc = (3 + L * 9) * k; o.s.scale.set(sc, sc, 1); o.s.material.opacity = (o.small ? .5 : .85) * Math.sin(L * Math.PI);
    });
  });
  // xemeneia petita i ventilació al terrat d'Envasat
  mesh(cyl(.4, .4, 1.6, 12), metalGrey, 36, 9.8, 12, S); mesh(cyl(.6, .6, .2, 12), metalGrey, 36, 10.7, 12, S);

  // --- plaques solars i màquines al terrat ---
  var solar = [];
  for (var sr = 0; sr < 3; sr++) for (var sc2 = 0; sc2 < 5; sc2++) solar.push([24 + sc2 * 2.4, 9.5, 10.6 + sr * 2.3, 0, -.45]);
  for (var sr2 = 0; sr2 < 2; sr2++) for (var sc3 = 0; sc3 < 4; sc3++) solar.push([2.5 + sc3 * 2.4, 15.4, -31 + sr2 * 2.3, 0, -.45]);
  var solarM = new THREE.MeshStandardMaterial({ color: '#1C2E4A', roughness: .2, metalness: .6 });
  inst(geoBox(2.1, .08, 1.6), solarM, solar);
  var acU = [[48, 21.9, -31], [52, 21.9, -31], [48, 21.9, -19], [52, 21.9, -19], [-36, 15.6, 17], [-32, 15.6, 17]];
  inst(geoBox(2.4, 1, 1.8), std('#C9CDD2', .5, .4), acU);
  inst(cyl(.6, .6, .08, 16), dk, acU.map(function(a){ return [a[0], a[1] + .52, a[2]]; }), false);

  // --- banderes a l'entrada de les oficines ---
  var flagT = textTex('DAMM', { w: 256, h: 160, bg: '#C8102E', fg: '#FFFFFF', font: '800 70px Figtree, sans-serif' });
  var flagM = new THREE.MeshStandardMaterial({ map: flagT, roughness: .8, side: THREE.DoubleSide }), flags = [];
  [12, 15.5, 19].forEach(function(z){
    mesh(cyl(.08, .1, 9, 8), std('#E9E4DA', .4, .5), -28.6, 4.5, z, S);
    var fg = new THREE.Group(); fg.position.set(-28.6, 8.2, z); fg.userData.keep = true; S.add(fg);
    var fp = mesh(new THREE.PlaneGeometry(2.6, 1.6, 8, 1), flagM, 1.35, 0, 0, fg, false, false); flags.push({ g: fg, m: fp, ph: z });
  });
  anims.push(function(dt, t){ flags.forEach(function(o){ o.g.rotation.y = RM ? .3 : .3 + Math.sin(t * 1.3 + o.ph) * .35; }); });

  // --- tanca i arbres a la vora del darrere, darrere la via ---
  var posts = [];
  for (var fx = -57; fx <= 57; fx += 2.5) posts.push([fx, .7, -42.6]);
  inst(geoBox(.12, 1.4, .12), metalGrey, posts, false);
  bx(IX * 2, .08, .06, metalGrey, 0, 1.3, -42.6, S, false); bx(IX * 2, .08, .06, metalGrey, 0, .7, -42.6, S, false);

  // =========== departaments oficials (claus = departments.code) ===========
  // Fàbrica agrupa els quatre edificis de producció; el seu far és a la sala de cocció, al mig del campus.
  // `at` = [x, alçada del terrat, z]. L'etiqueta queda per sobre del far (vegeu `anchors`).
  var DEPTS = {
    fabrica: { zones: ['malta', 'fermentacio', 'coccio', 'envasat'], at: [15, 14.4, -28] },
    logistica: { zones: ['logistica'], at: [41, 21.4, -25] },
    comercial: { zones: ['comercial'], at: [48, 6, 31] },
    oficina: { zones: ['oficines'], at: [-49, 15, 21] },
    others: { zones: ['others'], at: [-15.5, 7.25, 11.5] }
  };
  var ZONE_DEPT = {};
  Object.keys(DEPTS).forEach(function(k){ DEPTS[k].zones.forEach(function(z){ ZONE_DEPT[z] = k; }); });
  var LABEL_UP = 14;
  Object.keys(DEPTS).forEach(function(k){ var f = DEPTS[k].at; beacon(k, f[0], f[1], f[2]); });

  // =========== moviment ===========
  // Avinguda: tots fan el mateix circuit (cap a l'est pel carril de davant, tornada pel del darrere),
  // a la mateixa velocitat i repartits, així que la distància entre ells no canvia mai.
  var AVE = [[-55, -1.4], [55, -1.4], [55, -4.6], [-55, -4.6]];
  mover(semi(), AVE, 7, 0); mover(van('#C8102E'), AVE, 7, .34); mover(semi(), AVE, 7, .67);
  // Carrer vertical: fa mitja volta abans d'arribar a l'avinguda, així no es creua amb els camions.
  mover(truck('#1E2A44'), [[17.7, 41], [17.7, 4.5], [14.3, 4.5], [14.3, 41]], 6, .3);

  // =========== gent ===========
  var HAT = true;
  function w(o){ return makePerson(S, people, o); }
  w({ x: -47.5, z: -21.8, skin: '#EFC3A1', shirt: '#E86A1C', vest: true, hat: HAT, talk: true, face: [-46.3, -21.2] });
  w({ x: -46.3, z: -21.2, skin: '#B57A52', shirt: '#E86A1C', vest: true, hat: HAT, face: [-47.5, -21.8] });
  w({ x: 0, y: 21.7, z: 0, skin: '#EFC3A1', shirt: '#C8102E', hat: HAT, logo: true, speed: .9, path: [[-37, -31.8], [-3, -31.8]] });
  w({ x: -24, z: -25.6, skin: '#5E3B26', shirt: '#F4EFE6', hat: HAT, logo: true, talk: true, face: [-22.8, -25.2] });
  w({ x: -22.8, z: -25.2, skin: '#F6D7C3', shirt: '#C8102E', hat: HAT, logo: true, face: [-24, -25.6] });
  w({ x: 5.5, z: -25.6, skin: '#F6D7C3', shirt: '#F4EFE6', hat: HAT, logo: true, worried: true, face: [5.5, -28] });
  w({ x: 16, z: -25.6, skin: '#8A5A3B', shirt: '#F4EFE6', hat: HAT, logo: true, face: [16, -28] });
  w({ x: 11, z: -18.6, skin: '#D9A074', shirt: '#1F1A18', hair: '#2E1F17', hairStyle: 1, logo: true, talk: true, face: [11, -16] });
  w({ x: 9.8, z: -16.4, skin: '#EFC3A1', shirt: '#E8A21B', hair: '#5A3A22', face: [11, -18.6] });
  w({ x: 11.2, z: -16, skin: '#B57A52', shirt: '#F4EFE6', hair: '#1D1D24', hairStyle: 2, face: [11, -18.6] });
  w({ x: 12.5, z: -16.5, skin: '#F6D7C3', shirt: '#7A6A5A', hair: '#8B8B92', face: [11, -18.6] });
  w({ x: 37.4, z: -15.4, skin: '#8A5A3B', shirt: '#E86A1C', vest: true, hat: '#E8B41B', worried: true, talk: true, face: [38.6, -15] });
  w({ x: 38.6, z: -15, skin: '#F6D7C3', shirt: '#E86A1C', vest: true, hat: '#E8B41B', worried: true, face: [37.4, -15.4] });
  w({ x: 52.8, z: -12.6, skin: '#D9A074', shirt: '#C8102E', logo: true, hat: '#E8B41B', worried: true, face: [52, -15] });
  w({ x: 29, z: 18.4, skin: '#F6D7C3', shirt: '#E86A1C', vest: true, hat: HAT, worried: true, face: [29, 19.4] });
  w({ x: 35, z: 18.4, skin: '#B57A52', shirt: '#E86A1C', vest: true, hat: HAT, worried: true, face: [35, 19.4] });
  w({ x: 24, z: 24, skin: '#D9A074', shirt: '#C8102E', hat: HAT, logo: true, worried: true, face: [25, 22] });
  w({ x: -45, z: 30.6, skin: '#EFC3A1', shirt: '#1E2A44', hair: '#D9B15A', hairStyle: 1, talk: true, face: [-43.8, 31] });
  w({ x: -43.8, z: 31, skin: '#5E3B26', shirt: '#F4EFE6', hair: '#1D1D24', hairStyle: 2, logo: true, face: [-45, 30.6] });
  w({ x: 47.6, z: 36.6, skin: '#F6D7C3', shirt: '#C8102E', hair: '#5A3A22', hairStyle: 3, logo: true, talk: true, face: [48.8, 37] });
  w({ x: 48.8, z: 37, skin: '#B57A52', shirt: '#3A3532', hair: '#2E1F17', face: [47.6, 36.6] });
  w({ x: -2, z: 9.4, skin: '#D9A074', shirt: '#E86A1C', vest: true, hat: '#E8B41B', face: [-6, 14] });
  w({ x: 0, z: 0, skin: '#D9A074', shirt: '#E86A1C', vest: true, hat: HAT, speed: 1.3, path: [[-56, -7], [-10, -7]] });
  w({ x: 0, z: 0, skin: '#F6D7C3', shirt: '#1E2A44', hair: '#A8642F', hairStyle: 1, speed: 1.1, path: [[-56, 1], [8, 1]] });
  w({ x: 0, z: 0, skin: '#8A5A3B', shirt: '#C8102E', logo: true, hat: '#E8B41B', speed: 1.2, path: [[12, 40], [12, 3]] });
  w({ x: 0, z: 0, skin: '#EFC3A1', shirt: '#F4EFE6', logo: true, hair: '#2E1F17', speed: 1, path: [[20, 3], [20, 40]] });
  anims.push(function(dt, t){ animPeople(people, dt, t); });

  // anella de selecció
  var ringG = new THREE.RingGeometry(.93, 1, 80), ringM = new THREE.MeshBasicMaterial({ color: '#C8102E', transparent: true, opacity: .75, depthWrite: false });
  var rings = [0, 1, 2, 3].map(function(){ var r = mesh(ringG, ringM, 0, .3, 0, S, false, false); r.rotation.x = -Math.PI / 2; r.visible = false; r.userData.keep = true; return r; });
  anims.push(function(dt, t){ ringM.opacity = .55 + Math.sin(t * 3) * .2; });
  var ZC = { others: [-14, 13, 11], malta: [-51.5, -31, 9], fermentacio: [-20, -31.5, 21], coccio: [11, -27, 14], logistica: [44, -23, 16], envasat: [32, 16, 12.5], oficines: [-42, 21, 17], comercial: [49, 33, 9] };
  function select(k){
    var list = DEPTS[k] ? DEPTS[k].zones : ZONE_DEPT[k] ? DEPTS[ZONE_DEPT[k]].zones : [k];
    rings.forEach(function(r, i){ var c = ZC[list[i]]; r.visible = !!c; if (c) { r.position.set(c[0], .3, c[1]); r.scale.set(c[2], c[2], 1); } });
  }

  moving.concat(people).forEach(function(o){ o.traverse(function(m){ m.castShadow = false; }); });
  return W_SELF = { scene: S, anims: anims, pickables: pickables, select: select, setZones: setZones, zoneDept: ZONE_DEPT, staticShadows: true, shadowDirty: true,
    view: { pos: V(74, 66, 92), target: V(0, 2, 0), min: 28, max: 220, polar: 1.28 },
    anchors: Object.keys(DEPTS).reduce(function(o, k){ var f = DEPTS[k].at; o[k] = V(f[0], f[1] + (k === 'comercial' ? 9 : LABEL_UP), f[2]); return o; }, {}) };
}


// =====================================================
//  OPTIMITZACIÓ: fusió de la geometria estàtica
// =====================================================
// Cada finestra, merlet o cadira és una malla pròpia i costa una crida de dibuix (i una altra per a les ombres).
// Abans del primer dibuix, provem les animacions uns instants: tot el que no es mou es fusiona en una sola malla
// per material, dins del mateix grup clicable (perquè la selecció de zones i objectes continuï funcionant).
function freezeStatic(W){
  var S = W.scene;
  S.updateMatrixWorld(true);
  var meshes = [];
  S.traverse(function(o){ if (o.isMesh && !o.isInstancedMesh && !Array.isArray(o.material) && o.geometry && o.geometry.attributes.position) meshes.push(o); });
  var before = meshes.map(function(m){ return { mw: m.matrixWorld.clone(), ml: m.matrix.clone(), v: m.geometry.attributes.position.version, vis: m.visible }; });
  [[.016, 1.3], [.016, 2.9], [.016, 4.7], [.016, 7.1]].forEach(function(a){
    for (var i = 0; i < W.anims.length; i++) W.anims[i](a[0], a[1]);
    S.updateMatrixWorld(true);
    meshes.forEach(function(m, k){
      var b = before[k];
      if (m.geometry.attributes.position.version !== b.v || !m.matrix.equals(b.ml)) b.moved = b.local = true;   // es mou respecte al seu grup
      else if (!m.matrixWorld.equals(b.mw)) b.moved = true;                                                       // es mou amb el seu grup
    });
  });
  var buckets = {}, inv = new THREE.Matrix4(), rel = new THREE.Matrix4();
  meshes.forEach(function(m, k){
    if (before[k].local || !before[k].vis || m.userData.keep) return;
    var root = m.parent, hidden = false, keep = false;
    for (var p = m.parent; p; p = p.parent) { if (!p.visible) hidden = true; if (p.userData.keep) keep = true; }
    if (hidden) return;
    // dins d'un grup que s'encén o s'apaga (fites de la Festa): fusionem dins del mateix grup
    if (keep && !before[k].moved) { root = m.parent; while (root && !root.userData.keep) root = root.parent; }
    // si el grup es mou (p. ex. un personatge), fusionem dins del mateix grup; si no, dins del grup clicable més proper
    else if (!before[k].moved) { while (root && root !== S && !root.userData.action && !root.userData.zone) root = root.parent; root = root || S; }
    var key = root.uuid + '|' + m.material.uuid + '|' + (m.castShadow ? 1 : 0) + (m.receiveShadow ? 1 : 0);
    (buckets[key] = buckets[key] || { root: root, mat: m.material, cast: m.castShadow, recv: m.receiveShadow, list: [] }).list.push(m);
  });
  var merged = 0, removed = 0;
  Object.keys(buckets).forEach(function(key){
    var b = buckets[key]; if (b.list.length < 2) return;
    inv.copy(b.root.matrixWorld).invert();
    var geos = b.list.map(function(m){
      var g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      Object.keys(g.attributes).forEach(function(n){ if (n !== 'position' && n !== 'normal' && n !== 'uv') g.deleteAttribute(n); });
      if (!g.attributes.normal) g.computeVertexNormals();
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      g.clearGroups(); g.morphAttributes = {};
      g.applyMatrix4(rel.multiplyMatrices(inv, m.matrixWorld));
      return g;
    });
    var mg = BufferGeometryUtils.mergeBufferGeometries(geos, false);
    geos.forEach(function(g){ g.dispose(); });
    if (!mg) return;
    var mm = new THREE.Mesh(mg, b.mat); mm.castShadow = b.cast; mm.receiveShadow = b.recv; mm.matrixAutoUpdate = false;
    b.root.add(mm); mm.updateMatrix();
    b.list.forEach(function(m){ m.parent.remove(m); removed++; });
    merged++;
  });
  return { merged: merged, removed: removed };
}

// =====================================================
//  MUNTATGE
// =====================================================
var cache = {};
var texturesBuilt = false;

function ensureRenderer() {
  if (renderer) return;
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAXPR));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  MAXANI = renderer.capabilities.getMaxAnisotropy();
  // només en desenvolupament: estadístiques per mesurar el rendiment (crides de dibuix, triangles, fps)
  if (import.meta.env && import.meta.env.DEV) window.__damm3d = { renderer: renderer, fps: 0 };
  pmrem = new THREE.PMREMGenerator(renderer);
}

export function webglAvailable() {
  try { var c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); }
  catch (e) { return false; }
}

export function mountScene(container, kind, opts) {
  opts = opts || {};
  ensureRenderer();
  if (!texturesBuilt) { buildTextures(); texturesBuilt = true; }
  if (!cache[kind]) { cache[kind] = kind === 'plaza' ? buildPlaza() : buildWorld(); var fz = freezeStatic(cache[kind]); if (window.__damm3d) window.__damm3d.freeze = fz; }
  var W = cache[kind];
  var festaPct = 100;
  if (kind === 'plaza') { if (opts.avatar) W.rebuildMe(opts.avatar); W.showMe(!!opts.avatar); W.setFesta(festaPct); }

  var canvas = renderer.domElement;
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;outline:none';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', opts.ariaLabel || 'Escena 3D interactiva');
  container.appendChild(canvas);

  var camera = new THREE.PerspectiveCamera(42, 1, .1, 1500);
  var controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = .08; controls.enablePan = false; controls.rotateSpeed = .6;
  var v = W.view;
  camera.position.copy(v.pos); controls.target.copy(v.target);
  // en pantalles estretes allunyem la càmera perquè hi càpiga l'escena sencera
  if (kind !== 'world' && container.clientWidth < 700) camera.position.sub(v.target).multiplyScalar(1.2).add(v.target);
  // Damm World: la càmera s'apropa fins que l'illa omple la pantalla (sigui quina sigui la mida), fins que la persona la mou
  var fitPts = kind === 'world' ? [[-59, -1, -45], [59, -1, -45], [-59, -1, 45], [59, -1, 45], [-40, 22, -34], [44, 22, -30]].map(function (p) { return new THREE.Vector3(p[0], p[1], p[2]); }) : null, camMoved = false, prj = new THREE.Vector3();
  function fitWorld() {
    if (!fitPts || camMoved) return;
    var dir = v.pos.clone().sub(v.target).normalize(), lo = 30, hi = 420;
    for (var it = 0; it < 22; it++) {
      var mid = (lo + hi) / 2, ok = true; camera.position.copy(v.target).addScaledVector(dir, mid); camera.lookAt(v.target); camera.updateMatrixWorld();
      for (var q = 0; q < fitPts.length && ok; q++) { prj.copy(fitPts[q]).project(camera); if (Math.abs(prj.x) > .99 || Math.abs(prj.y) > .94) ok = false; }
      if (ok) hi = mid; else lo = mid;
    }
    camera.position.copy(v.target).addScaledVector(dir, hi);
  }
  controls.minDistance = v.min; controls.maxDistance = v.max; controls.maxPolarAngle = v.polar; controls.minPolarAngle = .3;
  // moviment amb límits: es pot desplaçar (botó dret, dos dits o tecles), però el punt de mira no surt de l'escena
  controls.enablePan = !!v.bounds; controls.screenSpacePanning = false; controls.panSpeed = .9;
  if (v.azim) { controls.minAzimuthAngle = -v.azim; controls.maxAzimuthAngle = v.azim; }
  function clampTarget() {
    if (!v.bounds || (window.__damm3d && window.__damm3d.free)) return;
    var b = v.bounds, tg = controls.target;
    var dx = Math.min(Math.max(tg.x, b[0]), b[1]) - tg.x, dz = Math.min(Math.max(tg.z, b[2]), b[3]) - tg.z, dy = v.target.y - tg.y;
    if (dx || dz || dy) { tg.x += dx; tg.y += dy; tg.z += dz; camera.position.x += dx; camera.position.y += dy; camera.position.z += dz; }
    if (v.keepIn) v.keepIn(camera.position);
  }
  function shift(dx, dz) { controls.target.x += dx; controls.target.z += dz; camera.position.x += dx; camera.position.z += dz; clampTarget(); }
  controls.addEventListener('change', clampTarget);
  controls.update();

  var overlay = document.createElement('div'); overlay.className = 'scene-labels'; container.appendChild(overlay);
  var labels = [];
  function addLabel(anchor, html) { var el = document.createElement('div'); el.className = 'lab'; el.innerHTML = html; overlay.appendChild(el); labels.push({ el: el, a: anchor }); return el; }
  function act(a) { if (opts.onAction) opts.onAction(a); }
  var stageBtn = null;
  function paintStage() { if (stageBtn) { stageBtn.textContent = '🍺 La Barra · cerveses Damm'; stageBtn.className = 'tag red'; } }
  var zones = opts.zones || [], selected = null;
  function pinFor(k) {
    var dept = W.zoneDept && W.zoneDept[k];
    return zones.find(function (z) { return z.key === k || (z.sourceZones || []).indexOf(k) >= 0 || (dept && z.key === dept); });
  }
  function select(k) {
    var pin = pinFor(k);
    if (kind === 'world' && !pin) return;
    if (pin) k = pin.key;
    selected = k;
    if (W.select) W.select(k);
    overlay.querySelectorAll('.pin').forEach(function (p) { p.setAttribute('aria-pressed', p.getAttribute('data-z') === k ? 'true' : 'false'); });
    if (opts.onZone) opts.onZone(k);
  }

  function renderTopics(topics){
    if (kind !== 'plaza') return;
    labels = labels.filter(function(l){ if (l.topic) { l.el.remove(); return false; } return true; });
    (topics || []).slice(0, W.bubbleAnchors.length).forEach(function(topic, idx){
      var el = addLabel(W.bubbleAnchors[idx], '<div class="bubble"><p></p><div class="row"><span><b class="cnt"></b> +1</span>' + (opts.readOnly ? '' : '<button type="button" class="react"></button>') + '</div></div>');
      labels[labels.length - 1].topic = true;
      // User content is always text, never HTML.
      el.querySelector('p').textContent = topic.text;
      var btn = el.querySelector('.react');
      el.querySelector('.cnt').textContent = String(topic.likes || 0);
      if (!btn) return;
      btn.setAttribute('aria-pressed', String(!!topic.reacted));
      btn.textContent = topic.reacted ? '\u2713 Jo tamb\u00e9' : '+1 Jo tamb\u00e9';
      btn.addEventListener('click', async function(){
        if (!opts.onReact || btn.disabled) return;
        var on = !topic.reacted; btn.disabled = true;
        try { await opts.onReact(topic.id, on); if (on) { W.fireworks(); poke(); } }
        catch (e) { btn.disabled = false; btn.title = e.message || 'Error'; }
      });
    });
  }

  if (kind === 'plaza') {
    renderTopics(opts.topics || []);
    if (opts.surveyTag) addLabel(W.anchors.kiosk, '<button type="button" class="tag red">' + opts.surveyTag + '</button>').querySelector('button').addEventListener('click', function () { act('survey'); });
    addLabel(W.anchors.idea, '<button type="button" class="tag">Bústia d’idees · anònima</button>').querySelector('button').addEventListener('click', function () { act('idea'); });
    stageBtn = addLabel(W.anchors.stage, '<button type="button" class="tag light"></button>').querySelector('button');
    stageBtn.addEventListener('click', function () { act('stage'); });
    paintStage();
    if (opts.avatar) addLabel(W.anchors.me, '<span class="me-tag">Tu</span>');
  } else {
    renderPins(zones);
    if (opts.initialZone) select(opts.initialZone);
  }
  // pins de Damm World: es poden refer quan canvien les dades (p. ex. RRHH canvia de centre)
  function renderPins(list) {
    zones = list || [];
    labels = labels.filter(function (l) { if (l.pin) { l.el.remove(); return false; } return true; });
    zones.forEach(function (z) {
      var a = W.anchors[z.key] || (W.zoneDept && W.anchors[W.zoneDept[z.sceneKey || z.key]]); if (!a) return;
      var esc = function (v) { return String(v).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); };
      var name = esc(z.name), label = z.absent || z.score === '?' ? '' : esc(z.score);
      var el = addLabel(a, '<button type="button" class="pin' + (z.absent ? ' off' : '') + '" data-z="' + esc(z.key) + '" aria-pressed="' + (z.key === selected) + '" aria-label="' + name + ': ' + (z.absent ? 'no hi ha equip en aquest centre' : esc(z.moodLabel)) + '"><span class="w" style="background:' + esc(z.bg) + '"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="' + esc(z.ink) + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + esc(z.path) + '"/></svg></span>' + name + '<em>' + label + '</em></button>');
      labels[labels.length - 1].pin = true;
      el.querySelector('button').addEventListener('click', function () { select(z.key); });
    });
    if (W.setZones) W.setZones(zones);
    poke();
  }

  // clic sobre objectes de l'escena
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), downAt = null;
  function pd(e) { downAt = [e.clientX, e.clientY]; }
  function pu(e) {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
    var r = canvas.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(ndc, camera);
    var hits = ray.intersectObjects(W.pickables, true);
    var o = hits.length ? hits[0].object : null; while (o && !o.userData.action && !o.userData.zone) o = o.parent;
    if (o) { if (o.userData.action) act(o.userData.action); else select(o.userData.zone); return; }
    // tocar el terra: el teu personatge hi camina
    if (W.walkTo && ray.ray.intersectPlane(ground, hitP)) W.walkTo(hitP.x, hitP.z);
  }
  var ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hitP = new THREE.Vector3();
  canvas.addEventListener('pointerdown', pd);
  canvas.addEventListener('pointerup', pu);

  // fletxes o WASD: camina el personatge (o, a la vista de RRHH, es desplaça la càmera)
  var fwd = new THREE.Vector3();
  function onKey(e) {
    if (!v.bounds || e.altKey || e.ctrlKey || e.metaKey) return;
    var tgEl = e.target, tag = tgEl && tgEl.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (tgEl && tgEl.isContentEditable) || document.querySelector('[role="dialog"]')) return;
    var k = e.key.toLowerCase(), f = 0, r = 0;
    if (k === 'arrowup' || k === 'w') f = 1; else if (k === 'arrowdown' || k === 's') f = -1; else if (k === 'arrowleft' || k === 'a') r = -1; else if (k === 'arrowright' || k === 'd') r = 1; else return;
    e.preventDefault();
    fwd.subVectors(controls.target, camera.position); fwd.y = 0; fwd.normalize();
    var mx = fwd.x * f - fwd.z * r, mz = fwd.z * f + fwd.x * r;
    var me = W.me && W.me();
    if (me && W.walkTo(me.x + mx * 1.6, me.z + mz * 1.6)) return;
    shift(mx * 1.2, mz * 1.2);
  }
  window.addEventListener('keydown', onKey);

  var cw = container.clientWidth, ch = container.clientHeight;
  function resize() {
    var w = container.clientWidth, h = container.clientHeight; if (!w || !h) return;
    cw = w; ch = h; lastInput = performance.now();
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < 700 ? 54 : 42; camera.updateProjectionMatrix();
    fitWorld();
  }
  controls.addEventListener('start', function () { camMoved = true; });
  var ro = new ResizeObserver(resize); ro.observe(container); resize();

  // Bucle de dibuix optimitzat:
  //  · mentre interactues: tants fotogrames com doni la pantalla; en repòs, 30 fps (les animacions són suaus)
  //  · les ombres es recalculen un fotograma sí i un no
  //  · si l'equip no arriba a ~35 fps, baixem la densitat de píxel (fins a 1)
  var clock = new THREE.Clock(), raf = 0, alive = true, tmp = new THREE.Vector3();
  var lastInput = performance.now(), lastDraw = 0, nDraw = 0, perfN = 0, perfT = 0;
  function poke() { lastInput = performance.now(); }
  ['pointerdown', 'pointermove', 'wheel', 'touchstart'].forEach(function (ev) { canvas.addEventListener(ev, poke, { passive: true }); });
  window.addEventListener('keydown', poke);
  controls.addEventListener('change', poke);
  renderer.shadowMap.needsUpdate = true;
  function frame() {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    var now = performance.now(), fp = W.follow && W.follow();
    var idle = !fp && now - lastInput > 2500;
    if (idle && now - lastDraw < (RM ? 95 : 32)) return;
    var dt = Math.min(clock.getDelta(), .05), t = now / 1000;
    if (!idle) { perfN++; perfT += dt; if (perfT > 2) { var pr = renderer.getPixelRatio(); if (perfN / perfT < 35 && pr > 1) { renderer.setPixelRatio(Math.max(1, pr - .25)); resize(); } perfN = 0; perfT = 0; } }
    else { perfN = 0; perfT = 0; }
    lastDraw = now;
    for (var i = 0; i < W.anims.length; i++) W.anims[i](dt, t);
    if (fp) { var kf = Math.min(1, dt * 1.8); shift((fp.x - controls.target.x) * kf, (fp.z - 6 - controls.target.z) * kf); }
    controls.update();
    // Damm World: escena estàtica pel que fa a les ombres → el mapa d'ombres es calcula només quan cal
    if (W.staticShadows) { if (nDraw++ < 3 || W.shadowDirty) { renderer.shadowMap.needsUpdate = true; W.shadowDirty = false; } }
    else if ((nDraw++ & 1) === 0) renderer.shadowMap.needsUpdate = true;
    renderer.render(W.scene, camera);
    if (window.__damm3d) { var d3 = window.__damm3d; d3.camera = camera; d3.controls = controls; d3.n = (d3.n || 0) + 1; if (!d3.t0) d3.t0 = t; if (t - d3.t0 >= 2) { d3.fps = d3.n / (t - d3.t0); d3.n = 0; d3.t0 = t; d3.calls = renderer.info.render.calls; d3.tris = renderer.info.render.triangles; d3.geos = renderer.info.memory.geometries; d3.tex = renderer.info.memory.textures; d3.pr = renderer.getPixelRatio(); } }
    var w = cw, h = ch;
    for (var j = 0; j < labels.length; j++) {
      var it = labels[j]; tmp.copy(it.a).project(camera);
      var vis = tmp.z < 1 && Math.abs(tmp.x) < 1.15 && Math.abs(tmp.y) < 1.2;
      if (vis !== it.vis) { it.el.style.display = vis ? '' : 'none'; it.vis = vis; }
      if (vis) {
        // mantenim l'etiqueta dins del requadre perquè no quedi tallada pels costats
        var half = (it.w || (it.w = it.el.offsetWidth)) / 2 + 6;
        var px = Math.min(Math.max((tmp.x + 1) / 2 * w, half), Math.max(half, w - half));
        var tr = 'translate(' + px.toFixed(0) + 'px,' + ((1 - tmp.y) / 2 * h).toFixed(0) + 'px) translate(-50%,-100%)';
        if (tr !== it.tr) { it.el.style.transform = tr; it.tr = tr; }
      }
    }
  }
  frame();

  var api = {
    setTopics: renderTopics,
    setZones: function (list) { if (kind === 'world') renderPins(list); },
    burst: function () { if (W.burst) W.burst(); },
    // Compatibility with older callers: the plaza is always fully open.
    setFesta: function () {
      if (W.setFesta) { W.setFesta(100); paintStage(); poke(); }
    },
    setAvatar: function (a) { if (W.rebuildMe) W.rebuildMe(a); },
    select: select,
    dispose: function () {
      alive = false; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose();
      canvas.removeEventListener('pointerdown', pd); canvas.removeEventListener('pointerup', pu); window.removeEventListener('keydown', onKey);
      ['pointerdown', 'pointermove', 'wheel', 'touchstart'].forEach(function (ev) { canvas.removeEventListener(ev, poke); });
      window.removeEventListener('keydown', poke); controls.removeEventListener('change', poke);
      controls.removeEventListener('change', clampTarget);
      overlay.remove(); if (canvas.parentNode === container) container.removeChild(canvas);
    }
  };
  if (window.__damm3d) window.__damm3d.api = api;
  return api;
}
