'use strict'

const nconf = require('nconf')
nconf
  .env()
  .argv()
  .file({ file: './example/config.json' })

const Promise = require('bluebird')
const rethink = require('rethinkdbdash')

const Query = require('../').Query

const queryHanler = function (params) {
  return new Promise((resolve, reject) => {
    const r = rethink({
      host: nconf.get('DATABASE_RETHINKDB_HOST'),
      port: nconf.get('DATABASE_RETHINKDB_PORT'),
      db: nconf.get('DATABASE_RETHINKDB_DB'),
      user: nconf.get('DATABASE_RETHINKDB_USER'),
      password: nconf.get('DATABASE_RETHINKDB_PASSWORD'),
      authKey: nconf.get('DATABASE_RETHINKDB_AUTH_KEY'),
      discovery: false,
      silent: true
    })

    r.table('individuals')
      .merge(function (item) {
        return {
          domainName: r.expr(item('email')).split('@').nth(1)
        }
      })
      .group('domainName')
      .count()
      .ungroup()
      .map(function (item) {
        return {
          domain: item('group'),
          count: item('reduction')
        }
      })
      .filter(r.row('count').gt(10))
      .orderBy(r.desc('count'))
      .then((result) => {
        resolve({
          total: result.length,
          data: result
        })
      })
      .catch(reject)
  })
}

let query = new Query('IndividualsGroupByEmailDomainExcludeLittleOnes', queryHanler)
query
  .execute()
  .then((result) => {
    console.log(result)
    process.exit(0)
  })
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
