uniform vec3 uColor;
uniform vec3 uLightPosition;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vec3 lightDir = normalize(uLightPosition - vPosition);
    float diff = max(dot(vNormal, lightDir), 0.0);
    
    vec3 ambient = 0.3 * uColor;
    vec3 diffuse = diff * uColor;
    
    vec3 viewDir = normalize(-vPosition);
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(vNormal, halfwayDir), 0.0), 32.0);
    vec3 specular = vec3(0.2) * spec; // Subtle specular highlight
    
    vec3 result = ambient + diffuse + specular;
    gl_FragColor = vec4(result, 1.0);
}