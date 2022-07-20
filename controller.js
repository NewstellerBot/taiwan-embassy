const { query } = require('./db/index')
const getDates = require('./util/getDates')

const controller = () => {}

controller.getIds = () => {
  return controller.ids
}

controller.addId = async (id) => {
  await query(`INSERT INTO ids (id) VALUES ('${id}');`)
  const newIds = await query('SELECT * FROM ids')
  controller.ids = newIds.rows.map((json) => json.id)
}

controller.getDates = () => {
  return controller.dates
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
  controller.ids = newIds.rows.map((json) => json.id)
}

controller.init = async () => {
  const ids = await query('SELECT * FROM ids')
  const dates = await getDates()
  controller.ids = ids.rows.map((json) => json.id)
  controller.dates = dates
}

module.exports = controller
