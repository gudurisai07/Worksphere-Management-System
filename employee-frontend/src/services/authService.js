import api from '../api/axiosConfig'

const SESSION_STORAGE_KEY = 'ems_active_session'

// Fetch all managers directly from MySQL database table `managers`
export async function getAllManagers() {
  try {
    const res = await api.get('/api/managers')
    if (Array.isArray(res.data)) {
      return res.data // Real MySQL data (empty [] if deleted)
    }
    return []
  } catch (err) {
    console.error('Failed to fetch managers from MySQL database:', err)
    return []
  }
}

// Delete all managers from MySQL database table `managers`
export async function deleteAllManagers() {
  try {
    await api.delete('/api/managers/deleteall')
    return []
  } catch (err) {
    const msg = err.response?.data?.message || 'Failed to delete all managers from database.'
    throw new Error(msg)
  }
}

// Register new manager into MySQL database table `managers`
export async function registerManager({ name, gmail, phoneno, salary, sector, department, password, profilePic }) {
  try {
    const res = await api.post('/api/managers/register', {
      name: name.trim(),
      gmail: gmail.trim().toLowerCase(),
      phoneno: Number(phoneno),
      salary: salary ? Number(salary) : 85000,
      sector: sector || 'IT',
      department: department || 'Software Engineering & Tech Lead',
      position: 'Team Manager',
      ranking: 'Standard Lead',
      password: password,
      profilePic: profilePic || null,
    })
    return res.data
  } catch (err) {
    const msg = err.response?.data?.message || err.message || 'Registration failed.'
    throw new Error(msg)
  }
}

// Manager login against MySQL database table `managers`
export async function loginManager(emailOrName, password) {
  try {
    const res = await api.post('/api/managers/login', {
      emailOrName: emailOrName.trim(),
      password,
    })

    const mgr = res.data
    const session = {
      role: 'manager',
      user: {
        mid: mgr.mid,
        id: `MGR-${mgr.mid}`,
        name: mgr.name,
        gmail: mgr.gmail,
        phoneno: mgr.phoneno,
        department: mgr.department,
        sector: mgr.sector,
        position: mgr.position,
        ranking: mgr.ranking,
        role: mgr.position || 'Team Manager',
        profilePic: mgr.profilePic || null,
      },
    }

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    return session
  } catch (err) {
    const msg = err.response?.data?.message || 'Invalid manager credentials.'
    throw new Error(msg)
  }
}

// Google Sign-In into MySQL database table `managers`
export async function loginWithGoogle({ name, email }) {
  try {
    const res = await api.post('/api/managers/google-auth', {
      name: name.trim(),
      email: email.trim().toLowerCase(),
    })

    const mgr = res.data
    const session = {
      role: 'manager',
      user: {
        mid: mgr.mid,
        id: `MGR-${mgr.mid}`,
        name: mgr.name,
        gmail: mgr.gmail,
        phoneno: mgr.phoneno,
        department: mgr.department,
        sector: mgr.sector,
        position: mgr.position,
        ranking: mgr.ranking,
        role: mgr.position || 'Team Manager',
        authProvider: 'google',
        profilePic: mgr.profilePic || null,
      },
    }

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    return session
  } catch (err) {
    const msg = err.response?.data?.message || 'Google authentication failed.'
    throw new Error(msg)
  }
}

// HR Admin login against MySQL database table `hr_admins`
export async function loginHR(username, password) {
  try {
    const res = await api.post('/api/hr/login', {
      username: username.trim(),
      password,
    })

    const hr = res.data
    const session = {
      role: 'hr',
      user: {
        id: 'HR-ADMIN',
        username: hr.username,
        name: hr.fullName || 'Chief HR Officer',
        email: hr.email,
        department: 'Corporate Administration',
        role: hr.role || 'HR Admin',
      },
    }

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    return session
  } catch (err) {
    const msg = err.response?.data?.message || 'Invalid HR admin credentials. (admin / admin)'
    throw new Error(msg)
  }
}

// Promote / elevate existing manager in MySQL database
export async function promoteManager(mid, { sector, department, position, ranking, salary }) {
  try {
    const res = await api.put(`/api/managers/${mid}/promote`, {
      sector,
      department,
      position,
      ranking,
      salary: salary ? Number(salary) : undefined,
    })
    return res.data
  } catch (err) {
    const msg = err.response?.data?.message || 'Failed to update manager position.'
    throw new Error(msg)
  }
}

// HR toggles Manager status Active (ON) / Inactive (OFF) in MySQL
export async function updateManagerStatus(mid, status) {
  try {
    const res = await api.put(`/api/managers/${mid}/status`, {
      status,
    })
    return res.data
  } catch (err) {
    const msg = err.response?.data?.message || 'Failed to update manager status.'
    throw new Error(msg)
  }
}

// Update manager profile avatar photo in MySQL
export async function updateManagerAvatar(mid, profilePic) {
  try {
    const res = await api.put(`/api/managers/${mid}/avatar`, {
      profilePic,
    })
    return res.data
  } catch (err) {
    const msg = err.response?.data?.message || 'Failed to update profile photo.'
    throw new Error(msg)
  }
}

// Delete manager from MySQL database
export async function deleteManager(mid) {
  try {
    await api.delete(`/api/managers/${mid}`)
    return await getAllManagers()
  } catch (err) {
    const msg = err.response?.data?.message || 'Failed to delete manager.'
    throw new Error(msg)
  }
}

export function getCurrentSession() {
  try {
    const data = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!data) return null
    return JSON.parse(data)
  } catch {
    return null
  }
}

export function logout() {
  localStorage.removeItem(SESSION_STORAGE_KEY)
}
