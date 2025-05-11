const express = require('express')
const app = express()
const port = process.env.PORT || 3000
app.get('/api/:method', async (req, res) => {
    const method = req.params.method
    res.send(method)
})

app.get('/', async (req, res) => {
    res.send('hello mf')
})

app.listen(port, () => console.log(`PAAS is listening at :${port}`))