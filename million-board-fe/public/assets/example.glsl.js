
---
name: Grid
type: fragment
author: me
uniform.cameraScrollX: { "type": "1f", "value": 0.0 }
uniform.cameraScrollY: { "type": "1f", "value": 0.0 }
uniform.zoom: { "type": "1f", "value": 1.0 }
---

precision highp float;

uniform float cameraScrollX;
uniform float cameraScrollY;

uniform float zoom;
uniform vec2 resolution;

const float cellSize = 256.0;

const float MAX = (cellSize / 3.0) * 729.0;

// 1x1
const float CELL_0 = (cellSize / 3.0);
const float LINE_0 = 1.25;

// 3x3
const float CELL_1 = CELL_0 * 3.0;
const float LINE_1 = LINE_0 * 3.0;
// 9x9
const float CELL_2 = CELL_1 * 3.0;
const float LINE_2 = LINE_1 * 3.0;

// 27x27
const float CELL_3 = CELL_2 * 3.0;
const float LINE_3 = LINE_2 * 3.0;

// 81x81
const float CELL_4 = CELL_3 * 3.0;
const float LINE_4 = LINE_3 * 3.0;

// 243x243
const float CELL_5 = CELL_4 * 3.0;
const float LINE_5 = LINE_4 * 3.0;

// 729x729
const float CELL_6 = CELL_5 * 3.0;
const float LINE_6 = LINE_5 * 3.0;

const vec3 COLOR_0 = vec3(0.0, 0.0, 0.0);
const vec3 COLOR_1 = vec3(1.0, 1.0, 1.0);
const vec3 COLOR_2 = vec3(0.0, 0.0, 0.0);
const vec3 COLOR_3 = vec3(1.0, 1.0, 1.0);
const vec3 COLOR_4 = vec3(0.0, 0.0, 0.0);
const vec3 COLOR_5 = vec3(1.0, 1.0, 1.0);
const vec3 COLOR_6 = vec3(0.0, 0.0, 0.0);

const float lowerBound = 1.0;

float gridLine(vec2 p, float CELL_0, float lineW)
{
    vec2 g = mod(p, CELL_0);
    float d = min(min(g.x, CELL_0 - g.x), min(g.y, CELL_0 - g.y));
    return 1.0 - step(lineW, d);
}

float lodAlpha(
    float visibleMin,
    float visibleMax,
    float softness
) {
    // Fade in as zoom increases past visibleMin
    float fadeIn  = smoothstep(
        visibleMin - softness,
        visibleMin + softness,
        zoom
    );

    // Fade out as zoom increases past visibleMax
    float fadeOut = 1.0 - smoothstep(
        visibleMax - softness,
        visibleMax + softness,
        zoom
    );

    return fadeIn * fadeOut;
}

void main(void){
    
    // top-left screen coords (pixel-edge aligned)
    vec2 screen = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y) - 0.5;
    vec2 center = resolution * 0.5;

    // IMPORTANT: zoom around the center, not around (0,0)
    vec2 world =
        vec2(cameraScrollX, cameraScrollY) +
        ((screen - center) / zoom) +
        center;

    if(world.x < 0.0
    || world.y < 0.0
    || world.x > MAX
    || world.y > MAX
    ){
        gl_FragColor = vec4(0.0);
        return;
    }

    float a0 = gridLine(world, CELL_0, LINE_0) * lodAlpha(lowerBound, 999.0,         0.01);
    float a1 = gridLine(world, CELL_1, LINE_1) * lodAlpha(lowerBound / 3.0, 3.0,     0.01);
    float a2 = gridLine(world, CELL_2, LINE_2) * lodAlpha(lowerBound / 9.0, 1.0,     0.01);
    float a3 = gridLine(world, CELL_3, LINE_3) * lodAlpha(lowerBound / 27.0, 0.5,    0.01);
    float a4 = gridLine(world, CELL_4, LINE_4) * lodAlpha(lowerBound / 36.0, 0.25,   0.01);
    float a5 = gridLine(world, CELL_5, LINE_5) * lodAlpha(0.0001, 0.105,             0.01);
    float a6 = gridLine(world, CELL_6, LINE_6) * lodAlpha(0.0001, 0.0385,            0.01);

    vec3 col = vec3(0.0);
    float a = 0.0;

    col = mix(col, COLOR_0, a0); a = max(a, a0);
    col = mix(col, COLOR_1, a1); a = max(a, a1);
    col = mix(col, COLOR_2, a2); a = max(a, a2);
    col = mix(col, COLOR_3, a3); a = max(a, a3);
    col = mix(col, COLOR_4, a4); a = max(a, a4);
    col = mix(col, COLOR_5, a5); a = max(a, a5);
    col = mix(col, COLOR_6, a6); a = max(a, a6);

    gl_FragColor = vec4(col, a);
}

---
name: BG
type: fragment
author: me
uniform.time: { "type": "1f", "value": 0.0 }
uniform.cameraScrollX: { "type": "1f", "value": 0.0 }
uniform.cameraScrollY: { "type": "1f", "value": 0.0 }
uniform.zoom: { "type": "1f", "value": 1.0 }
---

