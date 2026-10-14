import { useState, useMemo } from 'react'
import EmployeeForm from './EmployeeForm'
import EmployeeTable from './EmployeeTable'
import SearchBar from './SearchBar'
import Spinner from './Spinner'
import Alert from './Alert'
import ConfirmDialog from './ConfirmDialog'
import { toPayload } from '../utils/validation'
import { getErrorMessage, isNotFound } from '../utils/errors'
import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
  deleteAllEmployees,
  getEmployeeById,
  getEmployeeByEmail,
} from '../api/employeeApi'
import { DEFAULT_AVATAR_SVG } from '../services/cloudinaryService'

export default function EmployeeManagementView({
  currentUser,
  employees,
  loading,
  listError,
  loadEmployees,
  onNavigate,
}) {
  const [searchResult, setSearchResult] = useState(null)
  const [searching, setSearching] = useState(false)
  const [notice, setNotice] = useState(null)
  const [formError, setFormError] = useState('')
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [formVersion, setFormVersion] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)

  // Compute stats
  const stats = useMemo(() => {
    const salaries = employees
      .map((e) => Number(e.salary))
      .filter(Number.isFinite)

    const ages = employees
      .map((e) => Number(e.age))
      .filter(Number.isFinite)

    const average = (values) =>
      values.length
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : 0

    return {
      count: employees.length,
      avgSalary: average(salaries),
      avgAge: average(ages),
    }
  }, [employees])

  async function handleSearch(mode, value) {
    setSearching(true)
    setNotice(null)

    const label = mode === 'id' ? `ID ${value}` : `email "${value}"`

    try {
      const employee =
        mode === 'id'
          ? await getEmployeeById(value)
          : await getEmployeeByEmail(value)

      setSearchResult({
        label,
        items: employee ? [employee] : [],
        notFound: !employee,
      })
    } catch (err) {
      if (isNotFound(err)) {
        setSearchResult({ label, items: [], notFound: true })
      } else {
        setNotice({
          type: 'error',
          text: getErrorMessage(err, 'search for employee'),
        })
      }
    } finally {
      setSearching(false)
    }
  }

  function clearSearch() {
    setSearchResult(null)
  }

  async function handleSave(values) {
    setSaving(true)
    setFormError('')
    setNotice(null)

    const payload = toPayload(values)

    try {
      if (editing) {
        await updateEmployee(editing.eid, payload)
        setNotice({
          type: 'success',
          text: `Employee #${editing.eid} updated successfully.`,
        })
      } else {
        const created = await createEmployee(payload)
        setNotice({
          type: 'success',
          text: `Employee "${created.ename}" added successfully.`,
        })
      }

      setEditing(null)
      setFormVersion((version) => version + 1)
      setSearchResult(null)
      await loadEmployees()
    } catch (err) {
      setFormError(
        getErrorMessage(err, editing ? 'update employee' : 'add employee')
      )
    } finally {
      setSaving(false)
    }
  }

  function startEdit(employee) {
    setEditing(employee)
    setFormError('')
    setNotice(null)

    document
      .getElementById('employee-form')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function cancelEdit() {
    setEditing(null)
    setFormError('')
  }

  async function confirmDelete() {
    if (!deleteTarget) return

    setDeleting(true)

    try {
      await deleteEmployee(deleteTarget.eid)

      setNotice({
        type: 'success',
        text: `Employee "${deleteTarget.ename}" deleted successfully.`,
      })

      if (editing?.eid === deleteTarget.eid) {
        setEditing(null)
      }

      setSearchResult(null)
      setDeleteTarget(null)
      await loadEmployees()
    } catch (err) {
      setNotice({
        type: 'error',
        text: getErrorMessage(err, 'delete employee'),
      })
    } finally {
      setDeleting(false)
    }
  }

  async function confirmDeleteAll() {
    setDeletingAll(true)

    try {
      await deleteAllEmployees()

      setNotice({
        type: 'success',
        text: 'All employees deleted successfully.',
      })

      setEditing(null)
      setSearchResult(null)
      setDeleteAllOpen(false)
      await loadEmployees()
    } catch (err) {
      setNotice({
        type: 'error',
        text: getErrorMessage(err, 'delete all employees'),
      })
    } finally {
      setDeletingAll(false)
    }
  }

  // Not logged in check
  if (!currentUser) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-icon-badge">🔒</div>
            <h2>Manager Authentication Required</h2>
            <p className="auth-subtitle">
              Only authorized managers can manage employees. Please register or log in first.
            </p>
          </div>
          <div className="portal-card-footer" style={{ marginTop: '20px' }}>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => onNavigate('login')}
            >
              Go to Manager Login &rarr;
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-block"
              onClick={() => onNavigate('register')}
              style={{ marginTop: '10px' }}
            >
              Register New Manager &rarr;
            </button>
          </div>
        </div>
      </div>
    )
  }

  const visibleEmployees = searchResult ? searchResult.items : employees
  const emptyMessage = searchResult?.notFound
    ? `No employee found with ${searchResult.label}.`
    : 'No employees yet. Use the form to add your first employee.'

  return (
    <div className="employee-management-view">
      {/* Executive Manager Workspace Banner */}
      <div className="manager-workspace-banner">
        <div className="manager-profile-banner-left">
          <div className="manager-banner-avatar-wrap">
            <img
              src={currentUser.user?.profilePic || DEFAULT_AVATAR_SVG}
              alt={currentUser.user?.name || 'Manager'}
              className="manager-banner-avatar"
            />
            <span className="manager-online-dot" title="Active Session" />
          </div>

          <div className="manager-banner-info">
            <div className="manager-banner-eyebrow">
              <span className="mgr-badge">
                {currentUser.role === 'hr' ? '👑 Corporate Admin' : '👔 Verified Manager'}
              </span>
              {currentUser.user?.sector && (
                <span className={`sector-tag ${currentUser.user.sector === 'NON-IT' ? 'sector-non-it' : 'sector-it'}`}>
                  {currentUser.user.sector}
                </span>
              )}
              {currentUser.user?.ranking && (
                <span className="ranking-badge">{currentUser.user.ranking}</span>
              )}
            </div>

            <h2>
              {currentUser.role === 'hr'
                ? 'Corporate Employee Directory'
                : `Welcome, ${currentUser.user?.name || 'Manager'}!`}
            </h2>

            <p className="manager-banner-domain">
              🏢 <strong>Domain:</strong> {currentUser.user?.department || 'Operations Management'}
              {currentUser.user?.position && ` • ${currentUser.user.position}`}
            </p>
          </div>
        </div>

        <div className="manager-banner-actions">
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={loadEmployees}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Data'}
          </button>
        </div>
      </div>

      {notice && (
        <Alert type={notice.type} onClose={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      {/* Executive KPI Stats Grid */}
      <section className="manager-stats-grid" aria-label="Summary">
        <div className="manager-stat-card stat-card-workforce">
          <div className="stat-card-icon">👥</div>
          <div className="stat-card-content">
            <span className="stat-card-value">{stats.count}</span>
            <span className="stat-card-label">Managed Employees</span>
          </div>
        </div>

        <div className="manager-stat-card stat-card-payroll">
          <div className="stat-card-icon">💰</div>
          <div className="stat-card-content">
            <span className="stat-card-value">
              ₹{stats.avgSalary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <span className="stat-card-label">Average Team Salary</span>
          </div>
        </div>

        <div className="manager-stat-card stat-card-experience">
          <div className="stat-card-icon">🎯</div>
          <div className="stat-card-content">
            <span className="stat-card-value">{stats.avgAge.toFixed(1)} yrs</span>
            <span className="stat-card-label">Average Team Age</span>
          </div>
        </div>

        <div className="manager-stat-card stat-card-status">
          <div className="stat-card-icon">⚡</div>
          <div className="stat-card-content">
            <span className="stat-card-value">Live Sync</span>
            <span className="stat-card-label">MySQL Database</span>
          </div>
        </div>
      </section>

      {/* Form + Table Layout */}
      <main className="layout">
        <aside>
          <EmployeeForm
            key={`${editing ? `edit-${editing.eid}` : 'create'}-${formVersion}`}
            employee={editing}
            saving={saving}
            formError={formError}
            onSubmit={handleSave}
            onCancel={cancelEdit}
          />
        </aside>

        <section className="employee-list">
          <div className="list-head">
            <h2>Employees Directory</h2>

            <button
              type="button"
              className="btn btn-small btn-danger"
              onClick={() => setDeleteAllOpen(true)}
              disabled={loading || employees.length === 0}
            >
              Delete All
            </button>
          </div>

          <SearchBar
            onSearch={handleSearch}
            onClear={clearSearch}
            searching={searching}
          />

          {searchResult && (
            <p className="search-note">
              Showing search result for {searchResult.label}.
            </p>
          )}

          {loading ? (
            <Spinner label="Loading employees..." />
          ) : listError ? (
            <div className="list-error">
              <Alert type="error">{listError}</Alert>
              <button
                type="button"
                className="btn btn-primary"
                onClick={loadEmployees}
              >
                Try again
              </button>
            </div>
          ) : (
            <EmployeeTable
              employees={visibleEmployees}
              editingId={editing?.eid}
              onEdit={startEdit}
              onDelete={setDeleteTarget}
              emptyMessage={emptyMessage}
            />
          )}
        </section>
      </main>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete employee?"
          message={`Are you sure you want to delete ${deleteTarget.ename} (ID ${deleteTarget.eid})? This cannot be undone.`}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {deleteAllOpen && (
        <ConfirmDialog
          title="Delete ALL employees?"
          message={`This will permanently delete all ${employees.length} employees. This cannot be undone.`}
          confirmLabel="Delete all"
          busy={deletingAll}
          onConfirm={confirmDeleteAll}
          onCancel={() => setDeleteAllOpen(false)}
        />
      )}
    </div>
  )
}
