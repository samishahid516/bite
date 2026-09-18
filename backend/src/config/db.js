import mongoose from 'mongoose'
import dns from 'node:dns'
import { env } from './env.js'

mongoose.set('strictQuery', true)

// Node's built-in DNS resolver fails SRV lookups (mongodb+srv://) against
// some ISP router DNS servers. Point it at public DNS resolvers instead.
dns.setServers(['8.8.8.8', '1.1.1.1'])

export async function connectDB() {
  mongoose.connection.on('connected', () => {
    console.log(`[mongo] connected -> ${mongoose.connection.name}`)
  })

  mongoose.connection.on('error', (err) => {
    console.error('[mongo] connection error:', err.message)
  })

  mongoose.connection.on('disconnected', () => {
    console.warn('[mongo] disconnected')
  })

  await mongoose.connect(env.mongoUri)
}

export async function disconnectDB() {
  await mongoose.disconnect()
}
