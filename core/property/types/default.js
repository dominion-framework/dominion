const Errors                    = require("./../../errors");


class PropertyPrototype {

    constructor() {
        this._validators = new Set();
        this._outputModifications = new Set();
    }

    _addValidator(validateFunction) {
        this._validators.add(validateFunction);
    }

    _addOutputModification(outputSetter) {
        this._outputModifications.add(outputSetter);
    }

    _inputModification(value) {
        return value;
    }

    _validate(value, propertyName, modelName) {
        try {
            this._validators.forEach(validator => validator.call(this, value, propertyName, modelName));
        } catch (error) {
            if (error instanceof Errors.Validation) {
                throw new Errors.Validation(`In ${modelName} model ` + error.message);
            } else {
                throw error;
            }
        }
    }

    _output(outputObject, propertyName) {
        this._outputModifications.forEach(outputSetter => outputSetter(outputObject, propertyName));
    }
}

class DefaultProperty extends PropertyPrototype {
    required() {
        this._addValidator(function required(value, propertyName) {
            if (typeof value === "undefined" || value === null) {
                throw new Errors.Validation(`property ${propertyName} is required, but does not exists`);
            }
        });
        return this;
    }

    private() {
        // callback should be named function, because it is used in open-api generation.
        this._addOutputModification(function private(outputObject, propertyName) {
            delete outputObject[propertyName];
        });
        return this;
    }

    primaryKey() {
        this.isPrimaryKey = true;
        return this;
    }

    example(exampleValue) {
        this.documentationExampleValue = exampleValue;
        return this;
    }
}

module.exports = DefaultProperty;
