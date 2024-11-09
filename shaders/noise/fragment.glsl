uniform sampler2D tDiffuse;
uniform float uTime;
uniform float uNoiseScale;
uniform float uNoiseIntensity;

varying vec2 vUv;

// Simple 2D noise function
float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(1.9898,78.233))) * 43758.5453123);
}

void main() {
    vec4 texel = texture2D(tDiffuse, vUv);
    vec2 noiseCoord = vUv * uNoiseScale + uTime * 0.05;
    float n = noise(noiseCoord);
    
    vec3 noiseColor = vec3(n);
    
    gl_FragColor = vec4(mix(texel.rgb, noiseColor, uNoiseIntensity), texel.a);
}