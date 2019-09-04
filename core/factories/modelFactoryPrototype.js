const Errors                    = require('./../errors');


class ModelFactoryPrototype {
    new (properties = {}, unsaved = true) {
        let newModel = new this.__model__(properties);
        newModel.__unsaved__ = unsaved;
        return Promise.resolve(Object.seal(newModel));
    }

    get (criteria) {
        return this.find(criteria, 0, 1).then((models) => {
            if (models.length) {
                return models[0];
            } else {
                throw new Errors.NotFound(this.__model__.name + ' model by criteria ' + JSON.stringify(criteria) + ' not found');
            }
        });
    }

    find (criteria = {}, offset, limit, order) {
        if(!this.repo) {
            throw new Errors.Fatal(`Can not get models '${this.__name__}' because repository is not defined. Add property 'repository' in model declaration.`);
        }

        return this.repo.find(criteria, offset, limit, order)
            .then(rows => Promise.all(rows.map(row => this.new(row, false))));
    }

    fetch (criteria) {
        const id = Object.values(criteria)[0];

        if (this.__cache__.has(id)) {
            return Promise.resolve(this.__cache__.get(id)[0]);
        } else {
            return this.get(criteria).then(model => {
                this.__cache__.set(id, [model, new Date()]);
                setTimeout(() => this.__cache__.delete(id), this.__cacheDuration__);
                return model;
            });
        }
    }
}

module.exports = ModelFactoryPrototype;
