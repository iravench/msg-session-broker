'use strict'

import logger from './utils/logger'
import { ValidationError, ActiveSessionFoundError } from './utils/errors'

const log = logger.child({module: 'fm_seletor_factory'})

export default function(opts) {
  const { repo, policy, token } = opts

  function handleError(err, newErr) {
    if (err) {
      log.error(err)
    }
    if (newErr && typeof newErr === 'string') {
      throw new Error(newErr)
    }
    else if (newErr && typeof newErr === 'error') {
      throw newErr
    }
  }

  function get_ticket(user, conn, session) {
    let err_msg = 'error generating token'

    return policy.get_fm(user, conn, session).then(
      (fm) => {
        log.debug('front machine %s obtained', fm.id)
        let payload = { fm: fm, user: user, conn: conn, session: { id: session.id } }

        return token.generate(payload).then(
          (token) => {
            log.debug('token generated')
            return { fm_ip: fm.ip, fm_port: fm.port, token: token }
          })
      },
      (err) => {
        handleError(err, err_msg)
      })
  }

  function handleValidation(user, conn) {
    if (!user) throw new ValidationError('bad user')
    if (!user.user_id) throw new ValidationError('bad user id')
    if (!user.device_id) throw new ValidationError('bad device id')

    if (!conn) throw new ValidationError('bad connection')
    if (!conn.ip) throw new ValidationError('bad connection ip')
  }

  return {
    allocate: function(user, conn) {
      return new Promise((resolve, reject) => {

        handleValidation(user, conn)

        return repo.allocate_session(user).then(
          (session) => {
            log.debug('generating new token for session')
            return get_ticket(user, conn, session)
          },
          (err) => {
            handleError(err, 'fail on accessing session state')
          }).then(
            (ticket) => {
              log.debug('session allocated')
              return resolve(ticket)
            },
            (err) => {
              log.debug('error allocating session')
              return reject(err)
            })
      })
    }
  }
}
