/* eslint-disable jsx-a11y/anchor-is-valid */

import React from 'react'
import T from 'prop-types'
import './list.css'
import { connect } from 'react-redux'
import { Table } from 'react-materialize'
import Navbar from '../src/components/navbar'

import { loadContacts, setCurrent } from '../lib/contacts'
import { months } from '../src/config'
import Contact from './contact'

const isClient = typeof window !== 'undefined'

class Index extends React.Component {
  static propTypes = {
    contacts: T.array.isRequired,
    current: T.number,
    query: T.string,
    loading: T.bool,
    lazyLoad: T.bool,
    count: T.number,
    loadContacts: T.func.isRequired,
    setCurrent: T.func.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = { contacts: props.contacts, checkedContacts: [], unfold: [] }
    this.loadContacts = params => this.props.loadContacts(params)
  }

  componentDidUpdate() {
    if (this.props.contacts.length !== this.state.contacts.length) {
      this.setState({ contacts: this.props.contacts })
    }
  }

  componentDidMount() {
    if (isClient) {
      try {
        window.M.AutoInit()
      } catch (err) {}
    }
    if (!this.props.contacts.length) {
      return this.loadContacts()
    }
    if (this.props.current) {
      const element = document.getElementById(`contact_${this.props.current}`)

      element.scrollIntoView({ block: 'center' })
    }
  }

  onClickContact = (contactId, i) => {
    const previousUnfold = this.state.unfold
    const isUnfold = previousUnfold.some(c => c === contactId)
    const unfold = isUnfold ? previousUnfold.filter(c => c !== contactId) : previousUnfold.concat(contactId)
    this.setState({ unfold })
  }

  selectAll = e => {
    const checked = e.target.checked
    const checkedContacts = []
    let i = 0
    this.setState({
      contacts: this.state.contacts.map(c => {
        const lessThan500 = i < 490
        if (checked && lessThan500) {
          checkedContacts.push({ _id: c._id, email: c.mail })
          const { mail, mail2, mail3 } = c
          const toAdd = [mail, mail2, mail3].filter(m => !!m).length
          i += toAdd
        }
        return { ...c, checked: lessThan500 && checked }
      }),
      checkedContacts,
    })
  }

  selectContact = (contact, i) => e => {
    const checked = e.target.checked

    const contacts = this.state.contacts
    const current = contacts[i]
    current.checked = checked

    let checkedContacts = [...this.state.checkedContacts]
    if (checked) checkedContacts.push({ _id: current._id, email: current.mail })
    else checkedContacts = checkedContacts.filter(c => c._id !== current._id)
    this.setState({ contacts, checkedContacts })
  }

  format = new Intl.DateTimeFormat('fr-FR').format

  getDate = date => this.format(new Date(date))

  getRow = (current, unfold) => (contact, i) => {
    const displayFullContact = unfold.some(c => c === contact._id)
    const result = [
      <tr id={`contact_${i}`} key={contact._id} className={current === i || contact.checked ? 'row highlight' : 'row'}>
        <td align="center">
          <label>{i + 1}</label>
        </td>
        <td align="center" className="action-checkbox">
          <label>
            <input checked={contact.checked} type="checkbox" onChange={this.selectContact(contact, i)} />
            <span />
          </label>
        </td>
        <td>{+contact.departement}</td>
        <td>{contact.ville}</td>
        <td className="openContact" onClick={() => this.onClickContact(contact._id, i)}>
          {contact.nom}
        </td>
        <td>{contact.responsable}</td>
        <td>
          <a href={`mailto:${contact.mail}?SUBJECT=Jazz`}>{contact.mail}</a>
        </td>
        <td>
          {contact.envoi_mail}
          {contact.sendMailStatus ? (
            contact.sendMailStatus.error ? (
              <i
                className="material-icons prefix error"
                title={`${this.getDate(contact.sendMailStatus.date)} - ${contact.sendMailStatus.error}`}
              >
                mail
              </i>
            ) : contact.sendMailStatus.status === 'sending' ? (
              <i
                className="material-icons warning prefix"
                title={`Mail en attente depuis le ${this.getDate(contact.sendMailStatus.date)}`}
              >
                mail
              </i>
            ) : (
              <i
                className="material-icons prefix"
                title={`Mail envoyé le ${this.getDate(contact.sendMailStatus.date)}`}
              >
                mail
              </i>
            )
          ) : null}
        </td>
        <td>{months[+contact.mois_contact]}</td>
        <td>{contact.vu_le}</td>
      </tr>,
    ]
    if (displayFullContact) {
      result.push(
        <tr key="embedContact">
          <td colSpan={9}>
            <Contact contactId={contact._id} />
          </td>
        </tr>
      )
    }
    return result
  }

  render() {
    const {
      props: { current },
      state: { contacts, checkedContacts, unfold },
      getRow,
      selectAll,
    } = this
    const rows = contacts.map(getRow(current, unfold))
    return [
      <Navbar key="navbar" selected={checkedContacts} />,
      <div key="list" style={{ paddingTop: 0 }}>
        <Table>
          <thead>
            <tr>
              <th>#</th>
              <th>
                <label>
                  <input type="checkbox" onChange={selectAll} />
                  <span>Sél. tous</span>
                </label>
              </th>
              <th>Département</th>
              <th>Ville</th>
              <th>Nom</th>
              <th>Responsable</th>
              <th>Mail</th>
              <th>Mail Envoyé le</th>
              <th>Contact</th>
              <th>Vu le</th>
            </tr>
          </thead>
          <tbody>{rows}</tbody>
        </Table>
      </div>,
    ]
  }
}

const mapStateToProps = state => ({
  contacts: state.contacts,
  loading: state.loadingContacts,
  current: state.currentId,
  lazyLoad: state.lazyLoad,
  query: state.query,
  count: state.count,
})

const mapDispatchToProps = dispatch => ({
  loadContacts: params => dispatch(loadContacts(params)),
  setCurrent: pos => dispatch(setCurrent(pos)),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Index)
