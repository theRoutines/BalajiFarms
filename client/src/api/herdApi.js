import axiosClient from './axiosClient.js'

export async function getHerdStats() {
  return axiosClient.get('/herd/stats')
}

