const Controllers               = require("./controllers");
const Factories                 = require("./factories");
const Messages                  = require("./messages");
const Router                    = require("./router");
const OpenApi                   = require("./open-api");
const Config                    = require("./../config");


class Server {

    constructor() {
        this.componentsModules = {
            requestInterceptors: new Set(),
            responseInterceptors: new Set(),
            controllers: new Set(),
            factories: new Set(),
            bootstrap: new Set()
        };
    }

    start() {
        const environment = Object.entries(Config.env).find(([env, flag]) => flag)[0];
        const Http = Config.server.protocol === "http"? require("http") : require("https");

        const serverAddress = Config.server.path? Config.server.path : `${Config.server.protocol}://${Config.server.host}:${Config.server.port}/`;
        if(Config.server.path) {
            delete Config.server.port;
        }

        componentsRegistration.call(this);
        this.server = Http.createServer(Config.server, Router.handle);
        this.server.once("error", error => {
            if (error.code === 'EADDRINUSE') {
                console.log('\x1b[31m%s\x1b[0m', `Server failed to start at ${serverAddress}. Port ${Config.server.port} is in use.`);
            } else {
                console.log(error);
            }
        });
        this.server.listen(Config.server, () => {
            componentsBootstrap.call(this);
            console.log('\x1b[32m%s\x1b[0m', `Server is running at ${serverAddress} in ${environment} mode...`);
        });
    }

    stop() {
        this.server.close();
    }

    addComponent(componentInfo) {
        Object.keys(componentInfo).forEach(type => componentInfo[type].forEach(
            path => this.componentsModules[type].add(path)
        ));
    }

    openApiJSON() {
        const packageJson = require.main.require("./package.json");
        return OpenApi.generate({
            "title": packageJson.name,
            "description": packageJson.description,
            "version": packageJson.version,
            "contact": packageJson.author
        });
    }

    openApiToFile(path = "./openapi.json") {
        const fs = require("fs");
        fs.writeFileSync(path, JSON.stringify(this.openApiJSON(), null, 4));
    }
}


const componentsRegistration = function () {
    this.componentsModules.factories.forEach(model => {
        Factories.define(require(model));
    });

    this.componentsModules.requestInterceptors.forEach(interceptor => {
        Messages.request.addInterceptor(require(interceptor));
    });

    this.componentsModules.responseInterceptors.forEach(interceptor => {
        Messages.response.addInterceptor(require(interceptor));
    });

    this.componentsModules.controllers.forEach(controller => {
        Controllers.define(require(controller));
    });

};

const componentsBootstrap = function () {
    this.componentsModules.bootstrap.forEach(controller => {
        const bootstrapFn = require(controller);
        (typeof bootstrapFn === "function") && bootstrapFn(this);
    });
};


module.exports = Server;
