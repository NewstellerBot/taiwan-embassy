const { Telegraf } = require('telegraf')

require('dotenv').config()

const express = require('express')
const app = express()

const { query } = require('./db/index')

const controller = require('./controller')

const { start, help, subscribe, unsubscribe, list } = require('./bot/index')

const getDates = require('./util/getDates')

const bot = new Telegraf(process.env.BOT_TOKEN)
const PORT = process.env.PORT || 3000

const initDb = async () => {
  try {
    await query('CREATE TABLE IF NOT EXISTS ids (id VARCHAR(50) PRIMARY KEY);')
    await query(
      'CREATE TABLE IF NOT EXISTS available (date VARCHAR(50) PRIMARY KEY);'
    )
  } catch (err) {
    throw err
  }
}

const main = async () => {
  try {
    await initDb()
    await controller.init()

    bot.start(start)
    bot.help(help)
    bot.hears('/subscribe', subscribe)
    bot.hears('/unsubscribe', unsubscribe)
    bot.hears('/list', list)
    bot.launch()

    const notify = async () => {
      try {
        const available = await getDates()
        if (
          JSON.stringify(controller.getDates()) !== JSON.stringify(available)
        ) {
          controller.saveDates(available)
          controller.getIds().forEach(async (id) => {
            bot.telegram.sendMessage(id, '📅 New appointments available!')
          })
        }
      } catch (err) {
        throw err
      }
    }

    setInterval(notify, 1000 * 5 * 60)

    // Enable graceful stop
    process.once('SIGINT', () => bot.stop('SIGINT'))
    process.once('SIGTERM', () => bot.stop('SIGTERM'))
  } catch (err) {
    console.log('ERROR: \n', err)
  }
}

main().catch(console.log)

app.get('/', async (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

app.listen(PORT, () => console.log(`Listening on port ${PORT}`))
