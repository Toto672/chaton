import crypto from 'node:crypto'

export function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url')
}

export function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex')
}

export function derivePasswordHash(password: string): string {
  return hashSecret(password)
}
