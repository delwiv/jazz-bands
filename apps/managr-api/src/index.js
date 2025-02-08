import bodyParser from 'body-parser'
import contacts from './routes/contactRoutes'
import cors from 'cors'
import emails from './routes/emails'
import express from 'express'
import mongoose from 'mongoose'
import morgan from 'morgan'
import { MONGODB_HOST, MONGODB_MANAGR_PASSWORD, PORT } from './config.json'

mongoose.connect(`mongodb://managr:${MONGODB_MANAGR_PASSWORD}@${MONGODB_HOST}/managr`, {
  useNewUrlParser: true
}, connectErr => {
  console.log(connectErr || `MongoDB connected to mongodb://mongo`)
})

const app = express()

app.use(morgan('tiny'))
app.use(cors({
  origin: process.env.MANAGR_WEB_URL,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}))

app.use((req, res, next) => {
  const auth = req.header('Authorization')?.split('Bearer ')?.[1]
  if (auth !== process.env.MANAGR_API_KEY) 
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
