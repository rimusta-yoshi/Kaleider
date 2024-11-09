uniform vec3 colorA;
uniform vec3 colorB;
uniform float time;

varying vec2 vUv;

void main() {
    vec3 color = mix(colorA, colorB, vUv.y + sin(time * 0.5) * 0.1);
    gl_FragColor = vec4(color, 1.0);
}