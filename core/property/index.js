const PropertyTypes             = require("./types");
const NumberPropertyType        = require("./types/number");
const StringPropertyType        = require("./types/string");
const ObjectPropertyType        = require("./types/object");
const DatePropertyType          = require("./types/date");
const ModelPropertyType         = require("./types/model");
const EnumPropertyType          = require("./types/enum");
const SetPropertyType           = require("./types/set");


PropertyTypes.define({

    id() {
        return new NumberPropertyType().primaryKey().integer().min(1);
    },

    uuid() {
        return new StringPropertyType().pattern(/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/);
    },

    number() {
        return new NumberPropertyType();
    },

    string() {
        return new StringPropertyType();
    },

    object() {
        return new ObjectPropertyType();
    },

    date() {
        return new DatePropertyType();
    },

    model(modelName) {
        return new ModelPropertyType(modelName);
    },

    enum(valuesList) {
        return new EnumPropertyType(valuesList);
    },

    set(valuesList) {
        return new SetPropertyType(valuesList);
    }

});

module.exports = PropertyTypes;
