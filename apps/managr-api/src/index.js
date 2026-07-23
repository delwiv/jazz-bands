import 'dotenv/config'
import bodyParser from 'body-parser'
import contacts from './routes/contactRoutes.js'
import cors from 'cors'
import emails from './routes/emails.js'
import express from 'express'
import mongoose from 'mongoose'
import morgan from 'morgan'

const {
  PORT = 3092,
  MONGODB_MANAGR_PASSWORD,
  MONGODB_HOST = 'mongo:27017',
  MANAGR_WEB_URL,
  MANAGR_API_KEY,
} = process.env

mongoose.connect(`mongodb://managr:${MONGODB_MANAGR_PASSWORD}@${MONGODB_HOST}/managr`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}, connectErr => {
  console.log(connectErr || `MongoDB connected to mongodb://${MONGODB_HOST}`)
})

const app = express()

app.use(morgan('tiny'))
app.use(cors({
  origin: MANAGR_WEB_URL,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}))

app.use((req, res, next) => {
  const auth = req.header('Authorization')?.split('Bearer ')?.[1]
  if (auth !== MANAGR_API_KEY)
    return res.status(401).send('Unauthorized')

  next()
})

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

app.use('/contacts', contacts)
app.use('/emails', emails)

app.listen(PORT, () => {
  console.log(`App listenning on ${PORT}`)
})
