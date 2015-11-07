precision highp float;
uniform sampler2D velocity;
uniform sampler2D pressure;
varying vec2 uv;

void main(){
    gl_FragColor = vec4(
        (texture2D(pressure, uv)).x*0.65,
        (texture2D(velocity, uv)*0.002).xy,
    0.5);
    if (gl_FragColor[0] > 0.7) {
    	gl_FragColor[0] = 0.7;
    }
    gl_FragColor[2] = gl_FragColor[2] + 0.02;
}
