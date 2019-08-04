const Errors                    = require("./../../errors");
const DefaultProperty           = require("./default");


class ObjectProperty extends DefaultProperty {

    constructor() {
        super();

        this._addValidator((value, propertyName) => {
            if (value && typeof value !== "object") {
                throw new Errors.Validation(`property ${propertyName} should be an object, given '${value}'`)
            }
        });
    }

    withProperties(requiredProperties) {
        this._addValidator((value, propertyName) => {
            for (let requiredProperty of requiredProperties) {
                if (!(value.hasOwnProperty(requiredProperty))) {
                    throw new Errors.Validation(`property ${propertyName}.${requiredProperty} is required, but does not exists`);
                }
            }
        });
        return this.required();
    }

}

module.exports = ObjectProperty;
