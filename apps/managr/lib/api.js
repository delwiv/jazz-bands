import fetch from 'isomorphic-unfetch'
import qs from 'querystring'
import config from '../src/config'


const { API_URL, apiKey } = config

export const sendMails = async params => {
  console.log({ params })
  const data = await fetch(`${API_URL}/emails`, {
    body: JSON.stringify(params),
    method: 'POST',
    cors: true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey
    },
  })
  return data.json()
}

export const fetchContacts = async (params = {}, config) => {
  const data = await fetch(`${API_URL}/contacts?${qs.stringify(params)}`, {
    cors: true,
    headers: {
      'Authorization': 'Bearer ' + apiKey
    }
  })
  return data.json()
}

export const fetchContact = async id => {
  const data = await fetch(`${API_URL}/contacts/${id}`, { cors: true, headers: { 'Authorization': 'Bearer ' + apiKey } })
  return data.json()
}

export const updateContact = async contact => {
  const data = await fetch(`${API_URL}/contacts/${contact._id}`, {
    cors: true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + apiKey,
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
      'Authorization': 'Bearer ' + apiKey,
    },
    method: 'POST',
    body: JSON.stringify(contact),
  })
  return data.json()
}

export const deleteContact = contactId => fetch(`${API_URL}/contacts/${contactId}`, {
  cors: true, method: 'DELETE', headers: {
    'Authorization': 'Bearer ' + apiKey,
  }
})
