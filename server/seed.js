require('dotenv').config()
const mongoose = require('mongoose')
const User = require('./models/User')

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/forexpro')
  .then(async () => {
    const exists = await User.findOne({ email: 'admin@forexpro.com' })
    if (!exists) {
      await User.create({ name: 'admin', email: 'admin@forexpro.com', password: 'password', role: 'admin' })
      console.log('Admin user created: admin@forexpro.com / password')
    } else {
      console.log('Admin user already exists')
    }
    mongoose.disconnect()
  })
  .catch(err => { console.error(err); process.exit(1) })
