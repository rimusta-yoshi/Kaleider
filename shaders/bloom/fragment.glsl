uniform sampler2D tDiffuse;
uniform float uBloomStrength;
uniform float uBloomRadius;

varying vec2 vUv;

float gaussianPdf(in float x, in float sigma) {
    return 0.39894 * exp(-0.5 * x * x / (sigma * sigma)) / sigma;
}

void main() {
    vec2 invSize = 100.0 / vec2(textureSize(tDiffuse, 0));
    float fSigma = float(uBloomRadius);
    float weightSum = gaussianPdf(0.0, fSigma);
    vec3 diffuseSum = texture2D(tDiffuse, vUv).rgb * weightSum;

    for(int i = 1; i < 10; i++) {
        float x = float(i);
        float w = gaussianPdf(x, fSigma);
        vec2 uvOffset = vec2(x * invSize.x, 0.0);
        vec3 sample1 = texture2D(tDiffuse, vUv + uvOffset).rgb;
        vec3 sample2 = texture2D(tDiffuse, vUv - uvOffset).rgb;
        diffuseSum += (sample1 + sample2) * w;
        weightSum += 2.0 * w;
    }

    vec3 color = diffuseSum / weightSum;
    vec3 bloomColor = mix(texture2D(tDiffuse, vUv).rgb, color, uBloomStrength);
    gl_FragColor = vec4(bloomColor, 1.0);
}