uniform vec3 uColor;
uniform float uGlowIntensity;

varying vec3 vNormal;
varying vec3 vPositionNormal;

void main() {
    float intensity = pow(0.7 - dot(vPositionNormal, vNormal), 4.0);
    vec3 glow = uColor * intensity * uGlowIntensity;
    gl_FragColor = vec4(uColor + glow, 100.0);
}