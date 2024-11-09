uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;

varying vec2 vUv;

void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    
    vec3 col = 1.5 + 10.5 * cos(uTime + vUv.xyx + vec3(0, 2, 4));
    
    float d = length(uv);
    d = sin(d * 8.0 + uTime) / 10.0;
    d = abs(d);
    d = 0.02 / d;
    
    col *= d;
    
    gl_FragColor = vec4(mix(uColor1, uColor2, col), 1.0);
}