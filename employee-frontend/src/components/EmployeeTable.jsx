const numberFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 })

export default function EmployeeTable({ employees, editingId, onEdit, onDelete, emptyMessage }) {
  if (employees.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>
  }

  return (
    <div className="table-wrap">
      <table className="employee-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Age</th>
            <th>Salary</th>
            <th>Email</th>
            <th>Phone</th>
            <th className="col-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr key={emp.eid} className={emp.eid === editingId ? 'row-editing' : ''}>
              <td data-label="ID">{emp.eid}</td>
              <td data-label="Name">{emp.ename}</td>
              <td data-label="Age">{emp.age ?? '-'}</td>
              <td data-label="Salary">{emp.salary != null ? numberFormat.format(emp.salary) : '-'}</td>
              <td data-label="Email">{emp.gmail}</td>
              <td data-label="Phone">{emp.phoneno ?? '-'}</td>
              <td data-label="Actions" className="col-actions">
                <button type="button" className="btn btn-small btn-secondary" onClick={() => onEdit(emp)}>
                  Edit
                </button>
                <button type="button" className="btn btn-small btn-danger" onClick={() => onDelete(emp)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
