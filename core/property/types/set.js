const Errors                    = require("./../../errors");
const DefaultProperty           = require("./default");


class SetProperty extends DefaultProperty {

    constructor(valuesList) {
        super();

        this.valuesList = valuesList;

        this._addValidator((value, propertyName) => {
            if (value && !Array.isArray(value)) {
                throw new Errors.Validation(`property ${propertyName} should be an array, given [${typeof value}] '${value}'`);
            }
        });

        this._addValidator((value, propertyName) => {
            value && value.forEach((val) => {
                if (!this.valuesList.includes(val)) {
                    throw new Errors.Validation(`property ${propertyName} should only contain values from enum: ${this.valuesList.join(', ')}, given '${val}'`);
                }
            });
        });
    }

}

module.exports = SetProperty;
