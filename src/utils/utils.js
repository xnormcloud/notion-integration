require('dotenv').config();
const bcrypt = require('bcryptjs');

module.exports = {
    checkKey: urlkey => {
        if(urlkey.slice(1, urlkey.length -1) != process.env.APIKEY) return false;
        const salt = `${process.env.SALT.slice(0, 1)}${urlkey.slice(0, 1)}${process.env.SALT.slice(1)}${urlkey.slice(urlkey.length - 1)}`
        const urlhash = bcrypt.hashSync(urlkey.slice(1, urlkey.length -1), salt).replace(/[^a-z\d]/g, '')
        return urlhash === process.env.HASHKEY
    },
}
