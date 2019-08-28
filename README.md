# Dominion Node.js framework for RESTfull APIs
[![Gitter](https://badges.gitter.im/dominion-framework/community.svg)](https://gitter.im/dominion-framework/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![install size](https://packagephobia.now.sh/badge?p=@dominion-framework/dominion)](https://packagephobia.now.sh/result?p=@dominion-framework/dominion)

Declarative Promise based Node.js framework for RESTful API

## Installation
```
npm i @dominion-framework/dominion
```

## Quick start
```
npx dominion create hello
npm start
```
This will run Node.js server with demo API's. 
Open http://localhost:7042/hello to check results and examine 
generated files in folder `components/hello` to see how it works. 

# Documentation

Read full documentation on __[dominion.js.org](https://dominion.js.org/)__.

# Features highlight

### Clear Endpoints Declaration

```js
module.exports = {

    factory: BooksFactory,

    GET: [
        // books?genre=western
        function (genre = null) {
            return BooksFactory.find({genre});
        }
    ],

    POST: [
        // books/
        function () {
            return BooksFactory.new(this.request.body)
                .then(book => book.save());
        }
    ]
}
```


### Automatic RESTful URLs
```js
// Endpoint URLs is build based on function arguments:

function (limit = 10, offset = 0) { }
// https://api.example.com/books?limit=42&offset=21


function (libraryShelvesId, favoriteBooksId, orderBy = "") { }
// https://api.example.com/library-shelves/42/favorite-books/84?orderBy=+author

```

### Models Schema Validation
```js
{
    name: "Book",
    
    properties: {
        id: Property.id(),
        name: Property.string().min(1).required(),
        isbn: Property.string().pattern(/^\d-\d{3}-\d{5}-\d$/).example("0-330-25864-8"),
        authorId: Property.model("Author"),
        genre: Property.set(["Fantasy", "Science fiction", "Western", "Romance"]),
        creationTime: Property.date().private(),
        modificationTime: Property.date().private()
    }
    ...
}
```

### Annotations
```js
function(isbn) {
    // @path: books/isbn/(\d{1,5}[- ]\d{1,7}[- ]\d{1,6}[- ](?:\d|X))
    // @model: Books    
    // @summary: Get book by ISBN number
    
    return BooksFactory.get({isbn})
}
```

### OpenAPI (Swagger) documentation

Automatic OpenAPI documentation based on source code.


### Zero Dependencies

100Kb footprint Node.js framework with __no__ npm dependencies. If you also think that
you don't need npm to [left-pad](https://www.theregister.co.uk/2016/03/23/npm_left_pad_chaos/) a string. 
