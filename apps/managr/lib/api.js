import fetch from 'isomorphic-unfetch'
import qs from 'querystring'
import { API_URL } from '../src/config'

export const sendMails = async params => {
  console.log({ params })
  const data = await fetch(`${API_URL}/emails`, {
    body: JSON.stringify(params),
    method: 'POST',
    cors: true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
  return data.json()
}

export const fetchContacts = async (params = {}, config) => {
  const data = await fetch(`${API_URL}/contacts?${qs.stringify(params)}`, { cors: true })
  return data.json()
}

export const fetchContact = async id => {
  const data = await fetch(`${API_URL}/contacts/${id}`, { cors: true })
  return data.json()
}

export const updateContact = async contact => {
  const data = await fetch(`${API_URL}/contacts/${contact._id}`, {
    cors: true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'PUT',
    body: JSON.stringify(contact),
  })
  return data.json()
}
export const createContact = async contact => {
  const data = await fetch(`${API_URL}/contacts`, {
    cors: true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(contact),
  })
  return data.json()
}

export const deleteContact = contactId => fetch(`${API_URL}/contacts/${contactId}`, { cors: true, method: 'DELETE' })
