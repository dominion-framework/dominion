const PropertyCollection = {

    validate(propertiesValues, schema, modelName) {
        Object.keys(schema)
            .forEach(property => schema[property]._validate(propertiesValues[property], property, modelName));
    },

    output(propertiesValues, schema) {
        let outputObject = Object.assign({}, propertiesValues);

        Object.keys(schema)
            .forEach(property => schema[property]._output(outputObject, property));

        return outputObject;
    }

};

module.exports = PropertyCollection;
