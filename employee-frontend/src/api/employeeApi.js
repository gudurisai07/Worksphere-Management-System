import api from './axiosConfig'

// Every function below maps 1:1 to an existing Spring Boot endpoint.
// Backend field names are used as-is: eid, ename, age, salary, gmail, phoneno.

const BASE = '/manager'

// GET /manager/getmanager  -> [ {eid, ename, ...}, ... ]
export async function getAllEmployees() {
  const res = await api.get(`${BASE}/getmanager`)
  return Array.isArray(res.data) ? res.data : []
}

// GET /manager/getmgr/{eid}  -> {employee} | 404
export async function getEmployeeById(eid) {
  const res = await api.get(`${BASE}/getmgr/${encodeURIComponent(eid)}`)
  return normalizeSingle(res.data)
}

// GET /manager/geteml/{gmail}  -> {employee} | 404
export async function getEmployeeByEmail(gmail) {
  const res = await api.get(`${BASE}/geteml/${encodeURIComponent(gmail)}`)
  return normalizeSingle(res.data)
}

// POST /manager   body has NO eid (database generates it)
export async function createEmployee(payload) {
  const res = await api.post(BASE, payload)
  return res.data
}

// PUT /manager/update/{eid}   eid is in the URL, not in the body
export async function updateEmployee(eid, payload) {
  const res = await api.put(`${BASE}/update/${encodeURIComponent(eid)}`, payload)
  return res.data
}

// DELETE /manager/delete/{eid}  -> plain text "Manager 5 deleted successfully"
export async function deleteEmployee(eid) {
  const res = await api.delete(`${BASE}/delete/${encodeURIComponent(eid)}`)
  return res.data
}

// DELETE /manager/deleteall  -> plain text
export async function deleteAllEmployees() {
  const res = await api.delete(`${BASE}/deleteall`)
  return res.data
}

// Older versions of the backend answered "200 + empty body" when nothing matched.
// Treat that the same as "not found" so the UI is correct with either backend version.
function normalizeSingle(data) {
  if (data && typeof data === 'object' && data.eid !== undefined) return data
  const err = new Error('Employee not found')
  err.isNotFound = true
  throw err
}
