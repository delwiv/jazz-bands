import { randomUUID } from 'crypto'
import fs from 'fs'
import { join } from 'path'
import { Queue, Worker } from 'bullmq'

import Contact from '../models/ContactModel.js'
import redis from './redis.js'
import { sendMail } from './gmail.js'

const NB_PARALLEL_EMAILS = 2
const JOB_DELAY = 1000 * 60 * 60 * 3 // 3h
const REDIS_CONNECTION = { host: 'redis' }

function getBody(type) {
  return fs.readFileSync(join(import.meta.dirname, `../mails/${type}.html`), 'utf8')
}

function formatDate(date) {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = String(date.getFullYear()).slice(-2)
  return `${d}/${m}/${y}`
}

const mailQueue = new Queue('sendMail', { connection: REDIS_CONNECTION })

const worker = new Worker('sendMail', async (job) => {
  const { name, email, type, toRecontact } = job.data
  const subjects = {
    '4bands': `${name} - Proposition spectacle`,
    jazzola: 'Hommage à Marcel Azzola',
  }

  await Contact.updateOne(
    { $or: [{ mail: email }, { mail2: email }, { mail3: email }] },
    { sendMailStatus: { date: new Date(), status: 'sending' } }
  )

  await sendMail({
    subject: subjects[type],
    body: getBody(type),
    to: email.trim(),
  })

  if (toRecontact !== null) {
    await Contact.updateOne(
      { $or: [{ mail: email }, { mail2: email }, { mail3: email }] },
      {
        sendMailStatus: { date: new Date(), status: 'sent' },
        mois_contact: toRecontact + 1,
        envoi_mail: formatDate(new Date()),
      }
    )
  }

  redis.addToCount(randomUUID()).catch(err => console.error('Redis count failed', err))
}, {
  connection: REDIS_CONNECTION,
  concurrency: NB_PARALLEL_EMAILS,
})

worker.on('error', async (err) => {
  console.error('BullMQ error', err)
  try {
    await sendMail({
      body: err.message + '\n' + (err.stack || ''),
      subject: 'Massmail error happened',
      to: 'delwiv@protonmail.com',
    })
  } catch (sendErr) {
    console.error('Failed to send error notification', sendErr)
  }
})

export const sendMails = async ({ emails, type, toRecontact }) => {
  for (const email of emails) {
    try {
      const contact = await Contact.findOne({
        $or: [{ mail: email }, { mail2: email }, { mail3: email }],
      })
      const dataList = [contact.mail, contact.mail2, contact.mail3].filter(Boolean)
      const sentCount = await redis.countLast24h()
      const delay = sentCount >= 500 ? JOB_DELAY : 0

      await Promise.all(dataList.map(m =>
        mailQueue.add('sendMail', {
          email: m,
          type,
          total: emails.length,
          toRecontact,
          name: contact.nom,
        }, {
          attempts: 10,
          backoff: { type: 'exponential' },
          delay,
        })
      ))

      await Contact.updateOne(
        { $or: [{ mail: email }, { mail2: email }, { mail3: email }] },
        { sendMailStatus: { date: new Date(), status: 'queued' } }
      )

      console.log({ sentCount })
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error(error)
      const errorMessage =
        error.message === 'Invalid to header'
          ? `Mauvaise adresse email : ${email}`
          : error.message
      await Contact.updateOne(
        { $or: [{ mail: email }, { mail2: email }, { mail3: email }] },
        { sendMailStatus: { date: new Date(), error: errorMessage } }
      )
    }
  }
}
