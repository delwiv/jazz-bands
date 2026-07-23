import React from 'react'
import T from 'prop-types'
import './list.css'
import { connect } from 'react-redux'
import { VariableSizeList } from 'react-window'
import Navbar from '../src/components/navbar'

import { loadContacts, setCurrent } from '../lib/contacts'
import { months } from '../src/config'
import Contact from './contact'

const ROW_HEIGHT = 45
const EXTRA_HEIGHT = 700
const HEADER_HEIGHT = 40
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

  state = {
    checkedSet: new Set(),
    unfold: new Set(),
    height: 800,
  }

  listRef = React.createRef()

  constructor(props) {
    super(props)
    this.loadContacts = params => this.props.loadContacts(params)
  }

  componentDidMount() {
    if (isClient) {
      try { window.M.AutoInit() } catch (err) {}
      this.updateSize()
      window.addEventListener('resize', this.updateSize)
    }
    if (!this.props.contacts.length) {
      return this.loadContacts()
    }
    if (this.props.current) {
      this.listRef.current && this.listRef.current.scrollToItem(this.props.current, 'center')
    }
  }

  componentWillUnmount() {
    if (isClient) {
      window.removeEventListener('resize', this.updateSize)
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.contacts !== this.props.contacts) {
      this.setState(prev => ({
        checkedSet: new Set(
          Array.from(prev.checkedSet).filter(id =>
            this.props.contacts.some(c => c._id === id)
          )
        )
      }))
    }
  }

  updateSize = () => {
    this.setState({ height: window.innerHeight - 64 - HEADER_HEIGHT })
  }

  toggleUnfold = (contactId) => {
    const index = this.props.contacts.findIndex(c => c._id === contactId)
    this.setState(prev => {
      const next = new Set(prev.unfold)
      if (next.has(contactId)) next.delete(contactId)
      else next.add(contactId)
      return { unfold: next }
    }, () => {
      if (index >= 0 && this.listRef.current) this.listRef.current.resetAfterIndex(index)
    })
  }

  selectAll = (e) => {
    const checked = e.target.checked
    this.setState(() => {
      if (!checked) return { checkedSet: new Set() }
      let emailCount = 0
      const selected = new Set()
      for (const c of this.props.contacts) {
        const toAdd = [c.mail, c.mail2, c.mail3].filter(Boolean).length
        if (emailCount + toAdd > 500) break
        selected.add(c._id)
        emailCount += toAdd
      }
      return { checkedSet: selected }
    })
  }

  selectContact = (contactId) => {
    this.setState(prev => {
      const next = new Set(prev.checkedSet)
      if (next.has(contactId)) next.delete(contactId)
      else next.add(contactId)
      return { checkedSet: next }
    })
  }

  getItemSize = (index) => {
    const contact = this.props.contacts[index]
    if (contact && this.state.unfold.has(contact._id)) {
      return ROW_HEIGHT + EXTRA_HEIGHT
    }
    return ROW_HEIGHT
  }

  Row = ({ index, style, data }) => {
    const contact = data.contacts[index]
    if (!contact) return null
    const isExpanded = data.unfold.has(contact._id)
    const isChecked = data.checkedSet.has(contact._id)

    return (
      <div style={{ ...style, overflow: 'hidden' }}>
        <div className={`tr ${isChecked ? 'highlight' : ''}`}>
          <div className="td idx">{index + 1}</div>
          <div className="td chk">
            <label>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => data.selectContact(contact._id)}
              />
              <span />
            </label>
          </div>
          <div className="td dept">{+contact.departement}</div>
          <div className="td ville">{contact.ville}</div>
          <div className="td nom openContact" onClick={() => data.toggleUnfold(contact._id)}>
            {contact.nom}
          </div>
          <div className="td resp">{contact.responsable}</div>
          <div className="td mail">
            <a href={`mailto:${contact.mail}?SUBJECT=Jazz`}>{contact.mail}</a>
          </div>
          <div className="td lastmail">
            {contact.envoi_mail}
            {contact.sendMailStatus ? (
              contact.sendMailStatus.error ? (
                <i className="material-icons prefix error" title={`${data.getDate(contact.sendMailStatus.date)} - ${contact.sendMailStatus.error}`}>mail</i>
              ) : contact.sendMailStatus.status === 'sending' ? (
                <i className="material-icons warning prefix" title={`Mail en attente depuis le ${data.getDate(contact.sendMailStatus.date)}`}>mail</i>
              ) : (
                <i className="material-icons prefix" title={`Mail envoyé le ${data.getDate(contact.sendMailStatus.date)}`}>mail</i>
              )
            ) : null}
          </div>
          <div className="td contact">{data.months[+contact.mois_contact]}</div>
        </div>
        {isExpanded && (
          <div style={{ height: EXTRA_HEIGHT, overflow: 'auto' }}>
            <Contact contactId={contact._id} />
          </div>
        )}
      </div>
    )
  }

  render() {
    const {
      props: { contacts, current },
      state: { checkedSet, unfold, height },
      Row,
      selectAll,
      toggleUnfold,
      selectContact,
      getItemSize,
    } = this

    const checkedItems = contacts.filter(c => checkedSet.has(c._id)).map(c => ({ _id: c._id, email: c.mail }))

    const itemData = {
      contacts,
      unfold,
      checkedSet,
      toggleUnfold,
      selectContact,
      months,
      getDate: this.getDate,
    }

    return [
      <Navbar key="navbar" selected={checkedItems} />,
      <div key="list" className="table-virtual">
        <div className="table-header">
          <div className="tr">
            <div className="th idx">#</div>
            <div className="th chk">
              <label>
                <input type="checkbox" onChange={selectAll} />
                <span />
              </label>
            </div>
            <div className="th dept">Département</div>
            <div className="th ville">Ville</div>
            <div className="th nom">Nom</div>
            <div className="th resp">Responsable</div>
            <div className="th mail">Mail</div>
            <div className="th lastmail">Mail Envoyé le</div>
            <div className="th contact">Contact</div>
          </div>
        </div>
        <VariableSizeList
          ref={this.listRef}
          height={height}
          itemCount={contacts.length}
          itemSize={getItemSize}
          itemData={itemData}
          width="100%"
        >
          {Row}
        </VariableSizeList>
      </div>,
    ]
  }

  format = new Intl.DateTimeFormat('fr-FR').format

  getDate = date => this.format(new Date(date))
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
