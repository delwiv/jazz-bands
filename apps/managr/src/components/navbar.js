import React, { Component } from 'react'
import T from 'prop-types'
import { connect } from 'react-redux'
import debounce from 'lodash.debounce'
import Link from 'next/link'

import { loadContacts, setQuery, setLazyLoad, sendMails } from '../../lib/contacts'
import { months } from '../config'
import './navbar.css'

const types = {
  '4bands': '7 groupes (par défaut)',
  'jazzola': 'Jazzola'
}

class Navbar extends Component {
  static propTypes = {
    search: T.func.isRequired,
    count: T.number.isRequired,
    emailsSent: T.number.isRequired,
    total: T.number.isRequired,
    setQuery: T.func.isRequired,
    setLazyLoad: T.func.isRequired,
    lazyLoad: T.bool,
    sendMails: T.func.isRequired,
    loadingContacts: T.bool,
    selected: T.array,
    query: T.string,
  }

  state = { mailType: types[0], toRecontactDelay: 2 }

  onChange = e => {
    const value = e.target.value
    this.props.setQuery(value.length ? value : null)
    this.search()
  }

  search = debounce(() => this.props.search({ q: this.props.query }), 400)

  sendMails = () => {
    const { selected, sendMails } = this.props
    const { mailType, toRecontactDelay } = this.state
    sendMails({ emails: selected.map(contact => contact.email), type: mailType, toRecontactDelay })
  }

  render() {
    const {
      props: { query, total, loadingContacts, selected, emailsSent },
      state: { mailType, toRecontactDelay },
    } = this
    return [
      <div key="modalMail" id="modalMail" className="modal" style={{overflowY: 'visible'}}>
        <div className="modal-content">
          <h4>Envoi de mails </h4>
          <h5>
            {selected.length} contact
            {selected.length > 1 ? 's' : ''} selectionné
            {selected.length > 1 ? 's' : ''} ({emailsSent}
            /500 email
            {emailsSent > 1 ? 's' : ''} envoyé
            {emailsSent > 1 ? 's' : ''})
          </h5>
        <div className="row">
          <div className="col s3">
            <p>Type de mail</p>
          </div>
          <div className="col s9">
            <select value={mailType} onChange={event => this.setState({ mailType: event.target.value })}>
              {Object.keys(types).map(type => (
                <option key={type} value={type}>
                  {types[type]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="row">
          <div className="col s3">
            <p>Recontacter dans</p>
          </div>
          <div className="col s9">
            <select
              style={{zIndex: 10000}}
              value={toRecontactDelay}
              onChange={event => this.setState({ toRecontactDelay: event.target.value })}
            >
              <option value={null}>Ne pas modifier </option>
              {new Array(12).fill(0).map((_, i) => (<option key={i} value={i + 1}>
                  {i + 1} mois
                </option>
              ))}
            </select>
          </div>
        </div>
        </div>
        <div className="modal-footer">
          <a onClick={this.sendMails} className="modal-close waves-effect waves-green btn-flat">
            Envoyer
          </a>
        </div>
      </div>,
      <div key="nav" className="navbar-fixed">
        <ul id="dropdownMonths" className="dropdown-content">
          {months.map((month, i) => (
            <li key={month}>
              <a href="#!" onClick={() => this.onChange({ target: { value: `month:${i}` } })}>
                {month}
              </a>
            </li>
          ))}
        </ul>
        <div className="navbar-fixed">
          <nav>
            <div className="nav-wrapper">
              <div className="input-field" style={{ flex: 2 }}>
                <input ref={this.q} value={query || ''} id="search" type="search" required onChange={this.onChange} />
                <label className="label-icon" htmlFor="search">
                  <i className="material-icons">search</i>
                </label>
              </div>
              <ul className="right">
                <li>
                  <a className="dropdown-trigger" href="#!" data-target="dropdownMonths">
                    Mois
                    <i className="material-icons">arrow_drop_down</i>
                  </a>
                </li>
                <li>
                  <a className="modal-trigger" href="#modalMail">
                    <i className="material-icons">email</i>
                    Envoi mails
                  </a>
                </li>
                <li>
                  <Link href="/contact">
                    <a>
                      <i className="material-icons">person_add</i>
                      Nouvelle fiche
                    </a>
                  </Link>
                </li>
                <li>
                  <a href={null}>
                    <span>{`${total} contacts`}</span>
                  </a>
                </li>
                <li>
                  <a href={null}>
                    <span>{`${selected.length} Sélectionné${selected.length > 1 ? 's' : ''}`}</span>
                  </a>
                </li>
              </ul>
            </div>
            <div key="progress" className="progress">
              {loadingContacts && <div className="indeterminate" />}
            </div>
          </nav>
        </div>
      </div>,
    ]
  }
}

export default connect(
  state => ({
    query: state.query,
    count: state.contacts.length,
    total: state.count,
    emailsSent: state.emailsSent,
    lazyLoad: state.lazyLoad,
    loadingContacts: state.loadingContacts,
  }),
  dispatch => ({
    setQuery: q => dispatch(setQuery(q)),
    setLazyLoad: q => dispatch(setLazyLoad(q)),
    search: params => dispatch(loadContacts(params)),
    sendMails: params => dispatch(sendMails(params)),
  })
)(Navbar)
