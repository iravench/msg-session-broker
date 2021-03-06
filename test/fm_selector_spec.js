'use strict'

import sinon from 'sinon'
import { expect } from 'chai'

import fm_selector_factory from '../src/fm_selector_factory'
import fixture from './fixture/fm_selector.js'

describe('fm_selector', () => {
  describe('#allocate validation', () => {
    const fm_selector = fm_selector_factory({repo: {}, policy: {}, token: {}})

    it('response to allocate', () => {
      expect(fm_selector).to.respondTo('allocate')
    })

    it('invalidate empty user', () => {
      return fm_selector
        .allocate(null, null)
        .catch(err => { expect(err.message).to.have.string('bad user') })
    })

    it('invalidate user without user_id', () => {
      let invalid_user = { device_id: 'device_id' }
      return fm_selector
        .allocate(invalid_user, null)
        .catch(err => { expect(err.message).to.have.string('bad user id') })
    })

    it('invalidate user without device_id', () => {
      let invalid_user = { user_id: 'user_id' }
      return fm_selector
        .allocate(invalid_user, null)
        .catch(err => { expect(err.message).to.have.string('bad device id') })
    })

    it('invalidate empty connection', () => {
      return fm_selector
        .allocate(fixture.valid_user, null)
        .catch(err => { expect(err.message).to.have.string('bad connection') })
    })

    it('invalidate connection without ip', () => {
      let invalid_conn = {}
      return fm_selector
        .allocate(fixture.valid_user, invalid_conn)
        .catch(err => { expect(err.message).to.have.string('bad connection ip') })
    })
  })

  describe('#allocate ticket', () => {
    const noop = () => {}
    const good_repo = { allocate_session: noop }
    sinon.stub(good_repo, 'allocate_session').returns(Promise.resolve({ session: { session_id: 1 } }))

    const bad_repo = { allocate_session: noop }
    sinon.stub(bad_repo, 'allocate_session').returns(Promise.reject(new Error('repository failure')))

    const good_policy = { get_fm: noop }
    sinon.stub(good_policy, 'get_fm').returns(Promise.resolve(fixture.result_fm))

    const bad_policy = { get_fm: noop }
    sinon.stub(bad_policy, 'get_fm').returns(Promise.reject(new Error('no front machine available')))

    const token = { generate: noop }
    sinon.stub(token, 'generate').returns(Promise.resolve(fixture.result_token))

    it('error out in case of repository failure', () => {
      const fm_selector = fm_selector_factory({ repo: bad_repo, policy: good_policy, token: token })

      return fm_selector
        .allocate(fixture.valid_user, fixture.valid_conn)
        .catch(err => { expect(err.message).to.have.string('repository failure') })
    })

    it('error out in case of policy failure', () => {
      const fm_selector = fm_selector_factory({ repo: good_repo, policy: bad_policy, token: token })

      return fm_selector
        .allocate(fixture.valid_user, fixture.valid_conn)
        .catch(err => { expect(err.message).to.have.string('no front machine available') })
    })

    it('able to obtain ticket', () => {
      const fm_selector = fm_selector_factory({ repo: good_repo, policy: good_policy, token: token })

      return fm_selector
        .allocate(fixture.valid_user, fixture.valid_conn)
        .then(result => {
          expect(result).to.exist
          expect(result.fm_ip).to.equal(fixture.result_fm.ip)
          expect(result.fm_port).to.equal(fixture.result_fm.port)
          expect(result.token).to.equal(fixture.result_token)
        })
    })
  })
})
