const Config                    = require("./../../config");
const Controllers               = require("./../controllers");
const Factories                 = require("./../factories");

const OpenApi = {

    generate() {
        return Object.values(this.sections).reduce((obj, section) => {
            return Object.assign(obj, section.apply(this, arguments));
        }, {});
    },


    sections: {
        _version:    (meta) => {return {"swagger": "2.0"}},

        _info:       (meta) => {return {"info": {
                "title": meta.title,
                "description": meta.description,
                "version": meta.version,
            }
        }},
        _host:       (meta) => {return {"host": Config.server.url.replace(/https?:\/\//,"")}},
        _basePath:   (meta) => {return {"basePath": "/" + Config.router.urlPrefix.slice(0, -1)}},
        _schemes:    (meta) => {return {"schemes": Config.server.url.match(/^https/)? ["https"] : ["http"]}},
        _tags:       (meta) => {return {"tags": [...Controllers.get()].map(([tag]) => {return {"name": tag}} ).sort((a,b) => a.name.toLowerCase() < b.name.toLowerCase()? -1 : 1)}},
        _definitions:(meta) => {return {"definitions": OpenApi._definitions()}},
        _paths:      (meta) => {return {"paths": OpenApi._paths()}},
        _securityDef:(meta) => {return {"securityDefinitions": {
                "Permission": {
                    "description": "Provides access to private API's",
                    "type": "oauth2",
                    "authorizationUrl": Config.server.url + "/auth",
                    "flow": "implicit",
                    "scopes": OpenApi._permissionScopes
                },
                "Root permission": {
                    "description": "Provides root access to private API's",
                    "type": "oauth2",
                    "authorizationUrl": Config.server.url + "/auth",
                    "flow": "implicit",
                    "scopes": OpenApi._permissionRootScopes
                }
            }
        }}
    },

    _models() {
        return [...Controllers.get()].map(([tag, route]) => {
            try {
                const modelName = tag.split("\/").map(cap => cap[0].toUpperCase() + cap.substring(1)).join('');
                return Factories(modelName);
            }catch(e){
                return null;
            }
        }).filter(model => model);
    },

    _definitions() {
        const models = this._models();
        return models.reduce((definition, model) => {
            definition[model.__model__.name] = {
                "type": "object",
                "xml": {
                    "name": model.__model__.name
                },
                "required": [],
                "properties": {}
            };

            definition[`${model.__model__.name}Reference`] = {
                "type": "object",
                "xml": {
                    "name": `${model.__model__.name}Reference`
                },
                "required": ["id"],
                "properties": {
                    "id": {"type": "number", "example": 42},
                    "model": {"type": "string", "example": model.__model__.name},
                    "link": {"type": "string", "example": `${model.__model__.name.toLowerCase()}/42`}
                }
            };

            Object.entries(model.__model__.prototype.scheme).forEach(([propertyName, property]) => {
                if([...property._outputModifications].some(modificatorFunction => modificatorFunction.name === "private")){
                    return null;
                }

                definition[model.__model__.name].properties[propertyName] = this._propertyType(property);

                if([...property._validators].some(validatorFunction => validatorFunction.name === "required")){
                    definition[model.__model__.name].required.push(propertyName);
                }
            });

            if(!definition[model.__model__.name].required.length) {
                delete definition[model.__model__.name].required;
            }

            return definition;
        }, {});
    },

    _propertyType(property) {
        const types = {
            "none": (property) => { return {
                "type": "undefined",
                "format": "undefined",
                "example": "undefined"
            }},
            "NumberProperty": (property) => { return {
                "type": "number",
                "example": property.documentationExampleValue || 42
            }},
            "StringProperty": (property) => { return {
                "type": "string",
                "example": property.documentationExampleValue || "string literal"
            }},
            "ObjectProperty": (property) => { return {
                "type": "object",
                "example": property.documentationExampleValue || {}
            }},
            "DateProperty": (property) => { return {
                "type": "string",
                "format": "Date ISO 8601",
                "example": property.documentationExampleValue || "2018-07-30T16:52:00.192Z"
            }},
            "EnumProperty": (property) => { return {
                "type": "string",
                "enum": property.valuesList,
                "example": property.documentationExampleValue || property.valuesList[0]
            }},
            "SetProperty": (property) => { return {
                "type": "array",
                "items": {
                    "type": "string",
                    "enum": property.valuesList
                },
                "example": property.documentationExampleValue || [property.valuesList[0], property.valuesList[1]]
            }},
            "ModelProperty": (property) => { return {
                "$ref": `#/definitions/${property.modelName}Reference`
            }}
        };

        if(types[property.constructor.name]){
            return types[property.constructor.name](property);
        } else {
            return types["none"];
        }
    },

    _paths() {
        const paths = {};

        [...Controllers.get()].forEach(([controllerName, apis]) => {
            apis.reduce((paths, route) => {
                let argIndex = 0;
                let collection = true;
                let path, modelName;
                controllerName = controllerName.split("\/").map(cap => cap[0].toUpperCase() + cap.substring(1)).join('');


                if (this._models().map(model => model.__model__.name).includes(controllerName)) {
                    modelName = controllerName;
                }

                if (route.annotations.model && modelName) {
                    throw new Error(`Violation of API structure rules. Route can not return different than declared model. Route "${route.pattern}" is expected to return "${modelName}", but returns "${route.annotations.model}"`);
                }

                if (route.annotations.model) {
                    modelName = toCapitalCase(route.annotations.model);
                }

                let uri = "/" + (route.pattern.toString().split("(?:\\?")[0].replace(Config.router.urlPrefix.replace(/\//g, "\\/"), "").match(/\w+|\(\\d\+\)/g) || ["/"]).map((section, index, map)=> {
                    if((section === "(\\d+)" && index === map.length - 1) || route.method === "POST") {
                        collection = false;
                    }

                    return section === "(\\d+)" ? "{" + route.arguments.required[argIndex++].name + (Config.router.primaryKeyPattern === "\\d+" ? "Id" : "Uuid") + "}" : section;
                }).join('/');

                if(!paths[uri]) {
                    paths[uri] = {};
                }
                if(paths[uri][route.method.toLowerCase()]) {
                    uri += (route.arguments.optional.length? " [? " + route.arguments.optional.map(arg => arg.name).join("=, ") + "=]" : "");
                    paths[uri] = {};
                }

                path = paths[uri][route.method.toLowerCase()] = {
                    "tags": [
                        modelName || controllerName
                    ],
                    "deprecated": !!route.annotations.deprecated,
                    "consumes": ["application/json"],
                    "produces": ["application/json"],
                    "summary": route.annotations.summary? toCapitalCase(route.annotations.summary) :
                        ({"GET": "Get", "POST": "Create", "PUT": "Update", "DELETE": "Remove", "OPTIONS": "Ping"}[route.method] + ` ${modelName} ${collection? "collection" : "instance"}`),
                    "description": route.annotations.description,
                    "operationId": route.method + uri + route.arguments.optional.map(arg => toCapitalCase(arg.name)).join(""),
                    "parameters": [],
                    "responses": {}
                };
                route.arguments.required.forEach(arg => {
                    path["parameters"].push({
                        "name": arg.name + (Config.router.primaryKeyPattern === "\\d+" ? "Id" : "Uuid"),
                        "in": "path",
                        "required": true,
                        "type": Config.router.primaryKeyPattern === "\\d+" ? "integer" : "uid"
                    });
                });
                route.arguments.optional.forEach(arg => {
                    path["parameters"].push({
                        "name": arg.name,
                        "in": "query",
                        "required": false,
                        "type": "string"
                    });
                });

                if (modelName) {
                    if (route.method === "GET") {
                        path["responses"]["200"] = collection?
                            {
                                "description": `Collection of ${modelName} instances, empty array if not found`,
                                "schema": {
                                    "type": "array",
                                    "items": {
                                        "$ref": `#/definitions/${modelName}`
                                    }
                                }
                            }
                            :
                            {
                                "description": `Instance of ${modelName} model`,
                                "schema": {
                                    "$ref": `#/definitions/${modelName}`
                                }
                            };
                        if (!collection) {
                            path["responses"]["404"] = {
                                "description": `Instance of ${modelName} model was not found.`,
                            };
                        }
                    }

                    if (route.method === "POST") {
                        path["parameters"].push({
                            "name": "model",
                            "in": "body",
                            "description": `Instance of ${modelName} model`,
                            "required": true,
                            "schema": {
                                "$ref": `#/definitions/${modelName}`
                            }
                        });

                        path["responses"]["201"] = {
                            "description": `Created instance of ${modelName} model`,
                            "schema": {
                                "$ref": `#/definitions/${modelName}`
                            }
                        };
                    }

                    if (route.method === "PUT") {
                        path["parameters"].push({
                            "name": "model",
                            "in": "body",
                            "description": `Instance of ${modelName} model`,
                            "required": true,
                            "schema": {
                                "$ref": `#/definitions/${modelName}`
                            }
                        });

                        path["responses"]["200"] = {
                            "description": `Updated instance of ${modelName} model`,
                            "schema": {
                                "$ref": `#/definitions/${modelName}`
                            }
                        };
                    }

                    if (route.method === "DELETE") {
                        path["responses"]["204"] = {
                            "description": `Instance of ${modelName} model successfuly removed`,
                        };
                    }

                } else {
                    path["responses"]["200"] = {
                        "description": `Success`,
                    };
                }

                if (route.permission) {
                    path["responses"]["401"] = {
                        "description": `Authorization token is missing or invalid`,
                    };
                    path["responses"]["403"] = {
                        "description": `Request is authenticated but doesn't have required permissions`,
                    };

                    path["security"] = [
                        {"Permission": [route.permission] }
                    ];

                    this._permissionScopes[route.permission] = `Permission to ${route.permission.split(".")[1]} ${route.permission.split(".")[0]}`;

                    if(route.annotations.rootownerpermissions) {
                        path["security"].push(
                            {"Root permission": [route.annotations.rootownerpermissions] }
                        );
                        this._permissionRootScopes[route.annotations.rootownerpermissions] = `Root access to ${route.annotations.rootownerpermissions.split(".")[0]}`;
                    }

                }

                if(!path["parameters"].length){
                    delete paths[uri][route.method.toLowerCase()].parameters;
                }

                return paths;
            }, paths);
        });
        return paths;
    },

    _permissionScopes: {},
    _permissionRootScopes: {},

};

function toCapitalCase(str) {
    return str[0].toUpperCase() + str.slice(1);
}

module.exports = OpenApi;
