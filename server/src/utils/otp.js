import crypto from 'node:crypto'

import bcrypt from 'bcryptjs'

export function generateOtp() {
  return String(crypto.randomInt(100000, 1000000))
}

export function hashOtp(otp) {
  return bcrypt.hash(otp, 12)
}

export function verifyOtp(otp, hash) {
  return bcrypt.compare(otp, hash)
}
