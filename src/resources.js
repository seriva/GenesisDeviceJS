import Console from './console';
import Texture from './texture';
import Mesh from './mesh';
import Loading from './loading';
import Utils from './utils';

let paths = [];
const resources = {};
const basepath = 'resources/';

const Resources = {
    load(p) {
        return new Promise((resolve) => {
            const re = /(?:\.([^.]+))?$/;
            this.addForLoading(p);
            let counter = 0;
            Loading.toggle(true);

            const loadNext = async () => {
                let resource = null;
                const path = paths[counter];
                const fullpath = basepath + path;
                const ext = re.exec(path)[1];
                try {
                    switch (ext) {
                    case 'jpg':
                        resource = await new Texture(fullpath);
                        break;
                    case 'obj':
                        resource = await new Mesh(fullpath, this);
                        break;
                    case 'list': {
                        resource = JSON.parse(await Utils.loadData(fullpath)).resources;
                        this.addForLoading(resource);
                        break;
                    }
                    default:
                        break;
                    }

                    Console.log('Loaded "' + path + '"');
                    resources[path] = resource;
                    counter++;
                    if (counter === paths.length) {
                        Loading.toggle(false);
                        paths = [];
                        resolve();
                    } else {
                        loadNext();
                    }
                } catch (err) {
                    Console.log('Error loading "' + path + '": ' + err);
                }
            };

            loadNext();
        });
    },

    addForLoading(p) {
        paths = paths.concat(p);
    },

    get(key) {
        const resource = resources[key];
        if (resource) {
            return resource;
        }
        Console.error('Resource "' + key + '" does not exist');
        return null;
    }
};

export { Resources as default };
