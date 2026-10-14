import { useState, useMemo, useEffect } from 'react'
import {
  getAllManagers,
  deleteManager,
  deleteAllManagers,
  promoteManager,
  updateManagerStatus,
  loginHR,
} from '../services/authService'
import Alert from './Alert'
import Spinner from './Spinner'
import { DEFAULT_AVATAR_SVG } from '../services/cloudinaryService'

const IT_TOP_POSITIONS = [
  'Senior Director of Engineering',
  'Vice President of Technology (VP)',
  'Chief Technology Officer (CTO)',
  'Head of Enterprise Platforms',
  'Director of Cloud & DevOps',
  'Principal Engineering Lead',
]

const NON_IT_TOP_POSITIONS = [
  'Vice President of Operations (VP)',
  'Senior Managing Director',
  'Head of Global Operations',
  'Chief Operating Officer (COO)',
  'Executive Director of Strategic Accounts',
  'Head of Corporate Supply & Manufacturing',
]

const RANKING_LEVELS = [
  '⭐ Top Executive (C-Suite / VP)',
  '👑 Senior Leadership Director',
  '🎖️ Principal Department Head',
]

export default function HRDashboard({
  currentUser,
  employees = [],
  loadingEmployees = false,
  onRefreshEmployees,
  onHrLoginSuccess,
}) {
  const [managers, setManagers] = useState([])
  const [loadingManagers, setLoadingManagers] = useState(true)
  // Point 5: Default to managers, no unified monitoring tab
  const [activeTab, setActiveTab] = useState('managers') // 'managers' | 'employees'
  const [mgrSearch, setMgrSearch] = useState('')
  const [empSearch, setEmpSearch] = useState('')
  const [notice, setNotice] = useState(null)
  const [statusTogglingId, setStatusTogglingId] = useState(null)

  // Promote / Elevate Manager Modal State
  const [showPromoteModal, setShowPromoteModal] = useState(false)
  const [selectedMgrId, setSelectedMgrId] = useState('')
  const [promoteForm, setPromoteForm] = useState({
    sector: 'IT',
    department: 'Artificial Intelligence & Machine Learning (AI/ML)', // Domain
    position: 'Senior Director of Engineering',
    ranking: '⭐ Top Executive (C-Suite / VP)',
    salary: '150000',
  })
  const [savingPromotion, setSavingPromotion] = useState(false)

  // In-dashboard HR login form state
  const [hrUser, setHrUser] = useState('admin')
  const [hrPass, setHrPass] = useState('admin')
  const [hrAuthError, setHrAuthError] = useState('')

  // Load managers directly from MySQL database
  async function fetchManagers() {
    setLoadingManagers(true)
    try {
      const data = await getAllManagers()
      setManagers(data)
    } catch (err) {
      console.error('Error fetching managers:', err)
    } finally {
      setLoadingManagers(false)
    }
  }

  useEffect(() => {
    fetchManagers()
  }, [])

  async function handleDirectHrLogin(e) {
    e.preventDefault()
    setHrAuthError('')
    try {
      const session = await loginHR(hrUser, hrPass)
      if (onHrLoginSuccess) {
        onHrLoginSuccess(session)
      }
    } catch (err) {
      setHrAuthError(err.message || 'Invalid HR credentials. Use admin / admin.')
    }
  }

  // Point 7: HR toggles Manager status Active (ON) ↔ Inactive (OFF)
  async function handleToggleStatus(mgr) {
    const mid = mgr.mid || mgr.id
    const currentStatus = mgr.status || 'Active'
    const nextStatus = currentStatus === 'Active' ? 'Inactive' : 'Active'

    setStatusTogglingId(mid)
    try {
      await updateManagerStatus(mid, nextStatus)
      setManagers((prev) =>
        prev.map((m) =>
          String(m.mid || m.id) === String(mid) ? { ...m, status: nextStatus } : m
        )
      )
      setNotice({
        type: 'success',
        text: `Manager "${mgr.name}" status changed to ${nextStatus} (${nextStatus === 'Active' ? 'ON' : 'OFF'}) in MySQL database.`,
      })
    } catch (err) {
      setNotice({
        type: 'error',
        text: err.message || 'Failed to update manager status in database.',
      })
    } finally {
      setStatusTogglingId(null)
    }
  }

  async function handleDeleteManager(mid, mgrName) {
    if (window.confirm(`Are you sure you want to remove Manager "${mgrName}" from the database?`)) {
      try {
        const updated = await deleteManager(mid)
        setManagers(updated)
        setNotice({
          type: 'success',
          text: `Manager "${mgrName}" removed from MySQL database successfully.`,
        })
      } catch (err) {
        setNotice({
          type: 'error',
          text: err.message || 'Failed to remove manager.',
        })
      }
    }
  }

  async function handleDeleteAllManagers() {
    if (
      window.confirm(
        '⚠️ Are you sure you want to delete ALL managers from the MySQL database? This cannot be undone.'
      )
    ) {
      try {
        await deleteAllManagers()
        setManagers([])
        setNotice({
          type: 'success',
          text: 'All managers have been permanently deleted from MySQL database.',
        })
      } catch (err) {
        setNotice({
          type: 'error',
          text: err.message || 'Failed to delete all managers.',
        })
      }
    }
  }

  // Open Promote modal pre-selecting a manager
  function openPromoteModalFor(mgr) {
    const targetMgr = mgr || managers[0]
    if (targetMgr) {
      setSelectedMgrId(String(targetMgr.mid || targetMgr.id))
      setPromoteForm({
        sector: targetMgr.sector || 'IT',
        department: targetMgr.department || 'Artificial Intelligence & Machine Learning (AI/ML)',
        position:
          targetMgr.position ||
          (targetMgr.sector === 'NON-IT' ? NON_IT_TOP_POSITIONS[0] : IT_TOP_POSITIONS[0]),
        ranking: targetMgr.ranking || '⭐ Top Executive (C-Suite / VP)',
        salary: String(targetMgr.salary || 150000),
      })
    }
    setShowPromoteModal(true)
  }

  function handleSelectManagerToPromote(e) {
    const mid = e.target.value
    setSelectedMgrId(mid)
    const mgr = managers.find((m) => String(m.mid || m.id) === String(mid))
    if (mgr) {
      setPromoteForm({
        sector: mgr.sector || 'IT',
        department: mgr.department || 'Artificial Intelligence & Machine Learning (AI/ML)',
        position:
          mgr.position ||
          (mgr.sector === 'NON-IT' ? NON_IT_TOP_POSITIONS[0] : IT_TOP_POSITIONS[0]),
        ranking: mgr.ranking || '⭐ Top Executive (C-Suite / VP)',
        salary: String(mgr.salary || 150000),
      })
    }
  }

  // Save promotion / leadership position & salary to MySQL database
  async function handleSavePromotion(e) {
    e.preventDefault()
    if (!selectedMgrId) {
      alert('Please select a manager to promote.')
      return
    }

    setSavingPromotion(true)
    try {
      const selectedManager = managers.find(
        (m) => String(m.mid || m.id) === String(selectedMgrId)
      )

      await promoteManager(selectedMgrId, {
        sector: promoteForm.sector,
        department: promoteForm.department, // Domain
        position: promoteForm.position,
        ranking: promoteForm.ranking,
        salary: Number(promoteForm.salary) || 0,
      })

      setNotice({
        type: 'success',
        text: `Manager "${selectedManager?.name || 'Selected'}" elevated to ${promoteForm.position} (${promoteForm.ranking}) in MySQL database successfully!`,
      })

      setShowPromoteModal(false)
      await fetchManagers()
    } catch (err) {
      alert(err.message || 'Failed to save promotion in database.')
    } finally {
      setSavingPromotion(false)
    }
  }

  // Filtered managers
  const filteredManagers = useMemo(() => {
    const q = mgrSearch.trim().toLowerCase()
    if (!q) return managers
    return managers.filter(
      (m) =>
        m.name?.toLowerCase().includes(q) ||
        m.gmail?.toLowerCase().includes(q) ||
        m.department?.toLowerCase().includes(q) ||
        m.position?.toLowerCase().includes(q) ||
        String(m.mid || m.id).includes(q)
    )
  }, [managers, mgrSearch])

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    const q = empSearch.trim().toLowerCase()
    if (!q) return employees
    return employees.filter(
      (e) =>
        e.ename?.toLowerCase().includes(q) ||
        e.gmail?.toLowerCase().includes(q) ||
        String(e.eid).includes(q)
    )
  }, [employees, empSearch])

  // Point 8: Metrics including Manager Salary, Employee Salary, and Total Company Payroll
  const metrics = useMemo(() => {
    const managersPayroll = managers.reduce(
      (sum, m) => sum + (Number(m.salary) || 0),
      0
    )
    const employeesPayroll = employees.reduce(
      (sum, e) => sum + (Number(e.salary) || 0),
      0
    )
    const totalCombinedPayroll = managersPayroll + employeesPayroll

    return {
      totalManagers: managers.length,
      totalEmployees: employees.length,
      workforce: managers.length + employees.length,
      managersPayroll,
      employeesPayroll,
      totalCombinedPayroll,
    }
  }, [managers, employees])

  // If not logged in as HR, show the clean Admin Login prompt
  if (currentUser?.role !== 'hr') {
    return (
      <div style={{
        minHeight: 'calc(100vh - 72px)',
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
      }}>
        <div className="admin-login-card">
          <div className="admin-login-header">
            <span className="admin-login-icon">👑</span>
            <h2 className="admin-login-title">Admin Login</h2>
            <p className="admin-login-sub">Sign in to access HR Command Center</p>
          </div>

          {hrAuthError && (
            <Alert type="error" onClose={() => setHrAuthError('')}>
              {hrAuthError}
            </Alert>
          )}

          <form onSubmit={handleDirectHrLogin} className="admin-login-form">
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="dash-hr-user" className="admin-login-label">Username</label>
              <input
                id="dash-hr-user"
                type="text"
                className="admin-login-input"
                placeholder="admin"
                value={hrUser}
                onChange={(e) => setHrUser(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label htmlFor="dash-hr-pass" className="admin-login-label">Password</label>
              <input
                id="dash-hr-pass"
                type="password"
                className="admin-login-input"
                placeholder="••••••••"
                value={hrPass}
                onChange={(e) => setHrPass(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="admin-login-btn">
              Sign In as Admin
            </button>
          </form>
        </div>
      </div>
    )
  }



  return (
    <div className="hr-dashboard">
      {/* Top Banner */}
      <header className="dashboard-banner">
        <div>
          <div className="dashboard-eyebrow">
            👑 HR Command Center • Supervised by <strong>admin</strong>
          </div>
          <h1>HR Executive Oversight Dashboard</h1>
          <p className="dashboard-sub">
            Complete administrative supervision of all registered Managers and company Employees.
          </p>
        </div>

        <div className="dashboard-banner-actions">
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => {
              fetchManagers()
              if (onRefreshEmployees) onRefreshEmployees()
            }}
            disabled={loadingEmployees || loadingManagers}
          >
            {loadingEmployees || loadingManagers ? 'Refreshing...' : '🔄 Refresh Data'}
          </button>
          <button
            type="button"
            className="btn btn-accent btn-small"
            onClick={() => openPromoteModalFor(null)}
          >
            ⭐ Promote / Assign Top Position
          </button>
        </div>
      </header>

      {notice && (
        <Alert type={notice.type} onClose={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      {/* Point 6 & Point 8: KPI Cards (Clean numbers without sub-matter, plus manager/employee payrolls) */}
      <section className="kpi-grid">
        {/* Point 6: Registered Managers without MySQL sub-matter */}
        <div className="kpi-card manager-kpi">
          <div className="kpi-icon">👔</div>
          <div className="kpi-body">
            <span className="kpi-label">Registered Managers</span>
            <span className="kpi-value">{metrics.totalManagers}</span>
          </div>
        </div>

        {/* Point 6: Active Employees without Spring Boot sub-matter */}
        <div className="kpi-card emp-kpi">
          <div className="kpi-icon">👥</div>
          <div className="kpi-body">
            <span className="kpi-label">Active Employees</span>
            <span className="kpi-value">{metrics.totalEmployees}</span>
          </div>
        </div>

        {/* Point 8: Manager Payroll */}
        <div className="kpi-card salary-kpi">
          <div className="kpi-icon">👔</div>
          <div className="kpi-body">
            <span className="kpi-label">Managers Payroll</span>
            <span className="kpi-value">
              ₹{metrics.managersPayroll.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <span className="kpi-note">Paid to {metrics.totalManagers} Managers</span>
          </div>
        </div>

        {/* Point 8: Employees Payroll */}
        <div className="kpi-card salary-kpi">
          <div className="kpi-icon">👥</div>
          <div className="kpi-body">
            <span className="kpi-label">Employees Payroll</span>
            <span className="kpi-value">
              ₹{metrics.employeesPayroll.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <span className="kpi-note">Paid to {metrics.totalEmployees} Employees</span>
          </div>
        </div>

        {/* Point 8: Total Combined Company Payroll */}
        <div className="kpi-card workforce-kpi">
          <div className="kpi-icon">💰</div>
          <div className="kpi-body">
            <span className="kpi-label">Total Company Payroll</span>
            <span className="kpi-value">
              ₹{metrics.totalCombinedPayroll.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <span className="kpi-note">Managers + Employees</span>
          </div>
        </div>
      </section>

      {/* Point 5: View Filter Tabs (Unified Monitoring removed as requested) */}
      <div className="dashboard-tabs">
        <button
          type="button"
          className={`dash-tab ${activeTab === 'managers' ? 'active' : ''}`}
          onClick={() => setActiveTab('managers')}
        >
          👔 Managers Directory ({metrics.totalManagers})
        </button>
        <button
          type="button"
          className={`dash-tab ${activeTab === 'employees' ? 'active' : ''}`}
          onClick={() => setActiveTab('employees')}
        >
          👥 Employees Directory ({metrics.totalEmployees})
        </button>
      </div>

      {/* SECTION 1: MANAGERS DIRECTORY (HR MONITORING) */}
      {activeTab === 'managers' && (
        <section className="dashboard-section card">
          <div className="section-head">
            <div>
              <h2>👔 Registered Managers Directory</h2>
              <p className="subtitle">
                Supervision of all department leads, salaries, and executive leadership.
              </p>
            </div>
            <div className="section-search">
              <input
                type="text"
                placeholder="Search managers by name, email, domain..."
                value={mgrSearch}
                onChange={(e) => setMgrSearch(e.target.value)}
              />
              {mgrSearch && (
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => setMgrSearch('')}
                >
                  Clear
                </button>
              )}
              {managers.length > 0 && (
                <button
                  type="button"
                  className="btn btn-danger btn-small"
                  onClick={handleDeleteAllManagers}
                  title="Delete all managers from database"
                >
                  🗑️ Delete All Managers
                </button>
              )}
            </div>
          </div>

          {loadingManagers ? (
            <Spinner label="Loading managers from MySQL..." />
          ) : (
            <div className="table-wrap">
              <table className="employee-table">
                <thead>
                  <tr>
                    <th>Manager ID</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Phone Number</th>
                    <th>Domain</th>
                    <th>Leadership Position</th>
                    <th>Salary (₹)</th>
                    <th>Status (ON / OFF)</th>
                    <th className="col-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredManagers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="empty-state">
                        {managers.length === 0
                          ? 'No managers found in MySQL database. (All deleted or none registered yet)'
                          : `No managers found matching "${mgrSearch}".`}
                      </td>
                    </tr>
                  ) : (
                    filteredManagers.map((mgr) => {
                      const isActive = (mgr.status || 'Active') === 'Active'
                      const isToggling = statusTogglingId === (mgr.mid || mgr.id)

                      return (
                        <tr key={mgr.mid || mgr.id}>
                          <td>
                            <span className="badge-id">MGR-{mgr.mid || mgr.id}</span>
                          </td>
                          <td>
                            <div className="manager-cell-flex">
                              <img
                                src={mgr.profilePic || DEFAULT_AVATAR_SVG}
                                alt={mgr.name}
                                className="manager-avatar-img"
                              />
                              <strong className="manager-name-text">{mgr.name}</strong>
                            </div>
                          </td>
                          <td>
                            <a href={`mailto:${mgr.gmail}`} className="email-link">
                              {mgr.gmail}
                            </a>
                          </td>
                          <td>{mgr.phoneno}</td>
                          {/* Point 9: Only Domain displayed */}
                          <td>
                            <span className={`sector-tag ${mgr.sector === 'NON-IT' ? 'sector-non-it' : 'sector-it'}`}>
                              {mgr.sector || 'IT'}
                            </span>
                            <div className="dept-sub">{mgr.department}</div>
                          </td>
                          <td>
                            <div className="position-text">
                              <strong>{mgr.position || 'Team Manager'}</strong>
                            </div>
                            {mgr.ranking && (
                              <span className="ranking-badge">{mgr.ranking}</span>
                            )}
                          </td>
                          {/* Point 8: Manager Salary in Table */}
                          <td>
                            <strong className="salary-text">
                              ₹
                              {Number(mgr.salary || 0).toLocaleString('en-IN', {
                                maximumFractionDigits: 0,
                              })}
                            </strong>
                          </td>
                          {/* Point 7: Interactive Active / Inactive Status Switch (ON / OFF) */}
                          <td>
                            <button
                              type="button"
                              className={`status-toggle-btn ${isActive ? 'status-btn-on' : 'status-btn-off'}`}
                              onClick={() => handleToggleStatus(mgr)}
                              disabled={isToggling}
                              title="Click to toggle status Active/Inactive in database"
                            >
                              <span className="toggle-dot" />
                              <span>{isActive ? 'Active (ON)' : 'Inactive (OFF)'}</span>
                            </button>
                          </td>
                          <td className="col-actions">
                            <button
                              type="button"
                              className="btn btn-small btn-primary"
                              onClick={() => openPromoteModalFor(mgr)}
                              title="Assign top position"
                              style={{ marginRight: '6px' }}
                            >
                              ⭐ Promote
                            </button>
                            <button
                              type="button"
                              className="btn btn-small btn-danger"
                              onClick={() => handleDeleteManager(mgr.mid || mgr.id, mgr.name)}
                              title="Remove manager"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* SECTION 2: EMPLOYEES DIRECTORY (HR MONITORING) */}
      {activeTab === 'employees' && (
        <section className="dashboard-section card">
          <div className="section-head">
            <div>
              <h2>👥 Company Employees Directory</h2>
              <p className="subtitle">
                Live employee records monitored by HR (retrieved directly from Spring Boot &amp; MySQL).
              </p>
            </div>
            <div className="section-search">
              <input
                type="text"
                placeholder="Search employees by ID, name, email..."
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
              />
              {empSearch && (
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => setEmpSearch('')}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {loadingEmployees ? (
            <Spinner label="Loading employee records..." />
          ) : (
            <div className="table-wrap">
              <table className="employee-table">
                <thead>
                  <tr>
                    <th>Emp ID (eid)</th>
                    <th>Full Name</th>
                    <th>Age</th>
                    <th>Salary</th>
                    <th>Email</th>
                    <th>Phone Number</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="empty-state">
                        {employees.length === 0
                          ? 'No employee records found in MySQL database.'
                          : `No employees matching "${empSearch}".`}
                      </td>
                    </tr>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <tr key={emp.eid}>
                        <td>
                          <span className="badge-id">EMP-{emp.eid}</span>
                        </td>
                        <td>
                          <strong>{emp.ename}</strong>
                        </td>
                        <td>{emp.age} yrs</td>
                        <td>
                          <strong className="salary-text">
                            ₹
                            {Number(emp.salary || 0).toLocaleString('en-IN', {
                              maximumFractionDigits: 0,
                            })}
                          </strong>
                        </td>
                        <td>
                          <a href={`mailto:${emp.gmail}`} className="email-link">
                            {emp.gmail}
                          </a>
                        </td>
                        <td>{emp.phoneno}</td>
                        <td>
                          <span className="status-badge status-active">
                            Employed
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Modal: Elevate Existing Manager to Top Position (Point 9: Only Domain, Point 8: Salary) */}
      {showPromoteModal && (
        <div className="modal-backdrop">
          <div className="modal" style={{ maxWidth: '480px' }}>
            <h3>⭐ Elevate Manager to Top Position</h3>
            <p>Assign senior leadership, VP, or director rank and update salary in database.</p>

            <form onSubmit={handleSavePromotion}>
              {/* Select Existing Registered Manager */}
              <div className="form-group">
                <label>Select Registered Manager *</label>
                <select
                  value={selectedMgrId}
                  onChange={handleSelectManagerToPromote}
                  required
                >
                  <option value="">-- Choose a Manager --</option>
                  {managers.map((m) => (
                    <option key={m.mid || m.id} value={m.mid || m.id}>
                      {m.name} ({m.sector || 'IT'} - {m.position || 'Manager'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Sector (IT vs NON-IT) */}
              <div className="form-group">
                <label>Sector (IT or NON-IT)</label>
                <select
                  value={promoteForm.sector}
                  onChange={(e) => {
                    const sec = e.target.value
                    setPromoteForm({
                      ...promoteForm,
                      sector: sec,
                      position: sec === 'NON-IT' ? NON_IT_TOP_POSITIONS[0] : IT_TOP_POSITIONS[0],
                    })
                  }}
                >
                  <option value="IT">IT</option>
                  <option value="NON-IT">NON-IT</option>
                </select>
              </div>

              {/* Point 9: Only Domain (Department removed) */}
              <div className="form-group">
                <label>Domain *</label>
                <input
                  type="text"
                  required
                  value={promoteForm.department}
                  onChange={(e) =>
                    setPromoteForm({ ...promoteForm, department: e.target.value })
                  }
                  placeholder="e.g. Artificial Intelligence & Machine Learning (AI/ML)"
                />
              </div>

              {/* Top Position to Assign */}
              <div className="form-group">
                <label>Top Leadership Position *</label>
                <select
                  value={promoteForm.position}
                  onChange={(e) =>
                    setPromoteForm({ ...promoteForm, position: e.target.value })
                  }
                  required
                >
                  {promoteForm.sector === 'NON-IT'
                    ? NON_IT_TOP_POSITIONS.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))
                    : IT_TOP_POSITIONS.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                </select>
              </div>

              {/* Leadership Ranking Level */}
              <div className="form-group">
                <label>Executive Ranking Level</label>
                <select
                  value={promoteForm.ranking}
                  onChange={(e) =>
                    setPromoteForm({ ...promoteForm, ranking: e.target.value })
                  }
                >
                  {RANKING_LEVELS.map((rank) => (
                    <option key={rank} value={rank}>
                      {rank}
                    </option>
                  ))}
                </select>
              </div>

              {/* Point 8: Manager Salary Field in Promotion Modal */}
              <div className="form-group">
                <label>Updated Salary (₹) *</label>
                <input
                  type="number"
                  required
                  value={promoteForm.salary}
                  onChange={(e) =>
                    setPromoteForm({ ...promoteForm, salary: e.target.value })
                  }
                  placeholder="e.g. 180000"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPromoteModal(false)}
                  disabled={savingPromotion}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingPromotion}
                >
                  {savingPromotion ? 'Saving in Database...' : 'Save Promotion to Database'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
