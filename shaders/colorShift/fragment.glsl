uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uSpeed;
uniform float uColorA;
uniform float uColorB;

varying vec2 vUv;

void main() {
    vec4 texel = texture2D(tDiffuse, vUv);
    
    vec3 colorA = vec3(uColorA, 0.5, 1.0 - uColorA);
    vec3 colorB = vec3(1.0 - uColorB, uColorB, 0.5);
    
    vec3 color = mix(colorA, colorB, sin(uTime * uSpeed + vUv.x * 3.14) * 0.5 + 0.5);
    
    gl_FragColor = vec4(texel.rgb * color, texel.a);
}