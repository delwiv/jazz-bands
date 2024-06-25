/* eslint-disable jsx-a11y/anchor-is-valid */

import React, { Component } from 'react'
import T from 'prop-types'
import { connect } from 'react-redux'
import { equals, path } from 'ramda'
import Link from 'next/link'

import { viewContact, updateContact, deleteContact } from '../lib/contacts'
import { months, depts } from '../src/config'
import './contact.css'

class Contact extends Component {
  static propTypes = {
    contact: T.object.isRequired,
    loading: T.bool,
    viewContact: T.func.isRequired,
    updateContact: T.func.isRequired,
    deleteContact: T.func.isRequired,
    contactId: T.string,
  }

  constructor(props) {
    super(props)
    this.state = { contact: {} }
    this.textareaRef = React.createRef()
  }

  componentDidUpdate = prevProps => {
    if (!equals(prevProps.contact, this.props.contact)) {
      this.setState({ contact: this.props.contact })
    }
    if (!equals(prevProps.loading, this.props.loading)) {
      this.setState({ loading: this.props.loading })
    }
    window.M.updateTextFields()
    window.M.textareaAutoResize(this.textareaRef.current)
  }

  componentDidMount() {
    this.setState({ contact: {} })
    if (this.props.contactId) {
      this.props.viewContact(this.props.contactId)
    }
    try {
      window.M.AutoInit()
    } catch (err) {}
  }

  handleChange = field => event => {
    this.setState({
      contact: {
        ...this.state.contact,
        [field]: event.target.value,
      },
    })
  }
  updateContact = () => {
    this.props.updateContact(this.state.contact)
  }

  deleteContact = () => {
    this.setState({ contact: {} })
    if (!this.props.creation) {
      this.props.deleteContact(this.state.contact._id)
    }
  }

  handleMonth = e => {
    const month = e.target.attributes.getNamedItem('id').nodeValue
    this.setState({
      contact: { ...this.state.contact, mois_contact: month },
    })
  }

  getInput = (contact = {}) => (field, custom, options = {}) => {
    const label = custom || `${field[0].toUpperCase()}${field.slice(1)}`
    const width = options.width || 12
    const value = options.value || contact[field]
    const Icon = () => <i className="material-icons prefix">{options.icon}</i>
    const Right = () => (
      <div className={`input-field col s${12 - width}`}>
        <i className="material-icons prefix">{options.right.icon}</i>
        <input value={options.right.label} type="text" />
      </div>
    )
    return (
      <div className="row" title={label}>
        <div className={`input-field col s${width}`}>
          {options.icon && <Icon />}
          {options.Input ? (
            <options.Input />
          ) : (
            <input
              id={field}
              name={field}
              placeholder={label}
              value={field === 'departement' ? +(value || '44') : value}
              onChange={this.handleChange(field)}
              type="text"
              className="validate"
              {...options}
            />
          )}
          {!options.icon && <label htmlFor={field}>{label}</label>}
        </div>
        {options.right && <Right />}
      </div>
    )
  }

