import { useState } from 'react'
import { validateSearch } from '../utils/validation'

export default function SearchBar({ onSearch, onClear, searching, isSearchActive }) {
  const [mode, setMode] = useState('id') // 'id' | 'email'
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const message = validateSearch(mode, value)
    setError(message)
    if (!message) onSearch(mode, value.trim())
  }

  function handleClear() {
    setValue('')
    setError('')
    onClear()
  }

  function changeMode(next) {
    setMode(next)
    setValue('')
    setError('')
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit} noValidate>
      <div className="search-row">
        <select
          aria-label="Search by"
          value={mode}
          onChange={(e) => changeMode(e.target.value)}
          disabled={searching}
        >
          <option value="id">Search by ID</option>
          <option value="email">Search by Email</option>
        </select>

        <input
          type={mode === 'id' ? 'text' : 'email'}
          inputMode={mode === 'id' ? 'numeric' : 'email'}
          aria-label={mode === 'id' ? 'Employee ID' : 'Employee email'}
          aria-invalid={Boolean(error)}
          placeholder={mode === 'id' ? 'e.g. 1' : 'e.g. name@example.com'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={searching}
        />

        <button type="submit" className="btn btn-primary" disabled={searching}>
          {searching ? 'Searching...' : 'Search'}
        </button>
        {isSearchActive && (
          <button type="button" className="btn btn-secondary" onClick={handleClear} disabled={searching}>
            Show all
          </button>
        )}
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </form>
  )
}
