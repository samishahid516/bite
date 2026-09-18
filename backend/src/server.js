import app from './app.js'
import { env } from './config/env.js'
import { connectDB } from './config/db.js'

async function start() {
  try {
    await connectDB()

    const server = app.listen(env.port, () => {
      console.log(`[server] listening on http://localhost:${env.port} (${env.nodeEnv})`)
    })

    const shutdown = (signal) => {
      console.log(`[server] received ${signal}, shutting down...`)
      server.close(() => process.exit(0))
    }

    process.on('SIGINT', () => shutdown('SIGINT'))
    process.on('SIGTERM', () => shutdown('SIGTERM'))
  } catch (err) {
    console.error('[server] failed to start:', err)
    process.exit(1)
  }
}

start()
