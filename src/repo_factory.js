'use strict'

import logger from './utils/logger'
import { RepositoryError } from './utils/errors'

const log = logger.child({module: 'repo_factory'})

export default function(opts) {
  const { impl } = opts

  function handleStorageError(err, err_msg) {
    log.error(err)
    throw new RepositoryError(err_msg)
  }

  return {
    allocate_session: function(user) {
      let err_msg = 'error allocating session record'

      return impl.alloc_session(user).then(
        (session) => {
          return session
        },
        (err) => {
          handleStorageError(err, err_msg)
        })
    },
    get_registered_fms: function() {
      let err_msg = 'error getting registered front machine records'

      return impl.get_fm_registrations().then(
        (result) => {
          if (!result || result.length <= 0) {
            log.debug('registered front machine records not found')
            return
          } else {
            log.debug('registered front machine records found')
            return result
          }
        },
        (err) => {
          handleStorageError(err, err_msg)
        })
    }
  }
}
