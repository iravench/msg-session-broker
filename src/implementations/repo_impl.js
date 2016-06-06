'use strict'

import config from '../config'
import mysql from 'mysql'
import Redis from 'ioredis'
import logger from '../utils/logger'
import { StorageError } from '../utils/errors'

const log = logger.child({module: 'repo_impl'})
//TBD should probably inject a pool instance so that we can do unit testing...
const pool = mysql.createPool(config.storage.mysql)
const redisOptions = {
  family: config.storage.redis.family,
  password: config.storage.redis.password,
  db: config.storage.redis.db
}
const redis = new Redis(config.storage.redis.port, config.storage.redis.host, redisOptions)

// TBD prepare redis keys, set in config
const rkeyNamespace = 'mkm:fm_register:'
const rkeyFmPrefix = rkeyNamespace + 'fm:'
const rkeyFms = rkeyNamespace + 'fms'

const allocSessionQuery = 'call allocSession(?, ?, ?)'

function handleStorageError(reject, err, err_msg) {
  log.error(err)
  return reject(new StorageError(err_msg))
}

function mysqlPromise(handler) {
  let err_msg = 'error connecting to storage'

  return new Promise((resolve, reject) => {
    log.debug('getting pooled mysql connection')
    pool.getConnection((err, connection) => {
      if (err) return handleStorageError(reject, err, err_msg)

      log.debug('mysql connection established')
      handler(connection, resolve, reject)
    })
  })
}

function getFmPromise(fm_id) {
  let err_msg = 'error querying fm detail data'

  return new Promise((resolve, reject) => {
    redis.hgetall(rkeyFmPrefix + fm_id, (err, fm) => {
      if (err) return handleStorageError(reject, err, err_msg)
      return resolve(fm)
    })
  })
}

function getAllFmPromise(fm_ids) {
  let err_msg = 'error querying all fm detail data'

  return new Promise((resolve, reject) => {
    let fmPromises = []
    fm_ids.forEach((fm_id) => {
      fmPromises.push(getFmPromise(fm_id))
    })
    return Promise.all(fmPromises).then(
      (fms) => {
        return resolve(fms)
      },
      (err) => {
        return handleStorageError(reject, err, err_msg)
      })
  })
}

function getFmCountPromise(fm_id) {
  let err_msg = 'error querying fm connection count data'

  return new Promise((resolve, reject) => {
    redis.get(rkeyNamespace + fm_id + ':count', (err, count) => {
      if (err) return handleStorageError(reject, err, err_msg)
      return resolve({ id: fm_id, load: count })
    })
  })
}

function getAllFmCountPromise(fm_ids) {
  let err_msg = 'error querying all fm connection count data'

  return new Promise((resolve, reject) => {
    let fmCountPromises = []
    fm_ids.forEach((fm_id) => {
      fmCountPromises.push(getFmCountPromise(fm_id))
    })
    return Promise.all(fmCountPromises).then(
      (fmCounts) => {
        return resolve(fmCounts)
      },
      (err) => {
        return handleStorageError(reject, err, err_msg)
      })
  })
}

export default {
  alloc_session: function(user) {
    let err_msg = 'error updating storage for allocating session data'

    return mysqlPromise((connection, resolve, reject) => {
      connection.query(allocSessionQuery, [user.user_id, user.device_id, ''], (err, result) => {
        if (err) return handleStorageError(reject, err, err_msg)

        const session_id = result[0][0].o_id
        log.debug('allocated session data of id %s', session_id)
        resolve({ id: session_id })

        connection.release()
      })
    })
  },
  get_fm_registrations: function() {
    let err_msg = 'error querying storage for front machine registration data'

    return new Promise((resolve, reject) => {
      redis.smembers(rkeyFms, (err, fm_ids) => {
        if (err) return handleStorageError(reject, err, err_msg)

        if (fm_ids && fm_ids.length >= 0) {
          return Promise.all([
            getAllFmPromise(fm_ids),
            getAllFmCountPromise(fm_ids)]).then(
              (combo) => {
                log.debug('front machine registration data retrieved')
                // TBD please fix me...
                for (let i=0; i<combo[0].length; i++) {
                  combo[0][i].load = combo[1][i].load || 0
                }
                return resolve(combo[0])
              },
              (err) => {
                if (err) return handleStorageError(reject, err, err_msg)
              })
        }
        else {
          log.debug('front machine registration data not found')
          resolve(null)
        }
      })
    })
  }
}
