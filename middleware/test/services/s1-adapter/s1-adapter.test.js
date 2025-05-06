// For more information about this file see https://dove.feathersjs.com/guides/cli/service.test.html
import assert from 'assert'
import { app } from '../../../src/app.js'

describe('/s1-adapter service', () => {
  it('registered the service', () => {
    const service = app.service('/s1-adapter')

    assert.ok(service, 'Registered the service')
  })
})
