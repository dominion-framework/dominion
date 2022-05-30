const Router                    = require("./../../../core/router");

const Collections               = require("./collections");
const DispatchRequest           = require("./dispatchRequest");
const DispatchResponse          = require("./dispatchResponse");


const collectModels = function (models, depth) {

    const collections = new Collections();
    let chain = Promise.resolve(models);
    while (depth--) {
        chain = chain
            .then(fetchModels.bind(this, collections))
            .then(collections.getMissingChildModelsReferences.bind(collections))
    }
    return chain.then(() => collections);
};

const fetchModels = function (collections, models) {

    return Promise.all(models.map(modelReference => {
        return Router.handle(new DispatchRequest(this.request.__request__, modelReference.link), new DispatchResponse())
            .then(models => {
                collections.set(modelReference, models);
            });
    }));
};


module.exports = collectModels;
