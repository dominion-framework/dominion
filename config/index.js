let defaultConfig = require("./defaultConfig");

const merge = (target, source) => {
    for (let key of Object.keys(source)) {
        if (source[key] instanceof Object) Object.assign(source[key], merge(target[key], source[key]))
    }
    Object.assign(target || {}, source);
    return target;
};

try {
    defaultConfig = merge(defaultConfig, require.main.require("./config"));
} catch (e) {}

defaultConfig.env = {"production": false, "test": false, "development": false};
defaultConfig.env[process.env.NODE_ENV || "development"] = true;

module.exports = defaultConfig;
