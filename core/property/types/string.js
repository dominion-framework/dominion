const Errors                    = require("./../../errors");
const DefaultProperty           = require("./default");


class StringProperty extends DefaultProperty {

    constructor() {
        super();

        this._addValidator((value, propertyName) => {
            if (value && typeof value !== "string") {
                throw new Errors.Validation(`property ${propertyName} should be a string, given '${value}'`);
            }
        });
    }

    min(minValue) {
        this._addValidator((value, propertyName) => {
            if (value && value.length < minValue) {
                throw new Errors.Validation(`property ${propertyName} should have more than ${minValue} characters, given '${value}' (${value.length})`);
            }
        });
        return this;
    }

    max(maxValue) {
        this._addValidator((value, propertyName) => {
            if (value && value.length > maxValue) {
                throw new Errors.Validation(`property ${propertyName} should have less than ${maxValue} characters, given '${value}' (${value.length})`);
            }
        });
        return this;
    }

    pattern(regexp) {
        this._addValidator((value, propertyName) => {
            if (value && !regexp.test(value)) {
                throw new Errors.Validation(`property ${propertyName} should match pattern ${regexp}, given '${value}'`);
            }
        });
        return this;
    }

}

module.exports = StringProperty;
