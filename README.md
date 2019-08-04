# Dominion
Declarative Promise based Node.js framework for REST API

## Installation
```
npm i https://github.com/yura-chaikovsky/dominion.git
```

## Usage

### Components
You can take "components" as 1:1 representation of restfull (or business) domains. 
It's useful to organize components having each in separate folder. 
Lets take `Users` model for example. Recommended file organization will be: 
```
| - components/
| | - users/             <-- `Users` component 
| | | - index.js
| | | - controller.js
| | | - factory.js
| | | - repository.js
| | - products/
| - index.js
| - package.json
| - package-lock.json
```

#### Component declaration file

Component dependencies are declared in `index.js` file:
```js
module.exports = {
    factories: [
        __dirname + '/factory',      // <-- reference to factory.js
    ],
    controllers: [
        __dirname + '/controller',   // <-- reference to controller.js
    ],
    requestInterceptors: [],         // <-- list of references to request interceptors
    responseInterceptors: []         // <-- list of references to response interceptors
};
```
This declarations is used only for requiring components on the fly independent from 
order of requires in file.

There are 3 default entities:
1. Controllers
2. Factories
3. Repositories

`Controller` is a place where you define API's endpoints, basically mappings 
between URL's and actions you need to produce response.

`Factories` is where you describe model structure and its methods. Optionally factories 
may be linked to a repository.

`Repository` is playing role of ORM (Object-relational mapping) with external data storage. 
By default framework uses MySQL, but should work with any DB that has compatible SQL dialect. 
Alternative, repository prototype may be redefined to work with any type of 
storage (NoSQL, cloud storage, flat file, etc).

Commonly you'll need one set of controller/factory/repository in a component, 
but it's possible to have multiple ones if needed.

### API Request Lifecycle 
To understand how requests are processed lets look on their lifecycle, it's straight forward:
1. On startup framework goes through all registered controllers (`core/controllers/index.js`), generates URL based 
on functions interface and make mappings between URL's and those functions.

2. Client makes request to API server.

3. Framework's router (`core/router/index.js`) catches the request and looking 
for matching callback from ones registered in controllers.

4. If match was founded router builds request Promise chain. A chain contains 
*request interceptors*,  *handler* (function defined in controller), *response interceptors*
and *request finalisation*. Then request promise chain gets executed:
   1. Requests interceptors are taking from `requestInterceptors` array in component's 
   declaration file (`index.js`). They are general purpose functions that may validate
   client's authorization. 
   2. Then `handler` gets executed. It defines top level business logic. 
   Usually controller's `handler` manipulates models created by `Factories`.
   If needed, factories or model instances call linked `Repository` 
   to create/modify/remove data in DB.
   3. Result of `handler` execution is passed to response interceptors. They are taking 
   from `responseInterceptors` array in component's declaration file. There are no common use
   for response interceptor, as `handler` is responsible to produce response that is
   ready to be send back to client. However, it may be used to perform some general actions 
   that depends on `handler`'s response, like set custom header.
   4. Lastly, router handles common exceptions produced by `Repositoy` or `Factories` and sets 
   proper status code (400 - for bad request, 404 - if model not found, 409 - for conflicts, etc). 

5. And finally, response produced by all previous steps gets stringified and returned to a client.  

### Controller
File containing controller should export object with a list of request `handler` functions and some
meta data. This object may have properties:

`path` - domain part of an URL. Note, domain part is the last section of URL, 
         for example if controller returns models from `Users` domain, 
         urls can be `https://example.com/users`, `https://example.com/departments/42/users`.
         
`permissions` - array of permissions that are required by all `handler`'s in the controller.

`GET` `POST` `PUT` `DELETE` `OPTIONS` `WS` - arrays containing `handler` functions for requests
        with specific http verbs or web sockets.          

```js
const Factories                 = use("core/factories");

const UsersFactory              = Factories("Users");

module.exports = {

    path: UsersFactory.__model__.name, // "users"

    permissions: {
        POST:   "Users.Create",
        PUT:    "Users.Update",
        DELETE: "Users.Delete"
    },

    GET: [
        // users/?limit=6&offset=12
        function (limit = 6, offset = 12) {
            // @summary: Get all user with pagination
            return UsersFactory.find();
        },

        // users/42
        function (usersId) {
            // @permission: Users.Read
            // @summary: Get user instance by id
            return UsersFactory.get({id: usersId});
        }
    ],

    POST: [
        // users/
        function () {
            // @summary: Create new user
            return UsersFactory.new(this.request.body)
                .then(user => user.save())
                .then(user => user.sendInvitationEmail())
                .then(user => UsersFactory.get({id: user.id}));
        }
    ],

    PUT: [
        // users/42
        function (usersId) {
            // @summary: Update new user profile
            return UsersFactory.get({id: usersId})
                .then(user => user.populate(this.request.body))
                .then(user => user.save());
        }
    ],

    DELETE: [
        // users/1
        function (usersId) {
            // @summary: Remove user by id
            return UsersFactory.get({id: usersId})
                .then(user => user.remove())
                .then(result => {
                    if (result.affectedRows) {
                        this.response.status = this.response.statuses._204_NoContent;
                    }
                });
        }
    ]
};
```

