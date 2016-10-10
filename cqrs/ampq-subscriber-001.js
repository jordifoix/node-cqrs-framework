'use strict'

const nconf = require('nconf')
nconf
  .env()
  .argv()
  .file({ file: './cqrs/config.json' })

const bus = require('servicebus').bus(nconf.get('CQRS_RABBITMQ_URL'))

bus.subscribe('CREATE_INDIVIDUAL_COMMAND_EVENT_SUCCESS', (event) => {
  console.log(event)
})

bus.subscribe('FIND_INDIVIDUALS_QUERY_EVENT_SUCCESS', (event) => {
  console.log(event)
})