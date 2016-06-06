'use strict'

import jwt from 'jsonwebtoken'
import logger from '../utils/logger'

const log = logger.child({module: 'fm_token_impl'})

export default {
  sign: function(payload, secret, options) {
    return new Promise((resolve, reject) => {
      return jwt.sign(payload, secret, options, (err, token) => {
        if (err) {
          log.error(err, 'unable to sign jwt token')
          reject(err)
        }

        log.debug('jwt token generated')
        return resolve(token)
      })
    })
  }
}
