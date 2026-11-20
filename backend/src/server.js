import cors from 'cors'
import express from 'express'
import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const app = express()
const port = Number(process.env.PORT) || 3000
const dataDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data')
const unitsFile = path.join(dataDirectory, 'units.json')
const maintenanceFile = path.join(dataDirectory, 'maintenance.json')
const workshops = ['Ливарний цех', 'Цех гальваніки', 'Складальний цех', 'Фарбувальна лінія']
const statuses = ['В експлуатації', 'Потребує ТО', 'Аварійна зупинка', 'Виведено з експлуатації']
let mutationQueue = Promise.resolve()

app.use(cors())
app.use(express.json({ limit: '32kb' }))

function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
}

async function readCollection(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return []
    throw error
  }
}

async function writeCollection(file, value) {
  await mkdir(dataDirectory, { recursive: true })
  const temporaryFile = `${file}.${randomUUID()}.tmp`
  await writeFile(temporaryFile, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  await rename(temporaryFile, file)
}

function mutate(operation) {
  const result = mutationQueue.then(operation)
  mutationQueue = result.catch(() => {})
  return result
}

function validateUnit(input, partial = false) {
  const errors = []
  const result = {}
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return ['Передайте дані установки у форматі JSON-об’єкта']
  }
  const requiredString = (key, label, min, max) => {
    if (partial && !(key in input)) return
    const value = input[key]
    if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
      errors.push(`${label}: від ${min} до ${max} символів`)
      return
    }
    result[key] = value.trim()
  }

  requiredString('serialNumber', 'Заводський номер', 1, 40)
  requiredString('name', 'Назва установки', 3, 80)
  requiredString('workshop', 'Виробничий цех', 1, 80)
  if ((!partial || 'workshop' in input) && !workshops.includes(result.workshop)) {
    errors.push('Оберіть цех зі списку')
  }
  requiredString('status', 'Робочий стан', 1, 40)
  if ((!partial || 'status' in input) && !statuses.includes(result.status)) {
    errors.push('Оберіть робочий стан зі списку')
  }

  if (!partial || 'airFlowCapacity' in input) {
    const capacity = Number(input.airFlowCapacity)
    if (!Number.isInteger(capacity) || capacity < 500 || capacity > 150000) {
      errors.push('Продуктивність має бути цілим числом від 500 до 150 000 м³/год')
    } else result.airFlowCapacity = capacity
  }

  if (!partial || 'installationDate' in input) {
    const date = input.installationDate
    if (!isValidDate(date)) {
      errors.push('Вкажіть коректну дату введення в експлуатацію')
    } else result.installationDate = date
  }

  if (!partial || 'description' in input) {
    const description = input.description ?? ''
    if (typeof description !== 'string' || description.length > 500) errors.push('Опис має містити до 500 символів')
    else result.description = description.trim()
  }

  return errors.length ? errors : result
}

function validateMaintenance(input) {
  const errors = []
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return ['Передайте дані обслуговування у форматі JSON-об’єкта']
  }
  if (typeof input.technicianName !== 'string' || !input.technicianName.trim()) {
    errors.push("Вкажіть ім'я інженера")
  }
  if (!isValidDate(input.serviceDate) || input.serviceDate > new Date().toISOString().slice(0, 10)) {
    errors.push('Дата обслуговування має бути коректною та не в майбутньому')
  }
  if (typeof input.filterReplaced !== 'boolean') errors.push('Вкажіть, чи замінювалися фільтри')
  const pressure = Number(input.pressureDropKPa)
  if (!Number.isFinite(pressure) || pressure < 0.01 || pressure > 10) {
    errors.push('Перепад тиску має бути від 0.01 до 10.0 кПа')
  }
  if (typeof input.comment !== 'string') errors.push('Коментар має бути текстом')
  if (errors.length) return errors
  return {
    technicianName: input.technicianName.trim(),
    serviceDate: input.serviceDate,
    filterReplaced: input.filterReplaced,
    pressureDropKPa: pressure,
    comment: input.comment.trim()
  }
}

app.get('/api/health', (_request, response) => response.json({ status: 'ok' }))

