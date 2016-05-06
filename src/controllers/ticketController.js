'use strict'

import logger from '../utils/logger'
import { ValidationError } from '../utils/errors'
import repo_impl from '../implementations/repo_impl'
import repo_factory from '../repo_factory'
import fm_token_factory from '../fm_token_factory'
import fm_token_impl from '../implementations/fm_token_impl'
import fm_policy_factory from '../fm_policy_factory'
import fm_selector_factory from '../fm_selector_factory'

const repo = repo_factory({ impl: repo_impl })
const fm_policy = fm_policy_factory({ repo: repo })
const fm_token = fm_token_factory({ impl: fm_token_impl })
const fm_selector = fm_selector_factory({ repo: repo, policy: fm_policy, token: fm_token })
const log = logger.child({module: 'ticketController'})

export default {
  init: (router) => {
    router.post('/tickets', (req, res) => {
      log.debug('new ticket requested')

      // TBD user and conn should be extracted from request and validated
      const client_ip = req.ip === '::1' ? '127.0.0.1' : req.ip
      const valid_user = req.body.user
      const valid_conn = { ip: client_ip }

      // TBD validation should be extracted out of fm_selector since it's the controller's job
      fm_selector.allocate(valid_user, valid_conn).then(
        (ticket) => {
          log.debug('new ticket created')
          console.log(ticket)
          res.json(ticket)
        },
        (err) => {
          //TBD might want to extract this into a middleware
          log.warn(err)
          let status = 500
          if (err instanceof ValidationError) status = 400
          res.status(status)
          res.json({status: { code: status, message: err.message }})
        })
    })
  }
}
