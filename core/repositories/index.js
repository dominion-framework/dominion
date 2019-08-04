const Errors                    = use('core/errors');

const RepositoryPrototype       = require('./repositoryPrototype');


class Repositories {
    static create(tableName, repositoryPrototype, repositoryDefinition) {
        if (!tableName) {
            throw new Errors.Fatal(`Table name is missing in repository definition`);
        }

        if (!repositoryDefinition) {
            repositoryDefinition = repositoryPrototype;
            repositoryPrototype = RepositoryPrototype;
        }

        const className = tableName[0].toUpperCase() + tableName.slice(1);
        const Repository = (new Function(`return function Repository${className} (){this.__table__ = '${tableName}'}`))();
        Repository.prototype = Object.create(repositoryPrototype);
        Object.assign(Repository.prototype, repositoryDefinition || {});

        return new Repository();
    }
}


module.exports = Repositories;