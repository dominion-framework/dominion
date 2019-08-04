const Errors                    = require("./../errors");
const PropertyCollection        = require("./../property/collection");


class ModelPrototype {
    save () {
        if(!this.repo) {
            throw new Errors.Fatal(`Can not save model '${this.__name__}' because repository is not defined. Add property 'repository' in model declaration.`);
        }
        this.validate();
        return this.repo.save(this);
    }

    remove () {
        if(!this.repo) {
            throw new Errors.Fatal(`Can not remove model '${this.__name__}' because repository is not defined. Add property 'repository' in model declaration.`);
        }

        return this.repo.remove(this);
    }

    toJSON () {
        return PropertyCollection.output(this.__properties__, this.scheme);
    }

    populate (props) {
        Object.keys(props).forEach((propName) => {
            if (this.__proto__.hasOwnProperty(propName)) {
                this[propName] = props[propName];
            } else {
                throw new Errors.Validation(`The object populating model '${this.__name__}' does not match its structure, property '${propName}' is redundant.`)
            }
        });

        return this;
    }

    validate () {
        PropertyCollection.validate(this.__properties__, this.scheme, this.__name__);
    }
}

module.exports = ModelPrototype;
