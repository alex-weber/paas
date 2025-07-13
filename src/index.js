const express = require('express')
const puppeteer = require('puppeteer')
const { v4: uuidv4 } = require('uuid')

const app = express()
const PORT = process.env.PORT || 3030
const MAX_CONCURRENT_SESSIONS = 5

const sessions = new Map()
const queue = []

async function launchBrowser() {
    return await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
}

async function createSession(res) {
    if (sessions.size >= MAX_CONCURRENT_SESSIONS) {
        console.log('Session queue full, queuing request')
        queue.push(() => createSession(res))
        return
    }

    const browser = await launchBrowser()
    const sessionId = uuidv4()
    const browserWSEndpoint = browser.wsEndpoint()
    const expiresAt = Date.now() + 5 * 60 * 1000 // 5 min

    sessions.set(sessionId, { browser, expiresAt })

    console.log(`Session ${sessionId} started`)

    res.json({ browserWSEndpoint, sessionId, expiresAt })

    browser.on('disconnected', () => {
        console.log(`Browser for session ${sessionId} disconnected`)
        sessions.delete(sessionId)
        runNextInQueue()
    })
}

function runNextInQueue() {
    if (queue.length > 0 && sessions.size < MAX_CONCURRENT_SESSIONS) {
        const next = queue.shift()
        if (typeof next === 'function') next()
    }
}

function cleanupSessions() {
    const now = Date.now()
    for (const [id, { browser, expiresAt }] of sessions.entries()) {
        if (now > expiresAt) {
            console.log(`Session ${id} expired`)
            browser.close().catch(() => {})
            sessions.delete(id)
            runNextInQueue()
        }
    }
}

setInterval(cleanupSessions, 10 * 1000) // clean every 10 sec

app.get('/start', async (req, res) => {
    try {
        await createSession(res)
    } catch (err) {
        console.error(err)
        res.status(500).send('Failed to start session')
    }
})

app.get('/', (req, res) => {
    res.send('Puppeteer WebSocket Service is running')
})

app.listen(PORT, () => {
    console.log(`Puppeteer service listening on http://localhost:${PORT}`)
})