#### URL generation
URL for API's endpoints is generated automatically from `handler` function interface (arguments list) 
based on following rules:
1. Property `path:` from controller declaration is always the last section of URL.
```js
{
    path: "books",
    ...
    GET: [
        function () { }

        // produces URL: 
        // https://example.com/books    
    ]

}
```
2. Function's required arguments are used for path part of URL. If argument name equals to 
declaration's `path:` property it is used as model identified in URL:
```js
{
    path: "books"
    ...
    GET: [
        function (booksId) { }

        // produces URL: 
        // https://example.com/books/42    
    ]

}
```
3. If argument name is not equal to declaration's `path:` property it is used as model's
 parent identified in URL. Identifiers from URL will be passed to function 
 when it will be called. In following example, during execution `shelvesId` == 42 and `booksId` == 21:
```js
{
    path: "books"
    ...
    GET: [
        function (shelvesId, booksId) { }

        // produces URL: 
        // https://example.com/shelves/42/books/21    
    ]

}
```
4. Function's optional arguments are treated as query parameters (section of URL after "?").
```js
{
    path: "books"
    ...
    GET: [
        function (limit = 6, offset = 0) { }

        // produces URL: 
        // https://example.com/books?limit=12&offset=0    
    ]

}
```
5. If names of required arguments has 'Id' suffix (e.g. `booksId`) it will be ignored in URL.     

Note, all values extracted from URL are strings, consequently arguments in 
`handler` functions also are always `String` type.


#### API Handlers
`Handler` function is executing with HTTP message context (`core/messages/index.js`). 
In other word, `this` point to object containing information about HTTP request and response.
```js
function(booksId) {
    console.log(this.request.body);
    
    this.response.headers["X-Items-Length"] = 42;
}
```
#### Annotations
Annotation comments are declared inside `handler` functions. They can be used to add
some meta information to an endpoint.

For example, `@path:` annotation can be used to change auto-generated URL of an endpoint:
```js
function() {
    // @path: /auth/token
    
    return UsersFactory.get({email: this.request.body.email})
        .then(user => user.validatePassword(this.request.body.password))
        .then(user => user.createAuthToken())
}
```


### Models
Files containing models declaration should export object with model's properties and 
prototypes for models factories and models instances.

Models declaration object has following properties:

`name` - model's name. Good practice is to keep model's name always in plural to avoid ambiguity.

`repository` - optional, link to model's `Repository`.

`properties` - object containing model's properties. Object keys will be properties' names, values - properties validators.

`factory` - object containing functions that will be used as model's factory prototype. 

`instance` - object containing functions that will be used as model's instance prototype.

```js
const Property                  = use("core/property");
const Errors                    = use("core/errors");

const UsersRepository           = require("./repository");


module.exports = {

    name: "Users",

    repository: UsersRepository, 

    properties: {
        id: Property.id(),
        phoneNumber: Property.number().min(100000000000).max(999999999999),
        email: Property.string().pattern(/\S+@\S\(.\S)+/).max(100),
        passwordHash: Property.string().max(255).private(),
        passwordSalt: Property.string().max(255).private(),
        creationTime: Property.date().private(),
        modificationTime: Property.date().private()
    },

    factory: {

        getActiveUsers(limit = 6, offset = 0) {
            return this.repo.getActiveUsers(limit, offset)
                .then(users => Promise.all(users.map(mix => this.new(mix, false))));
        }

    },

    instance: {

        checkPassword(password) {
            if (this.passwordHash === createHash(password, this.passwordSalt)) {
                return this;
            } else {
                throw new Errors.Unauthorized("Incorrect credentials");
            }
        },

        setPassword(password) {
            let [passwordHash, passwordSalt] = hash(password);
            this.populate({passwordHash, passwordSalt});
            return this;
        }
    }
};
``` 
#### Factory Prototype
Default factory prototype (`core/factories/modelFactoryPrototype.js`) has methods:
 
 `.new( [modelData] )` 
 
 Creates new instance of model. Object with initial model's data can be passed as argument.   
 
 
 `.get( [criteriasObject] )` 
 
 Fetches one record from DB using `criteriasObject` and returns model's instance 
 containing it. This method requires `repository:` to be defined in model declaration.
 
 For example:
