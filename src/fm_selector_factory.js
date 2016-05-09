'use strict'

import logger from './utils/logger'
import { ValidationError } from './utils/errors'

const log = logger.child({module: 'fm_seletor_factory'})

export default function(opts) {
  const { repo, policy, token } = opts

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

        let ok = repo.allocate_session(user)

        let session_id
        ok = ok.then((session) => {
          log.debug('session allocated')
          session_id = session.id
          return policy.get_fm(user, conn, session)
        })

        let fmRef
        ok = ok.then((fm) => {
          log.debug('front machine %s obtained', fm.id)
          fmRef = fm
          let payload = { fm: fm, user: user, conn: conn, session: { id: session_id } }
          return token.generate(payload)
        })

        ok = ok.then((token) => {
          log.debug('token generated')
          return { fm_ip: fmRef.ip, fm_port: fmRef.port, token: token }
        })

        ok.then(
          (ticket) => {
            log.debug('ticket generated')
            return resolve(ticket)
          },
          (err) => {
            log.error(err, 'error generating ticket')
            // TBD handle specific errors and throw selector oriented errors
            return reject(err)
          })
      })
    }
  }
}
