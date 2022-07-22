require('dotenv').config();
const express = require('express');
const colors = require('colors');
const path = require('path');
const app = express();
const arguments = process.argv[2];
const PORT = arguments == "-t" ? 7000 : arguments == "-d" ? 8000 : 6026;

app.get('/:apikey', async(req, res) => {
    if (req.params.apikey != process.env.APIKEY) return res.sendStatus(403)
    res.sendFile(path.join(__dirname, '/lib/notion.js'));
})

app.listen(PORT, () => {
    console.log(`Now listening to requests on port ` + `${PORT}`.cyan);
    console.log(`Access by ` + `http://127.0.0.1:${PORT} (${PORT == 7000 ? "test" : PORT == 8000 ? "dev": "prod"})`.yellow)
});