app.get('/api/units', async (_request, response, next) => {
  try {
    response.json(await readCollection(unitsFile))
  } catch (error) {
    next(error)
  }
})

app.get('/api/units/:id', async (request, response, next) => {
  try {
    const units = await readCollection(unitsFile)
    const unit = units.find((item) => item.id === request.params.id)
    if (!unit) return response.status(404).json({ message: 'Вентиляційну установку не знайдено' })
    const maintenance = (await readCollection(maintenanceFile))
      .filter((record) => record.unitId === unit.id)
      .sort((a, b) => b.serviceDate.localeCompare(a.serviceDate))
    response.json({ ...unit, maintenance })
  } catch (error) {
    next(error)
  }
})

app.post('/api/units', async (request, response, next) => {
  const unit = validateUnit(request.body)
  if (Array.isArray(unit)) return response.status(400).json({ message: 'Перевірте введені дані', errors: unit })

  try {
    const created = await mutate(async () => {
      const units = await readCollection(unitsFile)
      if (units.some((item) => item.serialNumber.toLowerCase() === unit.serialNumber.toLowerCase())) {
        return null
      }
      const record = { id: randomUUID(), ...unit }
      await writeCollection(unitsFile, [...units, record])
      return record
    })
    if (!created) return response.status(400).json({ message: 'Установка з таким заводським номером вже існує' })
    response.status(201).json(created)
  } catch (error) {
    next(error)
  }
})

app.put('/api/units/:id', async (request, response, next) => {
  const fields = validateUnit(request.body, true)
  if (Array.isArray(fields)) return response.status(400).json({ message: 'Перевірте введені дані', errors: fields })

  try {
    const result = await mutate(async () => {
      const units = await readCollection(unitsFile)
      const index = units.findIndex((item) => item.id === request.params.id)
      if (index < 0) return { status: 404 }
      const updated = { ...units[index], ...fields }
      if (units.some((item) => item.id !== updated.id &&
          item.serialNumber.toLowerCase() === updated.serialNumber.toLowerCase())) return { status: 409 }
      units[index] = updated
      await writeCollection(unitsFile, units)
      return { status: 200, unit: updated }
    })
    if (result.status === 404) return response.status(404).json({ message: 'Вентиляційну установку не знайдено' })
    if (result.status === 409) return response.status(400).json({ message: 'Установка з таким заводським номером вже існує' })
    response.json(result.unit)
  } catch (error) {
    next(error)
  }
})

app.delete('/api/units/:id', async (request, response, next) => {
  try {
    const result = await mutate(async () => {
      const units = await readCollection(unitsFile)
      if (!units.some((item) => item.id === request.params.id)) return false
      await writeCollection(unitsFile, units.filter((item) => item.id !== request.params.id))
      const maintenance = await readCollection(maintenanceFile)
      await writeCollection(maintenanceFile, maintenance.filter((item) => item.unitId !== request.params.id))
      return true
    })
    if (!result) return response.status(404).json({ message: 'Вентиляційну установку не знайдено' })
    response.status(204).end()
  } catch (error) {
    next(error)
  }
})

app.post('/api/units/:id/maintenance', async (request, response, next) => {
  const recordFields = validateMaintenance(request.body)
  if (Array.isArray(recordFields)) {
    return response.status(400).json({ message: 'Перевірте введені дані', errors: recordFields })
  }
  try {
    const created = await mutate(async () => {
      const units = await readCollection(unitsFile)
      if (!units.some((item) => item.id === request.params.id)) return null
      const maintenance = await readCollection(maintenanceFile)
      const record = { id: randomUUID(), unitId: request.params.id, ...recordFields }
      await writeCollection(maintenanceFile, [...maintenance, record])
      return record
    })
    if (!created) return response.status(404).json({ message: 'Вентиляційну установку не знайдено' })
    response.status(201).json(created)
  } catch (error) {
    next(error)
  }
})

app.use((_request, response) => response.status(404).json({ message: 'Маршрут API не знайдено' }))
app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(500).json({ message: 'Не вдалося обробити запит. Спробуйте ще раз.' })
})

app.listen(port, () => {
  console.log(`Ventilation service API is running at http://localhost:${port}`)
})
