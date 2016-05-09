'use strict'

import _ from 'lodash'
import config from './config'
import logger from './utils/logger'
import { NoAvailableFrontMachineError } from './utils/errors'

const log = logger.child({module: 'fm_policy_factory'})

// possible configuration:
//   single user policy: maximum active session, ...
//   single server policy: maximum connection, ...
//   etc.
export default function(opts) {
  const defaults = config.policy
  const options = Object.assign({}, defaults, opts)
  const { repo } = options

  return {
    // get available front machines
    // check known servers' current load or latest cached load status
    // opts might contain other flags for user/conn,
    // for example certain user might be blocked
    // or some users are preferred to be allocated to the same front machine
    get_fm: function(user, conn, session) {
      log.debug('getting registered front machine list')
      return repo.get_registered_fms().then(
        (result) => {
          if (result) {
            //use the least loaded fm for new session
            //TBD notice this is a very naive implementation
            //there is a gap between token issue and ws connection, the db reflected load has a delay.
            //and we dont want to poll fm list and fm load for every connection
            //some kind of cache & load distribution needs to be balanced here
            //might want to distribute loads among more than 1 candidates
            //might want to take it easy when a fm loads reach certain level
            //might want to prioritize on newly joined fm, fm with much less load, etc.
            let sorted_fms = result
            log.debug('%s available front machines located', result.length)
            if (result.length > 1) {
              sorted_fms = _.orderBy(result, ['load'], ['asc'])
            }

            log.debug('the least loaded fm is %s with load %s', sorted_fms[0].id, sorted_fms[0].load)
            delete sorted_fms[0].load
            return sorted_fms[0];
          } else {
            throw new NoAvailableFrontMachineError()
          }
        },
        (err) => {
          log.error(err)
          let err_msg = 'error obtaining front machine'
          throw new Error(err_msg)
        })
    }
  }
}
