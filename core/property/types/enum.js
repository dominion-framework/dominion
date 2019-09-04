const Errors                    = require("./../../errors");
const DefaultProperty           = require("./default");


class EnumProperty extends DefaultProperty {

    constructor(valuesList) {
        super();

        this.valuesList = valuesList;

        this._addValidator((value, propertyName) => {
            if (value && !this.valuesList.includes(value)) {
                throw new Errors.Validation(`property ${propertyName} should have one of enum value: ${this.valuesList.map(val => `${val} (${typeof val})`).join(', ')}, given '${value} (${typeof value})'`);
            }
        });
    }

}

module.exports = EnumProperty;
