import { API_BASE_URL } from '../api/axiosConfig'

/**
 * Converts any error thrown by Axios into a short, human-readable sentence.
 * `context` is a phrase like "load employees" used in generic messages.
 */
export function getErrorMessage(error, context = 'complete the request') {
  if (error?.isNotFound) return 'Employee not found.'

  // The server answered with an error status (400, 404, 409, 500 ...)
  if (error?.response) {
    const { status, data } = error.response
    const serverMsg = data && typeof data === 'object' ? data.message : undefined
    if (status === 404) return serverMsg || 'Not found (404). The employee does not exist.'
    if (status === 409) return serverMsg || 'Conflict (409). That email already exists.'
    if (status === 400) return serverMsg || 'The server rejected the data (400). Please check the form.'
    if (status >= 500)
      return serverMsg || `Server error (${status}). Check the Spring Boot console and that MySQL is running.`
    return serverMsg || `Request failed with status ${status}.`
  }

  // The request never got an answer
  if (error?.code === 'ECONNABORTED')
    return `The server took too long to respond. Could not ${context}.`
  if (error?.request || error?.code === 'ERR_NETWORK')
    return `Cannot reach the backend at ${API_BASE_URL}. Make sure Spring Boot is running on port 7777 and CORS allows http://localhost:5173.`

  return `Could not ${context}. ${error?.message || ''}`.trim()
}

export function isNotFound(error) {
  return Boolean(error?.isNotFound) || error?.response?.status === 404
}
