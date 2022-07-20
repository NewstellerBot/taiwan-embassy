const { query } = require('./db/index')

const controller = () => {}

controller.getIds = () => {
  return controller.ids
}

controller.addId = async (id) => {
  await query(`INSERT INTO ids (id) VALUES ('${id}');`)
  const newIds = await query('SELECT * FROM ids')
  controller.ids = newIds.rows
}

controller.getDates = async () => {
  return controller.times
}

controller.saveDates = async (dates) => {
  await query('DELETE FROM available;')
  dates.forEach(async (date) => {
    await query(`INSERT INTO available (date) VALUES ('${date}');`)
  })
  const newDates = await query('SELECT * FROM available')
  controller.dates = newDates.rows
}

controller.removeId = async (id) => {
  await query(`DELETE FROM ids WHERE id = '${id}';`)
  const newIds = await query('SELECT * FROM ids')
  controller.ids = newIds.rows
}

controller.init = async () => {
  const ids = await query('SELECT * FROM ids')
  const dates = await query('SELECT * FROM available')
  controller.ids = ids
  controller.dates = dates.rows
}

module.exports = controller
