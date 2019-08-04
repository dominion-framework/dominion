const Config                    = use('config');
const Errors                    = use('core/errors');

const mysql                     = require('mysql2/promise');


const connections = new Map();

function ConnectionPools(config = Config.database) {
    if (!connections.has(config)) {
        const pool = mysql.createPool(config);
        connections.set(config, {
            /** Used for the prepared statement protocol queries.
             *  It should be used for ALL queries except of DB manipulation. */
            execute(query, args = []) {
                return pool.execute(query, args)
                    .catch((error) => {
                        let errorDatabase = new Errors.Database(error.message);
                        errorDatabase.originalError = {
                            code: error.code,
                            errno: error.errno,
                            sqlState: error.sqlState
                        };

                        throw errorDatabase;
                    });
            },

            /** Used for the queries that are not supported in the prepared statement protocol.
             *  It should be used only for DB schema manipulation, e.g. in test runners. */
            query() {
                return pool.query.apply(pool, arguments)
                    .catch((error) => {
                        throw new Errors.Database(error.message);
                    });
            }
        });
    }

    return connections.get(config);
}

module.exports = ConnectionPools;