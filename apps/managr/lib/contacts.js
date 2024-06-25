import Router from 'next/router'
import chunk from 'lodash.chunk'

import buildAction from './actions'
import {
  fetchContacts,
  fetchContact,
  sendMails as apiSendMails,
  updateContact as ApiUpdateContact,
  deleteContact as ApiDeleteContact,
  createContact as ApiCreateContact,
} from './api'

// const getStorage = () =>
//   typeof Storage !== 'undefined'
//     ? localStorage
//     : {
//         getItem: () => null,
//         setItem: () => null,
//         removeItem: () => null,
// }

export const initialState = {
  contacts: [],
  emailsSent: 0,
  current: {},
  currentId: null,
  query: null,
  count: 0,
}

// const wait = (duration = 0) => new Promise(resolve => setTimeout(resolve, duration))

const _loadContacts = buildAction('LOAD_CONTACTS')
const _viewContact = buildAction('VIEW_CONTACT')
const _updateContact = buildAction('UPDATE_CONTACT')
const _deleteContact = buildAction('DELETE_CONTACT')
const _createContact = buildAction('CREATE_CONTACT')
const _sendMails = buildAction('SEND_MAILS')

export const sendMails = params => async (dispatch, getState) => {
  dispatch(_sendMails.request(params))
  const result = await apiSendMails(params)
  dispatch(_sendMails.succeed(result))
}

export const loadContacts = (params = {}) => async (dispatch, getState) => {
  dispatch(_loadContacts.request(params))
  const { lazyLoad } = getState()
  const { contacts, count, emailsSent } = await fetchContacts(params, { lazyLoad })
  dispatch(_loadContacts.succeed({ contacts, count, emailsSent }))
}

export const viewContact = params => async dispatch => {
  dispatch(_viewContact.request())
  const contact = await fetchContact(params)
  dispatch(_viewContact.succeed(contact))
}

export const updateContact = contact => async dispatch => {
  if (!contact._id) return createContact(contact)(dispatch)
  dispatch(_updateContact.request())
  const updated = await ApiUpdateContact(contact)
  dispatch(_updateContact.succeed(updated))
}
export const deleteContact = contactId => async dispatch => {
  dispatch(_deleteContact.request())
  await ApiDeleteContact(contactId)
  dispatch(_deleteContact.succeed(contactId))
  Router.push('/')
}

export const createContact = contact => async dispatch => {
  dispatch(_updateContact.request())
  const result = await ApiCreateContact(contact)
  dispatch(_updateContact.succeed(result))
  Router.push(`/contact?contactId=${result._id}`)
}

export const setCurrent = pos => dispatch =>
  dispatch({
    type: 'SET_CURRENT',
    payload: pos,
  })

export const setLazyLoad = lazyLoad => dispatch =>
  dispatch({
    type: 'SET_LAZYLOAD',
    payload: lazyLoad,
  })

export const setQuery = q => dispatch =>
  dispatch({
    type: 'SET_QUERY',
    payload: q,
  })

export const reducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_QUERY':
      return {
        ...state,
        query: action.payload,
      }

    case _loadContacts.requested:
      return {
        ...state,
        loadingContacts: true,
      }
    case _loadContacts.succeeded: {
      const { count, contacts, emailsSent } = action.payload

      return {
        ...state,
        loadingContacts: false,
        contacts,
        count,
        emailsSent,
      }
    }
    case _viewContact.requested:
      return {
        ...state,
        current: {},
        loadingContact: true,
      }
    case _viewContact.succeeded:
      return {
        ...state,
        loadingContact: false,
        current: action.payload,
      }
    case _updateContact.requested:
      return {
        ...state,
        loadingContact: true,
      }
    case _updateContact.succeeded:
      return {
        ...state,
        loadingContact: false,
        current: action.payload,
        contacts: state.contacts.map(c => (c._id !== action.payload._id ? c : action.payload)),
      }
    case _deleteContact.requested:
      return {
        ...state,
        deletingContact: true,
      }
    case _deleteContact.succeeded:
      return {
        ...state,
        deletingContact: false,
        contacts: state.contacts.filter(c => c._id !== action.payload),
      }
    case 'SET_CURRENT':
      return {
        ...state,
        currentId: action.payload,
      }
    default:
      return state
  }
}
