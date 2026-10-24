import * as deliveryZoneService from '../services/deliveryZoneService.js'

export async function checkPincode(request, response) {
  const zone = await deliveryZoneService.checkPincode(request.query.pincode)
  response.json({
    success: true,
    data: { pincode: zone.pincode, areaName: zone.areaName, deliveryFeePaise: zone.deliveryFeePaise },
  })
}

export async function listZones(request, response) {
  const zones = await deliveryZoneService.listZones()
  response.json({ success: true, data: { zones } })
}

export async function createZone(request, response) {
  const zone = await deliveryZoneService.createZone(request.body)
  response.status(201).json({ success: true, data: { zone } })
}

export async function updateZone(request, response) {
  const zone = await deliveryZoneService.updateZone(request.params.id, request.body)
  response.json({ success: true, data: { zone } })
}
