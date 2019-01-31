import Console from './console';
import Settings from './settings';
import DOM from './dom';

const h = DOM.h;

DOM.registerCSS({
    '#game': {
        background: '#000',
        width: '100vw',
        height: '100vh',
        display: 'block',
        zIndex: 0
    }
});

let doBlur = false;

const canvas = h('canvas#game');
DOM.append(() => canvas);

const gl = canvas.domNode.getContext('webgl2', {
    antialias: true
});
if (!gl) {
    Console.error('Failed to initialize WebGL 2.0 context');
}
if (!gl.getExtension('EXT_color_buffer_float')) {
    Console.error(' Extension EXT_color_buffer_float is required to run');
}

const afExt = gl.getExtension('EXT_texture_filter_anisotropic')
    || gl.getExtension('MOZ_EXT_texture_filter_anisotropic')
    || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic');
if (!afExt) {
    Console.warn('Extension EXT_texture_filter_anisotropic is not present');
}

gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clearDepth(1.0);
gl.enable(gl.DEPTH_TEST);
gl.cullFace(gl.BACK);
gl.enable(gl.CULL_FACE);
gl.depthFunc(gl.LEQUAL);

Console.log('Initialized renderer');
Console.log(`Renderer: ${gl.getParameter(gl.RENDERER)}`);
Console.log(`Vendor: ${gl.getParameter(gl.VENDOR)}`);
Console.log(`WebGL version: ${gl.getParameter(gl.VERSION)}`);
Console.log(`GLSL version: ${gl.getParameter(gl.SHADING_LANGUAGE_VERSION)}`);
Console.log(`Max anisotropic filtering: ${afExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT}`);

const screenQuadVBO = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, screenQuadVBO);
gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1.0, -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0]),
    gl.STATIC_DRAW
);

const drawFullscreenQuad = () => {
    gl.bindBuffer(gl.ARRAY_BUFFER, screenQuadVBO);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disableVertexAttribArray(0);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
};

/* eslint-disable */
const width = () => Math.floor(gl.canvas.clientWidth * window.devicePixelRatio * Settings.renderscale);
const height = () => Math.floor(gl.canvas.clientHeight * window.devicePixelRatio * Settings.renderscale);
/* eslint-disable */

const aspectRatio = () => width() / height();

const toggleBlur = (blur) => {
    blur === undefined ? (doBlur = !doBlur) : (doBlur = blur);
    if (doBlur) {
        DOM.animate(canvas.domNode, { blur: 8 }, { duration: 75, delay: 0, easing: 'linear' });
    } else {
        DOM.animate(canvas.domNode, { blur: 0 }, { duration: 75, delay: 0, easing: 'linear' });
    }
};

window.addEventListener(
    'resize',
    () => {
        gl.canvas.width = width();
        gl.canvas.height = height();
        gl.viewport(0, 0, width(), height());
    },
    false
);

window.dispatchEvent(new Event('resize'));

Console.registerCmd('rscale', (scale) => {
    Settings.renderscale = Math.min(Math.max(scale, 0.2), 1);
    window.dispatchEvent(new Event('resize'));
});

const Renderer = {
    width,
    height,
    aspectRatio,
    gl,
    afExt,
    drawFullscreenQuad,
    toggleBlur
};

export { Renderer as default };
