import * as tr from 'three'

export const makeSkyMaterial = () => new tr.ShaderMaterial({
  side: tr.BackSide,
  vertexShader: [
    'varying vec3 vWorldPos;',
    'void main() {',
    '  vWorldPos = normalize((modelMatrix * vec4(position,1.0)).xyz);',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);',
    '}'
  ].join('\n'),
  fragmentShader: [
    'varying vec3 vWorldPos;',
    'void main() {',
    '  float h = clamp(vWorldPos.y * 0.5 + 0.5, 0.0, 1.0);',
    '  vec3 zenithCol  = vec3(0.01, 0.02, 0.06);',
    '  vec3 horizonCol = vec3(0.04, 0.08, 0.18);',
    '  gl_FragColor = vec4(mix(horizonCol, zenithCol, h), 1.0);',
    '}'
  ].join('\n'),
})

export const makeGroundMaterial = (grassTex, grassPat) => new tr.ShaderMaterial({
  uniforms: {
    tBase:   { value: grassTex },
    tDetail: { value: grassPat },
  },
  vertexShader: [
    'varying vec2 vUv;',
    'varying float vDist;',
    'varying float vR;',
    'void main() {',
    '  vUv = uv;',
    '  vR  = length(position.xy);',
    '  float curve = vR * vR / 11000.0;',
    '  vec3 pos = vec3(position.xy, position.z - curve);',
    '  vDist = length((modelMatrix * vec4(pos, 1.0)).xyz);',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);',
    '}'
  ].join('\n'),
  fragmentShader: [
    'uniform sampler2D tBase;',
    'uniform sampler2D tDetail;',
    'varying vec2 vUv;',
    'varying float vDist;',
    'varying float vR;',
    'void main() {',
    '  if (vR > 895.0) discard;',
    '  vec4 base   = texture2D(tBase,   vUv);',
    '  vec4 detail = texture2D(tDetail, vUv * 5.0);',
    '  vec3 grass  = base.rgb * detail.rgb * 2.0;',
    '  float lum   = dot(grass, vec3(0.299,0.587,0.114));',
    '  vec3 night  = mix(vec3(lum)*vec3(0.12,0.18,0.22), grass*0.08, 0.3);',
    '  float fog   = clamp(vR / 700.0, 0.0, 1.0);',
    '  fog = fog * fog * fog;',
    '  vec3 fogCol = vec3(0.02, 0.05, 0.11);',
    '  vec3 final  = mix(night, fogCol, fog);',
    '  gl_FragColor = vec4(final, 1.0);',
    '}'
  ].join('\n'),
  side: tr.FrontSide,
})

export const makeStarMaterial = (starTex) => new tr.ShaderMaterial({
  uniforms: { map: { value: starTex }, uTime: { value: 0 } },
  vertexShader: [
    'attribute float aSize;',
    'attribute vec3 aColor;',
    'uniform float uTime;',
    'varying vec3 vColor;',
    'varying float vAlpha;',
    'void main() {',
    '  vColor = aColor;',
    '  float twinkle = 0.85 + 0.15 * sin(uTime * 1.5 + position.x * 0.05 + position.y * 0.07 + position.z * 0.03);',
    '  gl_PointSize = aSize * twinkle;',
    '  vAlpha = twinkle;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}'
  ].join('\n'),
  fragmentShader: [
    'uniform sampler2D map;',
    'varying vec3 vColor;',
    'varying float vAlpha;',
    'void main() {',
    '  vec4 t = texture2D(map, gl_PointCoord);',
    '  if (t.a < 0.01) discard;',
    '  gl_FragColor = vec4(vColor + t.rgb * 0.4, t.a);',
    '}'
  ].join('\n'),
  transparent: true,
  depthWrite: false,
  blending: tr.AdditiveBlending,
})
