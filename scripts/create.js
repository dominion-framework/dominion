#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const argv = process.argv.splice(2);

switch (argv[0]) {
    case "create":
        createComponent(argv[1]);
        break;
    default:
        console.error(`There is no '${argv[0]}' command. Have you misspell?`);
}



function createComponent(componentName) {
    const componentPath = `components/${componentName}`;
    componentName = componentName.split("/").map(s => s[0].toUpperCase() + s.substring(1)).join("");

    if(fs.existsSync(componentPath)) {
        console.error(`Folder '${path.resolve(componentPath)}' already exists.`);
        return 1;
    }

    fs.mkdirSync(componentPath, { recursive: true });

    if(componentName === "Hello") {
        createIndex();
        createConfig();
        addStartScriptToPackageJson();
    }

    createComponentDeclaration(componentName, componentPath);
    createControllerDeclaration(componentName, componentPath);
    createFactoryDeclaration(componentName, componentPath);
    addComponentToProject(componentName, componentPath);

    console.log(`Component '${componentName}' created in ${path.resolve(componentPath)}.`);
}

function createIndex() {
    if(fs.existsSync(path.resolve("index.js"))) {
        return;
    }

    const projectIndex =
`const Server = require("@dominion-framework/dominion");

Server.addComponent(require("@dominion-framework/dominion/components/cors"));
Server.addComponent(require("@dominion-framework/dominion/components/logging"));

Server.addComponent(require("./components/hello"));

Server.start();

Server.openApiToFile();
`;
    fs.writeFileSync(path.resolve("index.js"), projectIndex, 'utf8');
}

function addStartScriptToPackageJson() {
    if(!fs.existsSync(path.resolve("package.json"))) {
        return;
    }
    const packageJson =JSON.parse(fs.readFileSync(path.resolve("package.json")).toString());
    if(!packageJson.scripts) {
        packageJson.scripts = {};
    }
    packageJson.scripts.start = "node index.js";
    fs.writeFileSync(path.resolve("package.json"), JSON.stringify(packageJson, null, 2), 'utf8');
}

function createConfig() {
    if(fs.existsSync(path.resolve("config"))) {
        return;
    }

    const indexConfig =
`const config = require("./config.dev");

module.exports = config; 
`;

    const projectConfig =
`module.exports = {
    server: {
        protocol: "http",
        host: "localhost",
        port: 7000,
        // No slash in the end
        url: "http://localhost:7000"
    },

    router: {
        // e.g. api/v2/
        urlPrefix: "",
        // e.g. "[a-f\\d]{8}-[a-f\\d]{4}-4[a-f\\d]{3}-[89ab][a-f\\d]{3}-[a-f\\d]{12}"
        primaryKeyPattern: "\\\\d+"
    },

    cors: {
        // e.g. * | ["example.com"] | () => {} (synchronous callback function with Message context returning array of allowed origins)
        origin: ["http://localhost:7000", "https://editor.swagger.io"],
        methods: ["OPTIONS", "GET", "POST", "PUT", "DELETE"],
        headers: ["Content-Type", "Set-Cookies", "Authorization"],
        credentials: false,
        maxAge: 5 /* seconds */
    }
};
`;
    fs.mkdirSync(path.resolve("config"));
    fs.writeFileSync(path.resolve("config/config.dev.js"), projectConfig, 'utf8');
    fs.writeFileSync(path.resolve("config/index.js"), indexConfig, 'utf8');

}

function createComponentDeclaration(componentName, componentPath) {
    const componentDeclaration =
`module.exports = {
    factories: [
        __dirname + '/factory',
    ],
    controllers: [
        __dirname + '/controller',
    ],
    requestInterceptors: [],
    responseInterceptors: [],
    bootstrap: []
};   
`;
    fs.writeFileSync(path.resolve(componentPath, "index.js"), componentDeclaration, 'utf8');
}

