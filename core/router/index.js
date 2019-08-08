const Config                    = require("./../../config");
const Errors                    = require("./../errors");
const Messages                  = require("./../messages");
const makeRoute                 = require("./makeRoute");

const registeredRoutes = new Map();


class Router {

    static makeRoute (){
        return makeRoute.apply(this, arguments);
    }

    static addRoutes (routes) {
        if (!routes) {
            throw new Errors.Fatal("Routes definitions is missing");
        }

        routes.forEach((route) => {
            let handlersMap;

            if (!registeredRoutes.has(route.method)) {
                registeredRoutes.set(route.method, new Map());
            }
            handlersMap = registeredRoutes.get(route.method);

            if (handlersMap.has(route.pattern)) {
                throw new Errors.Fatal(`Route for ${route.method} ${route.pattern} is already defined`);
            }

            handlersMap.set(route.pattern, route);

        });

        return routes;
    };

    static handle (req, res) {
        const message = new Messages(req, res);
        const [args, handler] = findRoute(message.request.method, message.request.path);

        message.request.handler = handler;

        const handlers = [
            ...Messages.request.getInterceptors(),
            handler.handler.bind(message, ...args),
            ...Messages.response.getInterceptors()
        ];

        let messagePromise = Promise.resolve();
        handlers.forEach(function (interceptorFunction) {
            messagePromise = messagePromise.then(interceptorFunction.bind(message));
        });
        messagePromise
            .then(body => {
                if (body
                    && handler.factory
                    && ((Array.isArray(body) && !body.every(model => model instanceof handler.factory.__model__))
                        || !(body instanceof handler.factory.__model__))) {
                    throw new Errors.Fatal(`Response has to be an instance or instances array of '${handler.factory.__model__.name}' factory. But given: ${body}`);
                }
                return body;
            })
            .catch(function (error) {
                if (error instanceof Errors.NotFound
                    || (error instanceof Errors.Database && error.originalError.errno === 1452 /* ER_NO_REFERENCED_ROW_2 */)) {
                    this.response.status = this.response.statuses._404_NotFound;
                } else if (error instanceof Errors.BadRequest) {
                    this.response.status = this.response.statuses._400_BadRequest;
                } else if (error instanceof Errors.Validation){
                    this.response.status = this.response.statuses._400_BadRequest;
                } else if (error instanceof Errors.Unauthorized) {
                    this.response.headers["WWW-Authenticate"] = "Bearer";
                    this.response.status = this.response.statuses._401_Unauthorized;
                } else if (error instanceof Errors.Forbidden) {
                    this.response.status = this.response.statuses._403_Forbidden;
                } else if (error instanceof Errors.Database && (
                    error.originalError.errno === 1062 /* ER_DUP_ENTRY */
                    || error.originalError.errno === 1451 /* ER_ROW_IS_REFERENCED_2 */ )
                ){
                    this.response.status = this.response.statuses._409_Conflict;
                } else if (error instanceof Errors.NotImplemented) {
                    this.response.status = this.response.statuses._501_NotImplemented;
                } else {
                    this.response.status = this.response.statuses._500_InternalServerError;
                }
                return Config.env.production? (console.error(error), "") : error.toJSON? error : error.toString();
            }.bind(message))
            .then(function (body) {
                this.response.body = body;
                this.response.send();
                return this;
            }.bind(message));

        return messagePromise;
    };
}

const findRoute = function (method, path) {
    const handlersMap = registeredRoutes.get(method);

    if (handlersMap) {
        const handlersIterator = handlersMap.keys();
        let regexpPattern, args;

        while (regexpPattern = handlersIterator.next().value) {
            if (args = regexpPattern.exec(path)) {
                args = args.map(arg => typeof arg == "undefined" ? arg : decodeURIComponent(arg));
                return [args.slice(1), handlersMap.get(regexpPattern)];
            }
        }
    }

    return [[],makeRoute(method, function(){throw new Errors.NotImplemented(`Route '/${path}" does not exist.`)})];
};

module.exports = Router;
