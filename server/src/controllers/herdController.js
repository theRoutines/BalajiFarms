import * as herdService from '../services/herdService.js'

export async function getStats(request, response) {
  const stats = await herdService.getHerdStats()
  response.json({ success: true, data: stats })
}

export async function listCattle(request, response) {
  const cattle = await herdService.listCattle()
  response.json({ success: true, data: { cattle } })
}

export async function addCattle(request, response) {
  const animal = await herdService.addCattle(request.body)
  response.status(201).json({ success: true, data: { animal } })
}

export async function updateCattle(request, response) {
  const animal = await herdService.updateCattle(request.params.id, request.body)
  response.json({ success: true, data: { animal } })
}
