const Errors                    = require("./../../errors");
const DefaultProperty           = require('./default');


class DateProperty extends DefaultProperty {

    constructor() {
        super();

        this._addValidator((value, propertyName) => {
            const originalValue = value;

            if (value && (!(value instanceof Date) || isNaN(value.getTime()))) {
                throw new Errors.Validation(`property ${propertyName} should be a valid DateTime, given '${originalValue}'`);
            }
        });

        this._inputModification = (value) => {
            return (typeof value === "object" && (value instanceof Date || value === null)) ? value : new Date(typeof value === "number" ? value : value + (value.includes('Z') ? '' : 'Z'));
        };
    }

}

module.exports = DateProperty;