precision highp float;
uniform vec2 resolution;

uniform float time;
uniform float cameraScrollX;
uniform float cameraScrollY;
uniform float zoom;

const int samples = 5;
const int sample_count = samples * samples;

#define PI 3.14159265358979323846

void main(void){
    gl_FragColor = vec4(0.0);
    return;
    vec2 pos = (gl_FragCoord.xy - 0.5 * resolution) / min(resolution.x, resolution.y);
    pos *= 1000.0;

    float val_0 = tan(pos.x * pos.y * 0.0004);

    pos += vec2(sin(time * 0.5) * 100.0);
    float val_1 = sin(pos.x) + cos(pos.y);

    pos += vec2(sin(time * 0.5) * 200.0);
    float val_2 = sin(pos.x * 0.002) + cos(pos.y * 0.002);

    pos += vec2(sin(time * 0.5) * 300.0);
    float val_3 = sin(pos.x * 0.01) + sin(pos.y * 0.01);

    pos += vec2(sin(time * 0.5) * 400.0);
    float val_4 = cos(pos.x * 0.02) + cos(pos.y * 0.02);

    pos += vec2(sin(time * 0.5) * 500.0);
    float val_5 = sin(pos.x * 0.08) + cos(pos.y * 0.08);

    float val =
    val_0
    + val_1
    + val_2
    + val_3
    + val_4
    + val_5
    ;
    val /= 6.0;
    gl_FragColor = vec4(val);
}

---
name: CELLS
type: fragment
author: me
uniform.time: { "type": "1f", "value": 0.0 }
uniform.cameraScrollX: { "type": "1f", "value": 0.0 }
uniform.cameraScrollY: { "type": "1f", "value": 0.0 }
uniform.zoom: { "type": "1f", "value": 1.0 }
---

precision highp float;
uniform vec2 resolution;

uniform float time;
uniform float cameraScrollX;
uniform float cameraScrollY;
uniform float zoom;

uniform sampler2D uSampler;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform sampler2D iChannel2;
uniform sampler2D iChannel3;
uniform sampler2D iChannel4;
uniform sampler2D iChannel5;

const float game_size = 729.0;
const float cellSize = 256.0 / 3.0;
const float scale = game_size * cellSize;

const float lowerBound = 1.0;

void main(void) {
    vec2 screen = vec2(gl_FragCoord.x, resolution.y - gl_FragCoord.y) - 0.5;
    vec2 center = resolution * 0.5;
    
    vec2 world = vec2(cameraScrollX, cameraScrollY) +
                 ((screen - center) / zoom) +
                 center;

    vec2 cellCoord = floor(world / cellSize);

    if(cellCoord.x >= game_size || cellCoord.y >= game_size ||
       cellCoord.x < 0.0 || cellCoord.y < 0.0){
        gl_FragColor = vec4(0.0);
        return;
    }

    // Always show finest LOD (1x1 cells)
    vec2 uv = (cellCoord + 0.5) / game_size;
    vec4 col = texture2D(iChannel0, uv);
    
    // Overdraw with coarser LODs - match grid shader thresholds
    if (zoom < 1.0) {
        vec2 cellCoord_0 = floor(world / (cellSize * 3.0));
        vec2 uv_0 = (cellCoord_0 + 0.5) / (game_size / 3.0);
        vec4 temp = texture2D(iChannel1, uv_0);
        if (temp.a > 0.01) col = temp;
    }
    
    if (zoom < 0.35) {
        vec2 cellCoord_1 = floor(world / (cellSize * 9.0));
        vec2 uv_1 = (cellCoord_1 + 0.5) / (game_size / 9.0);
        vec4 temp = texture2D(iChannel2, uv_1);
        if (temp.a > 0.01) col = temp;
    }
    
    if (zoom < 0.1) {
        vec2 cellCoord_2 = floor(world / (cellSize * 27.0));
        vec2 uv_2 = (cellCoord_2 + 0.5) / (game_size / 27.0);
        vec4 temp = texture2D(iChannel3, uv_2);
        if (temp.a > 0.01) col = temp;
    }
    
    if (zoom < 0.035) {
        vec2 cellCoord_3 = floor(world / (cellSize * 81.0));
        vec2 uv_3 = (cellCoord_3 + 0.5) / (game_size / 81.0);
        vec4 temp = texture2D(iChannel4, uv_3);
        if (temp.a > 0.01) col = temp;
    }
    
    if (zoom < 0.015) {
        vec2 cellCoord_4 = floor(world / (cellSize * 243.0));
        vec2 uv_4 = (cellCoord_4 + 0.5) / (game_size / 243.0);
        vec4 temp = texture2D(iChannel5, uv_4);
        if (temp.a > 0.01) col = temp;
    }

    // Force alpha to 1.0 if color exists
    if (col.r > 0.01 || col.g > 0.01 || col.b > 0.01) {
        col.a = col.a;
    }

    gl_FragColor = col;
}