// CRT.frag
uniform sampler2D tDiffuse; // The rendered scene
uniform float time; // Time for animated effects
uniform vec2 resolution; // Screen resolution
uniform sampler2D noiseTexture; // Noise texture
uniform sampler2D scanlineTexture; // Scanline texture
uniform sampler2D vignetteTexture; // Vignette texture

varying vec2 vUv;

void main() {
    vec4 sceneColor = texture2D(tDiffuse, vUv);

    // Apply noise texture
    vec4 noise = texture2D(noiseTexture, vUv + vec2(time * 0.05));
    sceneColor.rgb += noise.rgb * 0.1; // Adjust intensity of noise

    // Apply scanline texture
    vec4 scanlines = texture2D(scanlineTexture, vUv * vec2(1.0, resolution.y / 200.0)); // Adjust for vertical scanlines
    sceneColor.rgb -= scanlines.rgb * 0.5; // Adjust intensity of scanlines

    // Apply vignette effect
    vec4 vignette = texture2D(vignetteTexture, vUv);
    sceneColor.rgb *= vignette.rgb; // Darken edges

    gl_FragColor = sceneColor;
}