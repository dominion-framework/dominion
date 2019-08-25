const Router                    = require("./../router");
const Errors                    = require("./../errors");

const allowedMethods = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "WS"];


const getHandlersDefinitions = function (controller) {

    const controllerRoot = controller.factory? controller.factory.__model__.name : controller.path;
    const permissions = controller.permissions || {};

    const controllerHandlers = Object.keys(controller)
        .filter((key) => {
            if (["path", "factory", "permissions"].includes(key)) {
                return false;
            }
            if (!allowedMethods.includes(key)) {
                throw new Errors.Fatal(`Method '${method}' is not recognized. Note, methods should be uppercase.`);
            }
            return true;
        });

    return controllerHandlers.reduce((routeHandlers, method) => {
        return routeHandlers.concat(controller[method].map(
            handler => Router.makeRoute(method, handler, controllerRoot, controller.factory, permissions[method])))
    }, []);
};

module.exports = getHandlersDefinitions;
