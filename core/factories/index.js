const Errors                    = require("./../errors");
const ModelFactoryPrototype     = require("./modelFactoryPrototype");
const ModelPrototype            = require("./modelPrototype");


const factoryCollection = new Map();

const Factories = function (factoryName) {
    const factory = factoryCollection.get(factoryName.toLowerCase());

    if(factory) {
        return factory;
    } else {
        throw new Errors.Fatal(`Factory '${factoryName}' is not defined.`);
    }
};

Factories.define = function (factoryDescription) {
    let factoryName = factoryDescription.name.toLowerCase();

    if (factoryName.trim() === "") {
        throw new Errors.Fatal(`Factory name can not be empty.`);
    }
    if (factoryCollection.has(factoryName)) {
        throw new Errors.Fatal(`Factory with name '${factoryName}' already defined.`);
    } else {
        factoryCollection.set(factoryName, createModelsFactory(factoryDescription));
    }
    return factoryCollection.get(factoryName);
};

let createModelsFactory = function (factoryDescription) {

    let ModelFactory = class extends ModelFactoryPrototype {
        constructor() {
            super();
            this.__cache__ = new Map();
            this.__cacheDuration__ = 10 * 1000 /*ms */;
        }
    };

    Object.assign(ModelFactory.prototype, factoryDescription.factory, {
        repo: factoryDescription.repository
    });

    let ModelFactoryInstance = new ModelFactory();

    let Model ={[factoryDescription.name]: class extends ModelPrototype {
            constructor(props) {
                super();
                this.__properties__ = {};
                props && this.populate(props);
            }
        } }[factoryDescription.name];

    Object.assign(Model.prototype, factoryDescription.instance, {
        repo: factoryDescription.repository,
        scheme: factoryDescription.properties,
        __name__: factoryDescription.name
    });

    Object.defineProperties(Model.prototype, Object.keys(factoryDescription.properties).reduce((propertyDefinition, propertyName) => {
        if (Model.prototype.hasOwnProperty(propertyName)) {
            throw new Errors.Fatal("Incorrect factory definition. Note, factory could not contain 'repo' and 'scheme' property names.");
        }
        propertyDefinition[propertyName] = {
            set(value) {
                value = this.scheme[propertyName]._inputModification(value);
                this.scheme[propertyName]._validate(value, propertyName, factoryDescription.name);
                this.__properties__[propertyName] = value;
            },
            get() {
                return this.__properties__[propertyName];
            }
        };
        return propertyDefinition;
    }, {}));

    ModelFactoryInstance.__model__ = Model;

    return ModelFactoryInstance;
};

module.exports = Factories;
