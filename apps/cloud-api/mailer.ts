import nodemailer from 'nodemailer'

type SendMailInput = {
  to: string
  subject: string
  text: string
  html: string
}

const smtpHost = process.env.SMTP_HOST?.trim() ?? ''
const smtpPort = Number.parseInt(process.env.SMTP_PORT?.trim() ?? '587', 10)
const smtpSecure = (process.env.SMTP_SECURE?.trim() ?? 'false').toLowerCase() === 'true'
const smtpUser = process.env.SMTP_USER?.trim() ?? ''
const smtpPass = process.env.SMTP_PASS?.trim() ?? ''
const smtpFrom = process.env.SMTP_FROM?.trim() ?? 'Chatons Cloud <no-reply@chatons.ai>'

let transporterPromise: Promise<nodemailer.Transporter> | null = null

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (!transporterPromise) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: smtpUser || smtpPass
          ? {
              user: smtpUser,
              pass: smtpPass,
            }
          : undefined,
      }),
    )
  }
  return transporterPromise
}

export function isMailerConfigured(): boolean {
  return Boolean(smtpHost && smtpFrom)
}

export async function sendMail(input: SendMailInput): Promise<void> {
  if (!isMailerConfigured()) {
    console.warn('[cloud-api] mailer not configured, skipping email', {
      to: input.to,
      subject: input.subject,
    })
    return
  }
  const transporter = await getTransporter()
  await transporter.sendMail({
    from: smtpFrom,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  })
}

export function buildVerificationEmail(params: {
  verifyUrl: string
  displayName: string
}): SendMailInput {
  return {
    to: '',
    subject: 'Verify your Chatons Cloud email',
    text: [
      `Hello ${params.displayName},`,
      '',
      'Welcome to Chatons Cloud.',
      `Verify your email by opening: ${params.verifyUrl}`,
      '',
      'If you did not create this account, you can ignore this email.',
    ].join('\n'),
    html: `
      <p>Hello ${params.displayName},</p>
      <p>Welcome to Chatons Cloud.</p>
      <p><a href="${params.verifyUrl}">Verify your email address</a></p>
      <p>If you did not create this account, you can ignore this email.</p>
    `,
  }
}

export function buildPasswordResetEmail(params: {
  resetUrl: string
  displayName: string
}): SendMailInput {
  return {
    to: '',
    subject: 'Reset your Chatons Cloud password',
    text: [
      `Hello ${params.displayName},`,
      '',
      'A password reset was requested for your Chatons Cloud account.',
      `Reset your password here: ${params.resetUrl}`,
      '',
      'If you did not request this, you can ignore this email.',
    ].join('\n'),
    html: `
      <p>Hello ${params.displayName},</p>
      <p>A password reset was requested for your Chatons Cloud account.</p>
      <p><a href="${params.resetUrl}">Reset your password</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  }
}

export function buildPasswordChangedEmail(params: {
  displayName: string
}): SendMailInput {
  return {
    to: '',
    subject: 'Your Chatons Cloud password was changed',
    text: [
      `Hello ${params.displayName},`,
      '',
      'Your Chatons Cloud password was changed successfully.',
      'If this was not you, reset your password immediately and review your account access.',
    ].join('\n'),
    html: `
      <p>Hello ${params.displayName},</p>
      <p>Your Chatons Cloud password was changed successfully.</p>
      <p>If this was not you, reset your password immediately and review your account access.</p>
    `,
  }
}

export function buildOrganizationInviteEmail(params: {
  inviteUrl: string
  organizationName: string
  inviterName: string
}): SendMailInput {
  return {
    to: '',
    subject: `You're invited to join ${params.organizationName} on Chatons Cloud`,
    text: [
      `Hello,`,
      '',
      `${params.inviterName} invited you to join ${params.organizationName} on Chatons Cloud.`,
      `Accept the invite here: ${params.inviteUrl}`,
      '',
      'If you were not expecting this invite, you can ignore this email.',
    ].join('\n'),
    html: `
      <p>Hello,</p>
      <p>${params.inviterName} invited you to join <strong>${params.organizationName}</strong> on Chatons Cloud.</p>
      <p><a href="${params.inviteUrl}">Accept organization invite</a></p>
      <p>If you were not expecting this invite, you can ignore this email.</p>
    `,
  }
}
