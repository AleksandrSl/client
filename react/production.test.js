import ReactTesting from '@testing-library/react'
import React from 'react'

import '../test/set-production.js'
import { useSync, ClientContext, ChannelErrors } from './index.js'
import { syncMapTemplate, TestClient } from '../index.js'

let { render, screen } = ReactTesting
let h = React.createElement

let Store = syncMapTemplate('test')

let IdTest = () => {
  let value = useSync(Store, 'ID')
  return h('div', {}, value.isLoading ? 'loading' : value.id)
}

function getText(component) {
  let client = new TestClient('10')
  render(
    h(
      ClientContext.Provider,
      { value: client },
      h('div', { 'data-testid': 'test' }, component)
    )
  )
  return screen.getByTestId('test').textContent
}

it('does not have ChannelErrors check in production mode', async () => {
  expect(getText(h(ChannelErrors, {}, h(IdTest)))).toBe('loading')
})
