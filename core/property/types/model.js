const Config                    = require("./../../../config");
const Errors                    = require("./../../errors");
const Factories                 = require("./../../factories");
const DefaultProperty           = require("./default");

const PrimaryKeyPattern         = new RegExp('^'+Config.router.primaryKeyPattern + '$');


class ModelProperty extends DefaultProperty {

    constructor(modelName) {
        super();

        this.modelName = modelName;

        this._addValidator((value, propertyName) => {
            try {
                getPrimaryKey.call(this);
            } catch (error) {
                if (error instanceof Errors.Fatal) {
                    throw new Errors.Validation(`property ${propertyName} should be a model ${modelName}, but such model is not defined`);
                } else {
                    throw error;
                }
            }

            if(!this.primaryKeyName) {
                throw new Errors.Fatal(`Model '${this.modelName}' referred in property ${propertyName} should have a property marked as primary key (.id(), .uuid() or .primaryKey())`);
            }
        });

        this._addValidator((value, propertyName) => {
            if (value != null && (
                (typeof value === "object" && (!PrimaryKeyPattern.test(value[this.primaryKeyName])))
                || (typeof value !== "object" && (!PrimaryKeyPattern.test(value)))
            )) {
                throw new Errors.Validation(`property ${propertyName} should be positive integer or model instance, given '${value}'`);
            }
        });

        this._addOutputModification((outputObject, propertyName) => {
            if (outputObject[propertyName]) {
                outputObject[propertyName] = {
                    [this.primaryKeyName]: outputObject[propertyName],
                    model: this.modelName,
                    link: Config.router.urlPrefix + this.modelName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase() + "/" + outputObject[propertyName]
                };
            }
        });

        this._inputModification = (value) => {
            getPrimaryKey.call(this);
            return (value !== null && typeof value === "object" && PrimaryKeyPattern.test(value[this.primaryKeyName])) ? value[this.primaryKeyName] : value;
        };
    }

}

function getPrimaryKey() {
    if(this.primaryKeyName || this.primaryKeyName === null) {
        return;
    }

    this.factory = this.factory || Factories(this.modelName);
    let primaryKey = Object.entries(this.factory.__model__.prototype.scheme).find(([keyName, property]) => property.isPrimaryKey);
    this.primaryKeyName = primaryKey? primaryKey[0] : null;
}


module.exports = ModelProperty;
