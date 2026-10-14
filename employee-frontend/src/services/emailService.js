import emailjs from '@emailjs/browser'

// EmailJS Configuration
// Service ID: 'service_44ik05m' (Name: Manager)
// Template ID: 'template_xe2a1oe'
// Public Key: 'BlC69W8uOOXwr5pto'
export const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_44ik05m',
  templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_xe2a1oe',
  publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'BlC69W8uOOXwr5pto',
  adminEmail: import.meta.env.VITE_ADMIN_EMAIL || 'satyaqr77@gmail.com',
}

/**
 * Checks if EmailJS is properly configured with public key and template ID.
 */
export function isEmailConfigured() {
  return Boolean(
    EMAILJS_CONFIG.serviceId &&
    EMAILJS_CONFIG.templateId &&
    EMAILJS_CONFIG.publicKey
  )
}

/**
 * Sends a welcome confirmation email to the newly registered Manager,
 * and optionally an alert copy to the Admin email.
 *
 * @param {Object} manager - { name, gmail, phoneno, sector, department, salary }
 * @returns {Promise<{ success: boolean, message?: string, err?: any }>}
 */
export async function sendManagerWelcomeEmail(manager) {
  if (!manager || !manager.gmail) {
    return { success: false, message: 'Manager email is required.' }
  }

  if (!isEmailConfigured()) {
    console.warn(
      `[EmailJS] Email credentials not fully configured.\n` +
      `Service ID: ${EMAILJS_CONFIG.serviceId || 'MISSING'}\n` +
      `Template ID: ${EMAILJS_CONFIG.templateId || 'MISSING (set VITE_EMAILJS_TEMPLATE_ID in .env)'}\n` +
      `Public Key: ${EMAILJS_CONFIG.publicKey ? 'Present' : 'MISSING (set VITE_EMAILJS_PUBLIC_KEY in .env)'}\n` +
      `Skipping actual email delivery for "${manager.gmail}".`
    )
    return {
      success: false,
      isConfigMissing: true,
      message: 'EmailJS Public Key or Template ID missing in configuration.',
    }
  }

  const loginUrl = `${window.location.origin}/#login`
  const formattedSalary = manager.salary
    ? `₹${Number(manager.salary).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    : 'Competitive Scale'

  const baseParams = {
    to_name: manager.name,
    to_email: manager.gmail,
    manager_name: manager.name,
    manager_email: manager.gmail,
    manager_phone: manager.phoneno ? String(manager.phoneno) : 'N/A',
    sector: manager.sector || 'IT',
    domain: manager.department || 'Enterprise Leadership',
    salary: formattedSalary,
    login_url: loginUrl,
    registered_at: new Date().toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }),
    company_name: 'WorkSphere Enterprise',
    message: `Welcome to WorkSphere! Your manager registration is successful. You now have administrative access to manage teams, track employee records, and review department operations.`,
  }

  try {
    // 1. Send Welcome Email to the newly registered Manager's Gmail
    console.log(`[EmailJS] Sending welcome email to manager: ${manager.gmail}...`)
    const managerResponse = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.templateId,
      baseParams,
      EMAILJS_CONFIG.publicKey
    )
    console.log('[EmailJS] Manager email sent successfully:', managerResponse.status, managerResponse.text)

    // 2. If an Admin Email is configured (and different from manager), send an alert copy to Admin
    if (
      EMAILJS_CONFIG.adminEmail &&
      EMAILJS_CONFIG.adminEmail.trim().toLowerCase() !== manager.gmail.trim().toLowerCase()
    ) {
      try {
        const adminParams = {
          ...baseParams,
          to_name: 'WorkSphere Admin',
          to_email: EMAILJS_CONFIG.adminEmail.trim(),
          message: `📢 HR Admin Alert: A new manager "${manager.name}" (${manager.gmail}) has registered under domain "${manager.department || manager.sector}".`,
        }
        await emailjs.send(
          EMAILJS_CONFIG.serviceId,
          EMAILJS_CONFIG.templateId,
          adminParams,
          EMAILJS_CONFIG.publicKey
        )
        console.log('[EmailJS] Admin alert notification sent successfully.')
      } catch (adminErr) {
        console.warn('[EmailJS] Admin notification failed to send:', adminErr)
        // Non-fatal, manager email already went through
      }
    }

    return { success: true, message: 'Email sent successfully!' }
  } catch (error) {
    console.error('[EmailJS] Failed to send email via EmailJS:', error)
    return {
      success: false,
      message: error?.text || error?.message || 'Failed to send confirmation email.',
      error,
    }
  }
}