  render() {
    const {
      state: { contact },
      props: { loading, creation },
      updateContact,
      deleteContact,
      handleChange,
      handleMonth,
    } = this

    const getInput = this.getInput(contact || {})
    const hasChanged = !equals(contact, this.props.contact)

    return (
      <div>
        {contact && (
          <form
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              alignItems: 'center',
              flex: 1,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                width: '90%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  flex: 1,
                }}
              >
                <fieldset>
                  <legend>Adresse</legend>
                  <div className="row">
                    <div className="col s12">{getInput('nom', null, { icon: 'home' })}</div>
                  </div>
                  <div className="row">
                    <div className="col s12">{getInput('adresse', null, { icon: 'location_on' })}</div>
                  </div>
                  <div className="row">
                    <div className="col s4">{getInput('cp', 'Code Postal', { icon: 'local_post_office' })}</div>
                    <div className="col s8">{getInput('ville', null, { icon: 'business' })}</div>
                  </div>
                  <div className="row">
                    <div className="col s4">{getInput('departement', 'N° département', { icon: 'flag' })}</div>
                    <div className="col s8">
                      {getInput('departement_label', 'Département', {
                        icon: 'informations',
                        value: path(['name'], depts.find(d => +d.code === +contact.departement)) || '',
                      })}
                    </div>
                  </div>
                </fieldset>
                <fieldset>
                  <legend>Infos</legend>
                  <div className="row">
                    <div className="col s9">{getInput('site', 'Site web', { icon: 'desktop_windows' })}</div>
                    <a
                      className={`btn right ${!contact.site && 'disabled'}`}
                      href={contact.site}
                      target="_blank"
                      style={{ flex: 1 }}
                      rel="noopener noreferrer"
                    >
                      Ouvrir
                    </a>
                  </div>
                  <div className="row">
                    <div className="col s6">{getInput('cible', null, { icon: 'gps_fixed' })}</div>
                    <div className="col s6">{getInput('vu_le', 'Vu le', { icon: 'remove_red_eye' })}</div>
                  </div>
                  <div className="row">
                    <div className="col s12">
                      <div className="row">
                        <div className={`input-field col s12`}>
                          <i className="material-icons prefix">subdirectory_arrow_right</i>
                          <a
                            id="mois_contact"
                            className="dropdown-trigger black-text validate"
                            href="#!"
                            style={{ marginLeft: '45px' }}
                            data-target="dropdownMonthsContact"
                          >
                            {months[contact.mois_contact]}
                            <i className="material-icons ">arrow_drop_down</i>
                          </a>

                          <div className="input-field">
                            <ul id="dropdownMonthsContact" className="dropdown-content">
                              {months.map((month, i) => (
                                <li key={month}>
                                  <a id={i} href="#!" onClick={handleMonth}>
                                    {month}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                }}
              >
                <fieldset>
                  <legend>Responsable</legend>
                  <div className="row">
                    <div className="col s7">{getInput('responsable', 'Nom', { icon: 'account_circle' })}</div>
                    <div className="col s5">{getInput('tel_pro', 'Tel', { icon: 'phone' })}</div>
                  </div>
                  <div className="row">
                    <div className="col s7">{getInput('mail', 'Mail', { icon: 'alternate_email' })}</div>
                    <div className="col s5">{getInput('envoi_mail', 'Mail envoyé', { icon: 'date_range' })}</div>
                  </div>
                </fieldset>
                <fieldset>
                  <legend>Responsable 2</legend>
                  <div className="row">
                    <div className="col s7">{getInput('responsable2', 'Nom', { icon: 'account_circle' })}</div>
                    <div className="col s5">{getInput('tel_perso', 'Tel', { icon: 'phone' })}</div>
                  </div>
                  <div className="row">
                    <div className="col s12">{getInput('mail2', 'Mail', { icon: 'alternate_email' })}</div>
                  </div>
                </fieldset>
                <fieldset>
                  <legend>Responsable 3</legend>
                  <div className="row">
                    <div className="col s7">{getInput('responsable3', 'Nom', { icon: 'account_circle' })}</div>
                    <div className="col s5">{getInput('tel3', 'Tel', { icon: 'phone' })}</div>
                  </div>
                  <div className="row">
                    <div className="col s12">{getInput('mail3', 'Mail', { icon: 'alternate_email' })}</div>
                  </div>
                </fieldset>
              </div>
            </div>
            <div
              style={{
                width: '90%',
                display: 'flex',
                flex: 1,
                flexDirection: 'column',
              }}
            >
              <fieldset>
                <legend>Notes</legend>
                <textarea
                  className="materialize-textarea"
                  rows={8}
                  id="notes"
                  ref={this.textareaRef}
                  value={contact.notes}
                  onChange={handleChange('notes')}
                />
              </fieldset>
            </div>
            <div className="controls-wrap">
              <div className="controls">
                <div id="modal1" className="modal">
                  <div className="modal-content">
                    <h4>Supprimer ?</h4>
                  </div>
                  <div className="modal-footer">
                    <a href="#!" className="btn modal-close waves-effect blue">
                      Non
                    </a>
                    <a onClick={deleteContact} href="#!" className="btn modal-close waves-effect red">
                      Oui
                    </a>
                  </div>
                </div>
                <Link href="/">
                  <a className="waves-effect waves-light btn"> Retour liste</a>
                </Link>
                <a className="waves-effect waves-light btn red modal-trigger" href="#modal1" disabled={loading}>
                  {creation ? 'Annuler' : 'Supprimer'}
                </a>

                <input
                  type="button"
                  className="waves-effect waves-light btn blue"
                  disabled={loading || !hasChanged}
                  onClick={updateContact}
                  id="save"
                  value="Sauver"
                />
              </div>
            </div>
          </form>
        )}
      </div>
    )
  }
}

const mapStateToProps = state => ({
  contact: state.current,
  loading: state.loadingContact,
})

const mapDispatchToProps = dispatch => ({
  viewContact: params => dispatch(viewContact(params)),
  updateContact: params => dispatch(updateContact(params)),
  deleteContact: params => dispatch(deleteContact(params)),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Contact)
