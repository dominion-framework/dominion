const Errors = {
    Fatal: "Fatal error",
    NotFound: "Entity not found",
    Validation: "Validation error",
    BadRequest: "Bad request",
    Unauthorized: "Unauthorized",
    Forbidden: "Forbidden",
    Database: "Database error",
    Conflict: "Conflict",
    NoConnection: "Connection error",
    NotImplemented: "Not implemented"
};

Object.entries(Errors).forEach(([errorType, defaultMessage]) => {
    Errors[errorType] = {
        [errorType]: class extends Error {
            constructor(message) {
                super(message || defaultMessage);
            }

            toJSON() {
                return {
                    message: this.message,
                    stack: this.stack
                }
            }
        }
    }[errorType];
});

module.exports = Errors;
