const ModelProperty             = use("core/property/types/model");


class Collections {

    constructor() {
        this.linkIndex = [];
        this.modelsSet = {};
    }

    has(modelReference) {
        return this.linkIndex.includes(modelReference.link);
    }

    set(modelReference, models) {
        const addModel = (link, model) => {
            this.linkIndex.push(link);
            this.modelsSet[link] = model;
        }
        if(Array.isArray(models)) {
            models.forEach(model => addModel(`${modelReference.link}/${model.id}`, model));
        } else {
            addModel(modelReference.link, models);
        }
    }

    getMissingChildModelsReferences() {
        const missingChildModelsReferences = [];

        Object.values(this.modelsSet).forEach(model => {
            missingChildModelsReferences.push(...
                Object.keys(model.scheme)
                    .filter(propertyName => model[propertyName] !== null && model.scheme[propertyName] instanceof ModelProperty)
                    .map(propertyName => {
                        const modelReference = {[propertyName]: model[propertyName]};
                        model.scheme[propertyName]._output(modelReference, propertyName);
                        return modelReference[propertyName];
                    })
                    .filter(modelReference => modelReference && missingChildModelsReferences.every(ref => ref.link !== modelReference.link)
                        && !this.has(modelReference))
            );
        });

        return missingChildModelsReferences;
    }

    toJSON() {
        return Object.values(this.modelsSet)
            .reduce((obj, model) => {
                if(!obj[model.__name__]) {
                    obj[model.__name__] = [];
                }
                obj[model.__name__].push(model);
                return obj;
            }, {});
    }
}

module.exports = Collections;
