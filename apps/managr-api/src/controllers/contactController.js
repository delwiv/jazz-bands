import Contact from '../models/ContactModel.js'
import redis from '../lib/redis.js'

const PROJECTION = 'id, departement, ville, nom, responsable, mail, mail2, mail3, site, envoi_mail, mois_contact, send_mail_status, data, legacy_id'

export default {
  list: async (req, res) => {
    const { q } = req.query
    const filter = {}

    if (q) {
      if (q.match(/month:\d+/)) {
        filter.mois_contact = q.replace('month:', '')
      } else if (q.match(/v:.+/)) {
        filter.ville_like = q.replace('v:', '')
      } else if (q === 'emailErrors') {
        filter.email_errors_after = new Date(Date.now() - 86400000)
      } else {
        filter.search = q
      }
    }

    const [contacts, count, emailsSent] = await Promise.all([
      Contact.find(filter, PROJECTION),
      Contact.countDocuments(filter),
      redis.countLast24h().catch(() => 0),
    ])

    return res.json({
      contacts: contacts.sort((a, b) => (+a.departement || 0) - (+b.departement || 0)),
      count,
      emailsSent,
    })
  },

  show: async (req, res) => {
    try {
      const isSerial = /^\d+$/.test(req.params.id)
      const contact = await Contact.findOne(isSerial ? { id: req.params.id } : { legacy_id: req.params.id })
      if (!contact) {
        return res.status(404).json({ message: 'No such contact' })
      }
      return res.json(contact)
    } catch (err) {
      return res.status(500).json({ message: 'Error when getting contact.', error: err.message })
    }
  },

  create: async (req, res) => {
    try {
      const contact = await Contact.create({ ...req.body, departement: req.body.departement })
      return res.status(201).json(contact)
    } catch (err) {
      return res.status(500).json({ message: 'Error when creating contact', error: err.message })
    }
  },

  update: async (req, res) => {
    try {
      const contact = await Contact.updateById(req.params.id, req.body)
      if (!contact) {
        return res.status(404).json({ message: 'No such contact' })
      }
      return res.json(contact)
    } catch (err) {
      return res.status(500).json({ message: 'Error when updating contact.', error: err.message })
    }
  },

  remove: async (req, res) => {
    try {
      await Contact.deleteById(req.params.id)
      return res.status(204).json()
    } catch (err) {
      return res.status(500).json({ message: 'Error when deleting the contact.', error: err.message })
    }
  },
}
