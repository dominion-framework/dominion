const Router                    = require("./../router");
const Errors                    = require("./../errors");
const getHandlersDefinitions    = require("./handlersDefinitions");

const controllersCollection = new Map();


class Controllers {

    static define(controller) {
        if (controller.path && controller.factory) {
            throw new Errors.Fatal(`Both 'path' (${controller.path}) and 'factory' (${controller.factory.__model__.name}) can not be set in controller. You should have only one of them, 'factory' is recommended.`);
        } else if (!controller.path && !controller.factory) {
            throw new Errors.Fatal(`You should set either 'factory' or 'path' in controller.`);
        } else {
            if (controller.factory) {
                controller.path = controller.factory.__model__.name;
            }
            controllersCollection.set(controller.path, getHandlersDefinitions(controller));
        }
        return Router.addRoutes(controllersCollection.get(controller.path));
    }

    static get() {
        return controllersCollection;
    }
}

module.exports = Controllers;
