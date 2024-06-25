import { createStore, applyMiddleware } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import thunkMiddleware from 'redux-thunk'
import { reducer, initialState } from './contacts'

export function initializeStore(state = initialState) {
  return createStore(reducer, state, composeWithDevTools(applyMiddleware(thunkMiddleware)))
}