```js
UsersFactory.get({id: 42})
```    
    
 
 `.find([criteriasObject], [limit], [offset], [order])` 
 
 Fetch collection with `limit` records using `criteriasObject`  starting from `offset` 
 in `order`, where order is a string equals to one of model's properties name and 
 prefixed by "+" or "-" for ascend or descend sorting. Returns array with model's instance.
 This method requires `repository:` to be defined in model declaration.
 
 For example: 
```js
UsersFactory.find({name: "Alice", status: "active"}, 10, 20, "+last_name")
```


#### Instance Prototype
Default instance prototype (`core/factories/modelPrototype.js`) has methods:

`.populate( {modelsData} )`

Populates model's properties from object provided in `modelsData`. Before assigning
provided values are validated to match `Property` rules from models declaration.
For example:
```js
//model's property declaration:
properties: {
    id: Property.id(),
    isbn: Property.string().pattern(/^ISBN \d-\d{3}-\d{5}-\d$/)
}

...

//models instance:

book.populate( {isbn: "2000"} ); 
// throws error, because "2000" doesn't match regexp /^ISBN \d-\d{3}-\d{5}-\d$/

// the same applies during direct assignment
book.isbn = "2000"
```  

`.validate()`

Validates all model's properties to match `Property` rules from model's properties declaration.


`.toJSON()`

Stringifies model before sending it back to client. It applies `Property` rules and output
modifications from model's properties declaration. Can be reloaded if you need to modify 
string representation of model, but recommended way is to extend `Property` 
output modifications.

For example:
```js
//model's property declaration:
properties: {
    id: Property.id(),
    isbn: Property.string().pattern(/^ISBN \d-\d{3}-\d{5}-\d$/),
    creationTime: Property.date().private(),
    modificationTime: Property.date().private()
}

...

//models instance:

book.toJSON(); 
// returns
// {
//    "id": 42,
//    "isbn": "ISBN 4-393-29939-3"
// }
// Note, properties creationTime and modificationTime are missing
// because they marked as private: Property.date().private()

// The same applies to JSON.stringify() for obvious reasons 
// (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#toJSON()_behavior)
JSON.stringify(book);
```  

`.save()`

Saves model instance in DB. Properties validation will be performed before saving.
Returns Promise that will be resolved with model instance, or rejected with 
validation or DB error. This method requires `repository:` to be defined in model declaration.

For example:
```js
 return book.save();
```

`.remove()`

Removes model instance from DB. Returns Promise that will be resolved with DB response, 
or rejected with DB error. This method requires `repository:` to be defined in model declaration.

For example:
```js
 return book.remove()
    .then(result => {
        if (result.affectedRows === 1) {
            this.response.status = this.response.statuses._204_NoContent;
        }
    });
```

### Repositories
Files containing repository declaration should export instance 
of Repository (`core/repositories/repositoryPrototype.js`) 
representing external storage (e.g. database) related to specific model.

Repository can be created using default `Repositories.create()` method 
or by custom implementation of repository interface.

Default repository can be extended with methods that makes
direct calls to external storage, e.g. `findByTitle()`.   
```js
const Repositories              = use('core/repositories');

module.exports = Repositories.create('books_table', {

    findByTitle(title, offset, limit){
        const query = `SELECT * FROM ${this.__table__} 
                       WHERE title LIKE ?
                       LIMIT ?, ?`;
        return this.db.execute(query, [`%${title}%`, offset, limit])
            .then(([rows, columns]) => rows);
    }

}); 
```
Custom methods in `Repositories` should return raw data. 
Any data post-processing should be performed in models or factories.

Default `Repositories` prototype has methods:

`.find( [criteriasObject], [limit], [offset], [order])`

Executes SELECT query in DB. Used by `.get()` and `.find()` methods
in default models factories prototype.


`.save( [modelInstance] )`
Executes INSERT or UPDATE query in DB. Used by `.save()` method
in default models instance prototype.

`.remove( [modelInstance] )`
Executes DELETE query in DB. Used by `.remove()` method
in default models instance prototype.
   
There are very few good reasons you would need to overload this methods 
or call them directly. So, take it as an interface you need to 
implement in case of writing custom `Repository`. 



### Interceptors
**Interceptors are global!** This means that no matter in what 
component they are declared, they will be executed for *every* request.
I know it feels counter-intuitive and smells like a bad design, but it's not. 
Or, at least I think it is not.

The point here you should never need to decorate API endpoint on component level
or on single `handler` level. Such functionality should be moved to factories, models 
or services.

Interceptors should be used for actual global things like extracting 
cookies from header, parsing multipart/form-data, logging, converting response
from JSON to XML, etc.

 

   
