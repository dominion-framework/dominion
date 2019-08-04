const CollectModels             = require("./services/collectModels");


const DispatchController = {

    path: "dispatch",

    permissions: { },

    GET : [
        // dispatch
        function (models = "[]", depth = 1) {
            return CollectModels.call(this, JSON.parse(models), depth);
        }
    ]
};


module.exports = DispatchController;