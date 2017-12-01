# node-cqrs-framework

[![CircleCI](https://circleci.com/gh/gperreymond/node-cqrs-framework.svg?style=shield)](https://circleci.com/gh/gperreymond/node-cqrs-framework)
[![CodeFactor](https://www.codefactor.io/repository/github/gperreymond/node-cqrs-framework/badge)](https://www.codefactor.io/repository/github/gperreymond/node-cqrs-framework)
[![Coverage Status](https://coveralls.io/repos/github/gperreymond/node-cqrs-framework/badge.svg?branch=master)](https://coveralls.io/github/gperreymond/node-cqrs-framework?branch=master)

node-cqrs-framework is a node.js framework that helps you to implement microservices and scalability for cqrs architectures over rabbitmq service discovery.

## Advantages

* Think better! Think KISS!
* Configuration-driven oriented framework.
* Only one monolithic project in your github.
* Only one monolithic project to maintain.
* Start only the services you want with configuration file.
* Agnostics commands and queries, they just had to be promises.
* Tests are dissociate from the notion of CQRS.
* Deploy and scale your microservices like you want.
* Automatic services discovery! Thanks rabbitmq.

## Installation  

```
$ npm i -S node-cqrs-framework
```

## Description

Beware, you need a rabbitmq running in localhost for all those examples.

#### Server

The __server__ is the main program, he needs to be start at first. Because the project is configuration-driven, you only need those lines of code to start all selected microservices in a row.

```javascript
const path = require('path')

const Server = require('node-cqrs-framework').Server
const server = new Server()

server
  .use(path.resolve(__dirname, '../test/data/commands/*.js'))
  .use(path.resolve(__dirname, '../test/data/queries/*.js'))
  .start()

server.on('error', error => {
  console.log('server error')
  console.log(error)
})

server.on('ready', () => {
  console.log('server connected')
})
```

#### Service

A __service__ is the base element of the CQRS, it's like a microservice or a task. The application result of a __service__ will automaticaly:

- Send an event on the bus in case of success
- Send an event on the bus in case of error

You will never have to use this class, __Command__ and __Query__ extend it.

#### Command

* "A result" is either a successful application of the command, or an exception.
* Because it extends __Service__, success event or error event will be automaticaly send on the bus.

How to create a __Command__ ?

__Step 1__  
You need to create a file who contains __"Command"__ in his name.  
__path/you/want/BasicNopeCommand.js__

__Step 2__  
You need to __module.exports__ a promise.  

```javascript
const Promise = require('bluebird')

const handler = function () {
  return new Promise((resolve, reject) => {
    resolve()
  })
}

module.exports = handler
```

#### Query

From the framework point of view a __query__ is the same as a __command__, but because of __queries__ roles in the CQRS architecture, this time data will be return.

* "A result" is either data, or an exception
* Because it extends __Service__, success event or error event will be automaticaly send on the bus

How to create a __Query__ ?

__Step 1__  
You need to create a file who contains __"Query"__ in his name.  
__path/you/want/BasicNopeQuery.js__

__Step 2__  
You need to __module.exports__ a promise.  

```javascript
const Promise = require('bluebird')

const handler = function () {
  return new Promise((resolve, reject) => {
    resolve({data: true})
  })
}

module.exports = handler
```
#### Now it's time to start the server

Classic start:

```
$ node server.js
```

But, you can run the server in debug mode.

```
$ DEBUG=cqrs:* node server.js
```

#### Client

It's time to learn how to link all those services and events together, let's me introduce the __Client__ object.

###### Definitions

A client could be wherever you need it to be, even on another server, or behind a hapiJS/Express server, or why not in another __CQRS Server__.  
You will have three patterns to use the __server__ events bus.

###### Sender/Receiver pattern

The Send / Receive object pair uses a direct exchange inside of RabbitMQ

###### Publisher/Subscriber pattern

The Publish / Subscribe object pair uses a fanout exchange inside of RabbitMQ, allowing you to have as many subscribers as you need. Think of pub/sub as an event that gets broadcast to anyone that cares, or no one at all if no one is listening.

###### Request/Response pattern

The request/response pair uses a "topic" exchange.
With a request/response setup, you can send a request for information and respond to it.

#### Examples

###### Sender/Receiver

* When the __server__ start and load your handlers, receivers are created in the __server__.
* Sender client is a classic fire and forget on the bus. In return you will have only a result who informs you if the __command__ or the __query__ has been executed succesfully or not.  
* With this pattern you can't know the real result of the service.  
* You can use this pattern if you want to run a batch, or an emails service runner, etc.

Create a file __client-sender.js__, and and this code in:

```javascript
const Client = require('node-cqrs-framework').Client
const client = new Client()
client
  .subscribe('BasicNopeQuery.*', (result) => {
    // the pattern 'BasicNopeQuery.*' will receive Error and Success event
    // you can have a client who listen only to all errors like that : '*.Error'
    console.log(result)
  })
  .start()

client.on('error', error => {
  console.log('client error')
  console.log(error)
})

client.on('ready', () => {
  console.log('client connected')
  client.send('BasicNopeQuery', {message: 'This is a query'})
})
```

Time to run:

```
$ node client-sender.js
```

And here the result:

```javascript
{ type: 'Query',
  name: 'BasicNopeQuery',
  event: 'BasicNopeQuery.Success',
  params: { message: 'This is a query' },
  exectime: 1004,
  result: { data: true } }
```