function createControllerDeclaration(componentName, componentPath) {
    const controllerDeclaration =
`const Factories = require("@dominion-framework/dominion/core/factories");

const ${componentName}Factory = Factories("${componentName}");


module.exports = {

    factory: ${componentName}Factory,

    GET: [
        //${componentName.toLowerCase()}?offset=0&limit=10
        function (offset = 0, limit = 10) {
            // @summary: ${componentName === "Hello"? "Demo endpoint with optional arguments" : ""}
            // @description: ${componentName === "Hello"? `Open http://localhost:7000/${componentName.toLowerCase()}?offset=0&limit=10 to see results` : ""}

            ${componentName === "Hello"? 
            "return \`Welcome to Dominion! Nice to meet you! [\${offset}, \${limit}]\`;"
            :
            "return ;"
            }
        }${componentName === "Hello" ?
            `,
            
        //${componentName.toLowerCase()}/42
        function (${componentName.toLowerCase()}Id) {
            // @summary: '@summary' and '@description' annotations will be used for generating OpenApi docs
            // @description: Open http://localhost:7000/${componentName.toLowerCase()}/42 to see results 
            
            return ${componentName}Factory.new({
                id: +${componentName.toLowerCase()}Id,
                email: "my.name@example.com"
            });
        }`
        :
        ""}
    ],

    POST: [
        //${componentName.toLowerCase()}
        function (model) {
            ${componentName === "Hello"? "// @path: custom\\/url\\/(\\d+)" : ""}
                        
            return ;
        }
    ],

    PUT: [
        //${componentName.toLowerCase()}
        function () {
            
            return ;
        }
    ],

    DELETE: [
        //${componentName.toLowerCase()}
        function () {
            
            return ;
        }
    ]
    
};    
`;
    fs.writeFileSync(path.resolve(componentPath, "controller.js"), controllerDeclaration, 'utf8');
}

function createControllerWithRepoDeclaration(componentName, componentPath) {
    const controllerDeclaration =
`const Errors = require("dominion/core/errors");
const Factories = require("dominion/core/factories");

const ${componentName}Factory = Factories("${componentName}");


module.exports = {

    path: ${componentName}Factory.__model__.name,
    
    factory: ${componentName}Factory,

    GET: [
        //${componentName.toLowerCase()}?offset=0&limit=10
        function (offset = 0, limit = 10) {
            // @summary:
            // @description:

            return ${componentName}Factory.find({}, offset, limit);
        }
        
        //${componentName.toLowerCase()}/42
        function (invitationsId) {
            // @summary:
            // @description:

            return ${componentName}Factory.find({}, offset, limit);
        }

    ],

    POST: [
        //${componentName.toLowerCase()}/
        function () {
            return ${componentName}Factory.new(this.request.body)
                .then(invitation => invitation.save())
                .then(invitation => InvitationsFactory.get({id: invitation.id}));
        }
    ],

    PUT: [
        //${componentName.toLowerCase()}/42
        function (invitationsId) {
            return ${componentName}Factory.get({id: invitationsId})
                .then(invitation => invitation.populate(this.request.body))
                .then(invitation => invitation.save());
        }
    ],

    DELETE: [
        //${componentName.toLowerCase()}/42
        function (invitationsId) {
            return ${componentName}Factory.get({id: invitationsId})
                .then((invitation) => {
                    return invitation.remove();
                })
                .then((result) => {
                    if (result.affectedRows) {
                        this.response.status = this.response.statuses._204_NoContent;
                    }
                });
        }
    ]

};    
`;
    fs.writeFileSync(path.resolve(componentPath, "controller.js"), controllerDeclaration, 'utf8');
}

function createFactoryDeclaration(componentName, componentPath) {
    const factoriesDeclaration =
`const Property = require("@dominion-framework/dominion/core/property");


module.exports = {

    name: "${componentName}",

    properties: {
        id: Property.id(),
        guid: Property.string().example("123e4567-e89b-12d3-a456-426655440000"),
        email: Property.string().required().example("my.name@example.com"),
        state: Property.enum(["open", "close"]),
        parentId: Property.model("${componentName}"),
        creationTime: Property.date().private(),
        modificationTime: Property.date().private()
    },

    factory: {
        
    },

    instance: { 
        
    }
};   
`;
    fs.writeFileSync(path.resolve(componentPath, "factory.js"), factoriesDeclaration, 'utf8');
}

function addComponentToProject(componentName, componentPath) {
    if(!fs.existsSync(path.resolve("index.js"))) {
        console.error("File `index.js` in project's root doesn't exist. Can't include created component.");
        return;
    }

    const indexFile = fs.readFileSync(path.resolve("index.js")).toString().split("\n");
    const position = indexFile.reverse().findIndex(line => line.indexOf("Server.addComponent") > -1);
    indexFile.splice(position, 0, `Server.addComponent(require("./${componentPath}"));`);
    fs.writeFileSync(path.resolve("index.js"), indexFile.reverse().join("\n"));
}
