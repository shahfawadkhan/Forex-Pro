require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../models/User')

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/forexpro')
  const exists = await User.findOne({ email: 'admin@forexpro.com' })
  if (!exists) {
    await User.create({ name: 'Admin', email: 'admin@forexpro.com', password: 'password123', role: 'admin' })
    console.log('✅ Admin user created: admin@forexpro.com / password123')
  } else {
    console.log('ℹ️  Admin user already exists')
  }
  process.exit(0)
}
seed().catch(e => { console.error(e); process.exit(1) })
