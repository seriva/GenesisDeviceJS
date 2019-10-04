import { Shaders, Shader } from './shaders.js';
import Resources from './resources.js';
import Buffers from './buffers.js';
import Settings from './settings.js';
import Skybox from './skybox.js';
import World from './world.js';
import { Context } from './context.js';

const quad = Resources.get('system/quad.mesh');

const doGeomPass = () => {
    Buffers.startGeomPass();
    Shaders.geometry.bind();

    Skybox.render();

    World.render();

    Shader.unBind();
    Buffers.endGeomPass();
};

const doLightingPass = () => {
    Buffers.startLightingPass();

    Shaders.directionalLight.bind();
    Shaders.directionalLight.setInt('positionBuffer', 0);
    Shaders.directionalLight.setInt('normalBuffer', 1);
    Shaders.directionalLight.setInt('colorBuffer', 2);
    Shaders.directionalLight.setVec3('directionalLight.direction', [-3.0, 3.0, -5.0]);
    Shaders.directionalLight.setVec3('directionalLight.diffuse', [0.8, 0.8, 0.8]);
    Shaders.directionalLight.setVec3('directionalLight.ambient', [0.7, 0.7, 0.7]);

    quad.renderSingle();

    Shader.unBind();
    Buffers.endLightingPass();
};

const doPostProcessingPass = () => {
    Buffers.startPostProcessingPass();
    Shaders.postProcessing.bind();
    Shaders.postProcessing.setInt('doFXAA', Settings.dofxaa);
    Shaders.postProcessing.setInt('doSSAO', Settings.dossao);
    Shaders.postProcessing.setInt('doEmissive', Settings.doemissive);
    Shaders.postProcessing.setInt('emissiveBuffer', 4);
    Shaders.postProcessing.setInt('colorBuffer', 0);
    Shaders.postProcessing.setInt('positionBuffer', 1);
    Shaders.postProcessing.setInt('normalBuffer', 2);
    Shaders.postProcessing.setInt('noiseBuffer', 3);
    Shaders.postProcessing.setInt('emissiveBuffer', 4);
    Shaders.postProcessing.setVec2('viewportSize', [Context.width(), Context.height()]);
    Shaders.postProcessing.setFloat('ssao.sampleRadius', Settings.ssaoRadius);
    Shaders.postProcessing.setFloat('ssao.bias', Settings.ssaoBias);
    Shaders.postProcessing.setVec2('ssao.attenuation', Settings.ssaoAttenuation);
    Shaders.postProcessing.setVec2('ssao.depthRange', [Settings.znear, Settings.zfar]);

    quad.renderSingle();

    Shader.unBind();
    Buffers.endPostProcessingPass();
};

const Renderer = {
    render() {
        doGeomPass();
        doLightingPass();
        doPostProcessingPass();
    }
};

export { Renderer as default };
