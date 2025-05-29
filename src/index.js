require('dotenv').config()
const express = require('express')
const {takeScreenshot} = require("./puppeteer")
const path = require('path')

const app = express()
const port = process.env.PORT || 3000
app.use('/public', express.static(path.join(__dirname, 'tmp')))

app.get('/screenshot', async (req, res) => {

    const { apiKey, hash } = req.query

    if (!apiKey || apiKey !== process.env.API_KEY) {
        res.send('API key missing or wrong')

        return
    }
    if (!hash || hash.length < 15) {
        res.send('Hash missing or wrong')

        return
    }
    const deckBuilderLink = 'https://www.kards.com/decks/deck-builder/?hash=%25%25'
    console.log(deckBuilderLink+encodeURIComponent(hash))
    takeScreenshot(deckBuilderLink+encodeURIComponent(hash)).then(result => {
        if (!result) res.send('something went wrong')
        else {
            const files = [
                `${req.protocol}://${req.get('host')}/public/deckScreenshot.webp`,
                `${req.protocol}://${req.get('host')}/public/deckScreenshot2.webp`,
            ]
            res.json(files)
        }
    })

})

app.get('/', async (req, res) => {
    res.send('hello mf')
})

app.listen(port, () => console.log(`PAAS is listening at :${port}`))