const Config                    = require("./../../../config");
const Errors                    = require("./../../errors");
const DefaultProperty           = require("./default");

const PrimaryKeyPattern         = new RegExp('^'+Config.router.primaryKeyPattern + '$');


class ModelProperty extends DefaultProperty {

    constructor(modelName) {
        super();

        const Factories = require("./../../factories");

        this.modelName = modelName;

        this._addValidator((value, propertyName) => {
            if (value != null && (
                (typeof value === "object" && (!PrimaryKeyPattern.test(value.id)))
                || (typeof value !== "object" && (!PrimaryKeyPattern.test(value)))
            )
            ) {
                throw new Errors.Validation(`property ${propertyName} should be positive integer or model instance, given '${value}'`);
            }
        });

        this._addValidator((value, propertyName) => {
            try {
                Factories(this.modelName);
            } catch (error) {
                if (error instanceof Errors.Fatal) {
                    throw new Errors.Validation(`property ${propertyName} should be a model ${modelName}, but such model is not defined`);
                } else {
                    throw error;
                }
            }
        });

        this._addOutputModification((outputObject, propertyName) => {
            if (outputObject[propertyName] !== null) {
                outputObject[propertyName] = {
                    id: outputObject[propertyName],
                    model: this.modelName,
                    link: Config.router.urlPrefix + this.modelName.toLowerCase() + "/" + outputObject[propertyName]
                };
            }
        });

        this._inputModification = (value) => {
            return (value !== null && typeof value === "object" && PrimaryKeyPattern.test(value.id)) ? value.id : value;
        };
    }

}

module.exports = ModelProperty;
