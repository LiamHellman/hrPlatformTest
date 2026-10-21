import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  LayoutDashboard,
  LayoutGrid,
  List,
  Mail,
  MapPin,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Sprout,
  Users,
  X,
} from 'lucide-react'
import {
  departments,
  statuses,
  dateOffset,
  loadData,
  STORAGE_KEY,
  type AppData,
  type Department,
  type Employee,
  type EmployeeStatus,
  type LeaveRequest,
} from './data'

type View = 'Overview' | 'People' | 'Time off'
type ModalState =
  | { type: 'employee'; employee?: Employee }
  | { type: 'profile'; id: string }
  | { type: 'leave' }
  | { type: 'help' }
  | null
type Filters = { search: string; department: string; status: string }
const shortDate = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')

function Avatar({
  employee,
  large = false,
}: {
  employee: Employee
  large?: boolean
}) {
  return (
    <span
      aria-hidden="true"
      className={`avatar color-${employee.color}${large ? ' avatar-large' : ''}`}
    >
      {initials(employee.name)}
    </span>
  )
}
function Badge({ status }: { status: string }) {
  return (
    <span
      className={`badge badge-${status.toLowerCase().replaceAll(' ', '-')}`}
    >
      <span />
      {status}
    </span>
  )
}
function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <span className="select-wrap">
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
      <ChevronDown size={14} aria-hidden="true" />
    </span>
  )
}
function Modal({
  title,
  subtitle,
  children,
  close,
  wide = false,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  close: () => void
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current!
    const opener = document.activeElement as HTMLElement | null
    dialog.showModal()
    dialog.querySelector<HTMLElement>('form input, form select')?.focus()
    return () => {
      dialog.close()
      opener?.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className={`modal${wide ? ' modal-wide' : ''}`}
      aria-labelledby="modal-title"
      onCancel={close}
      onClick={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <div className="modal-header">
        <div>
          <h2 id="modal-title">{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={close}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  )
}

function EmployeeForm({
  employee,
  employees,
  save,
  close,
}: {
  employee?: Employee
  employees: Employee[]
  save: (employee: Employee) => void
  close: () => void
}) {
  const [error, setError] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const get = (key: string) => String(values.get(key) ?? '').trim()
    if (['name', 'email', 'role', 'location'].some((key) => !get(key))) {
      setError('Please complete all required fields.')
      return
    }
    if (
      employees.some(
        (person) =>
          person.id !== employee?.id &&
          person.email.toLowerCase() === get('email').toLowerCase(),
      )
    ) {
      setError('A person with this email address already exists.')
      return
    }
    save({
      id: employee?.id ?? crypto.randomUUID(),
      name: get('name'),
      email: get('email').toLowerCase(),
      role: get('role'),
      department: get('department') as Department,
      status: get('status') as EmployeeStatus,
      location: get('location'),
      workType: get('workType') as Employee['workType'],
      startDate: get('startDate'),
      color: employee?.color ?? employees.length % 6,
    })
  }
  return (
    <form onSubmit={submit} className="form">
      <div className="form-grid">
        <label className="full-width">
          Full name
          <input
            name="name"
            required
            maxLength={100}
            defaultValue={employee?.name}
            placeholder="e.g. Taylor Chen"
            autoComplete="name"
            autoFocus
          />
        </label>
        <label className="full-width">
          Work email
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            defaultValue={employee?.email}
            placeholder="taylor@company.com"
            autoComplete="email"
          />
        </label>
        <label>
          Job title
          <input
            name="role"
            required
            maxLength={100}
            defaultValue={employee?.role}
            placeholder="Product Designer"
          />
        </label>
        <label>
          Department
          <select
            name="department"
            defaultValue={employee?.department ?? 'Design'}
          >
            {departments.map((department) => (
              <option key={department}>{department}</option>
            ))}
          </select>
        </label>
        <label>
          Location
          <input
            name="location"
            required
            maxLength={100}
            defaultValue={employee?.location}
            placeholder="Toronto, CA"
          />
        </label>
        <label>
          Employment type
          <select
            name="workType"
            defaultValue={employee?.workType ?? 'Full-time'}
          >
            <option>Full-time</option>
            <option>Contractor</option>
          </select>
        </label>
        <label>
          Start date
          <input
            name="startDate"
            type="date"
            required
            defaultValue={employee?.startDate ?? dateOffset(0)}
          />
        </label>
        <label>
          Status
          <select name="status" defaultValue={employee?.status ?? 'Onboarding'}>
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button type="button" className="button secondary" onClick={close}>
          Cancel
        </button>
        <button className="button primary" type="submit">
          {employee ? 'Save changes' : 'Add person'}
          <Check size={16} />
        </button>
      </div>
    </form>
  )
}

function LeaveForm({
  employees,
  save,
  close,
}: {
  employees: Employee[]
  save: (request: LeaveRequest) => void
  close: () => void
}) {
  const [error, setError] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const startDate = String(values.get('startDate'))
    const endDate = String(values.get('endDate'))
    if (endDate < startDate) {
      setError('End date must be on or after the start date.')
      return
    }
    save({
      id: crypto.randomUUID(),
      employeeId: String(values.get('employeeId')),
      type: String(values.get('type')) as LeaveRequest['type'],
      startDate,
      endDate,
      status: 'Pending',
    })
  }
  return (
    <form className="form" onSubmit={submit}>
      <div className="form-grid">
        <label className="full-width">
          Person
          <select required name="employeeId">
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.name}
              </option>
            ))}
          </select>
        </label>
        <label className="full-width">
          Leave type
          <select name="type">
            <option>Vacation</option>
            <option>Personal</option>
            <option>Sick leave</option>
          </select>
        </label>
        <label>
          Start date
          <input
            type="date"
            name="startDate"
            required
            defaultValue={dateOffset(1)}
          />
        </label>
        <label>
          End date
          <input
            type="date"
            name="endDate"
            required
            defaultValue={dateOffset(1)}
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <button type="button" className="button secondary" onClick={close}>
          Cancel
        </button>
        <button className="button primary">
          Submit request
          <ArrowRight size={16} />
        </button>
      </div>
    </form>
  )
}

export default function App() {
  const [initial] = useState(loadData)
  const [data, setData] = useState<AppData>(initial.data)
  const [warning, setWarning] = useState(initial.warning)
  const [view, setView] = useState<View>('People')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [modal, setModal] = useState<ModalState>(null)
  const [toast, setToast] = useState('')
  const [filters, setFilters] = useState<Filters>({
    search: '',
    department: '',
    status: '',
  })
  const [layout, setLayout] = useState<'list' | 'grid'>('list')
  const [sort, setSort] = useState('default')
  const [page, setPage] = useState(1)
  const [leaveFilter, setLeaveFilter] = useState('All requests')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const { employees, requests } = data
  const pendingCount = requests.filter(
    (request) => request.status === 'Pending',
  ).length
  const activeCount = employees.filter(
    (employee) => employee.status === 'Active',
  ).length
  const onboardingCount = employees.filter(
    (employee) => employee.status === 'Onboarding',
  ).length
  const leaveCount = employees.filter(
    (employee) => employee.status === 'On leave',
  ).length
  const filtered = employees
    .filter((employee) => {
      const search = filters.search.trim().toLowerCase()
      return (
        (!search ||
          `${employee.name} ${employee.role} ${employee.email} ${employee.location}`
            .toLowerCase()
            .includes(search)) &&
        (!filters.department || employee.department === filters.department) &&
        (!filters.status || employee.status === filters.status)
      )
    })
    .sort((a, b) =>
      sort === 'name'
        ? a.name.localeCompare(b.name)
        : sort === 'recent'
          ? b.startDate.localeCompare(a.startDate)
          : 0,
    )
  const pageCount = Math.max(1, Math.ceil(filtered.length / 8))
  const currentPage = Math.min(page, pageCount)
  const visible = filtered.slice((currentPage - 1) * 8, currentPage * 8)
  const profile =
    modal?.type === 'profile'
      ? employees.find((employee) => employee.id === modal.id)
      : undefined
  const close = () => {
    setModal(null)
    setDeleteConfirm(false)
  }
  const navigate = (next: View) => {
    setView(next)
    setMobileMenu(false)
  }
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 4000)
    return () => clearTimeout(timer)
  }, [toast])
  function update(next: AppData, message: string) {
    setData(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      setWarning('')
      setToast(message)
    } catch {
      setWarning(
        'Your browser could not save this change. It is available in this session, but may be lost when you reload.',
      )
      setToast('Updated for this session')
    }
  }
  function filter(key: keyof Filters, value: string) {
    setFilters((previous) => ({ ...previous, [key]: value }))
    setPage(1)
  }
  function saveEmployee(employee: Employee) {
    const exists = employees.some((person) => person.id === employee.id)
    update(
      {
        ...data,
        employees: exists
          ? employees.map((person) =>
              person.id === employee.id ? employee : person,
            )
          : [...employees, employee],
      },
      exists ? 'Profile updated' : `${employee.name} added to your people`,
    )
    close()
  }
  function exportPeople() {
    const cell = (value: string) =>
      `"${(/^[=+\-@\t\r]/.test(value) ? "'" : '') + value.replaceAll('"', '""')}"`
    const rows = [
      [
        'Name',
        'Email',
        'Role',
        'Department',
        'Status',
        'Location',
        'Employment type',
        'Start date',
      ],
      ...filtered.map((person) => [
        person.name,
        person.email,
        person.role,
        person.department,
        person.status,
        person.location,
        person.workType,
        person.startDate,
      ]),
    ]
    const url = URL.createObjectURL(
      new Blob(
        ['\uFEFF' + rows.map((row) => row.map(cell).join(',')).join('\r\n')],
        { type: 'text/csv;charset=utf-8;' },
      ),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = 'people-directory.csv'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setToast(
      `Exported ${filtered.length} ${filtered.length === 1 ? 'person' : 'people'}`,
    )
  }

  const stats = [
    {
      title: 'Total people',
      value: employees.length,
      note: `Across ${new Set(employees.map((employee) => employee.department)).size} departments`,
      icon: Users,
      color: 'green',
    },
    {
      title: 'Active people',
      value: activeCount,
      note: 'Making things happen',
      icon: Sparkles,
      color: 'purple',
    },
    {
      title: 'On leave',
      value: leaveCount,
      note: 'Taking a little time to recharge',
      icon: CalendarDays,
      color: 'peach',
    },
    {
      title: 'Onboarding',
      value: onboardingCount,
      note: 'A new chapter starts here',
      icon: Sprout,
      color: 'yellow',
    },
  ]

  return (
    <div className="app-shell">
      {mobileMenu && (
        <button
          className="sidebar-overlay"
          aria-label="Close navigation"
          onClick={() => setMobileMenu(false)}
        />
      )}
      <aside className={`sidebar${mobileMenu ? ' sidebar-open' : ''}`}>
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault()
            navigate('Overview')
          }}
        >
          <span className="brand-symbol">
            <Sprout size={25} strokeWidth={1.7} />
          </span>
          people<span className="brand-amp">&</span>co
          <span className="brand-dot">.</span>
        </a>
        <div className="workspace">
          <span className="workspace-icon">P</span>
          <div>
            <strong>People & Co.</strong>
            <small>Our little workspace</small>
          </div>
          <span className="workspace-dot" title="Local workspace" />
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {(
            [
              ['Overview', LayoutDashboard],
              ['People', Users],
              ['Time off', CalendarDays],
            ] as const
          ).map(([name, Icon]) => (
            <button
              key={name}
              className={`nav-item${view === name ? ' selected' : ''}`}
              aria-current={view === name ? 'page' : undefined}
              onClick={() => navigate(name)}
            >
              <Icon size={19} strokeWidth={1.7} />
              <span>{name}</span>
              {name === 'People' && <small>{employees.length}</small>}
              {name === 'Time off' && pendingCount > 0 && (
                <small className="pending-count">{pendingCount}</small>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="growth-card">
            <div className="growth-illustration" aria-hidden="true">
              <span />
              <span />
              <span />
              <Sprout size={56} strokeWidth={1} />
            </div>
            <strong>
              Good people.
              <br />
              Great things.
            </strong>
            <p>A little care goes a long way.</p>
          </div>
          <button
            className="nav-item help-button"
            onClick={() => setModal({ type: 'help' })}
          >
            <CircleHelp size={19} strokeWidth={1.7} />
            <span>Workspace guide</span>
            <ArrowUpRight size={15} />
          </button>
          <div className="account">
            <span className="account-avatar">LH</span>
            <div>
              <strong>Liam Hellman</strong>
              <small>Workspace admin</small>
            </div>
            <span className="online-dot" title="Admin workspace" />
          </div>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-toggle"
              onClick={() => setMobileMenu(true)}
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{view}</strong>
          </div>
          <div className="topbar-right">
            <span className="today">
              <CalendarDays size={15} />
              {new Date().toLocaleDateString('en-CA', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span className="topbar-divider" />
            <button
              className="review-button"
              onClick={() => navigate('Time off')}
              aria-label={`${pendingCount} pending time-off requests`}
            >
              <Clock3 size={18} />
              {pendingCount > 0 && <span />}
            </button>
            <span className="small-account" aria-label="Liam Hellman">
              LH
            </span>
          </div>
        </header>
        <main id="main-content">
          {warning && (
            <div className="warning" role="alert">
              {warning}
            </div>
          )}
          <section className="page-heading">
            <div>
              <p className="eyebrow">
                {view === 'People'
                  ? 'THE HEART OF YOUR WORKSPACE'
                  : view === 'Overview'
                    ? 'A LITTLE PERSPECTIVE'
                    : 'ROOM TO RECHARGE'}
              </p>
              <h1>
                {view === 'People'
                  ? 'Your people, together.'
                  : view === 'Overview'
                    ? 'Good things start with people.'
                    : 'A little time for yourself.'}
                <span className="heading-spark">✳</span>
              </h1>
              <p className="page-description">
                {view === 'People'
                  ? 'A place for everyone. Keep your team connected and growing.'
                  : view === 'Overview'
                    ? 'A thoughtful look at your team and everything happening around them.'
                    : 'Plan time away, review requests, and make space for a healthy balance.'}
              </p>
            </div>
            <div className="heading-actions">
              {view === 'People' && (
                <button className="button secondary" onClick={exportPeople}>
                  <ArrowDownToLine size={16} />
                  Export
                </button>
              )}
              <button
                className="button primary"
                onClick={() =>
                  setModal(
                    view === 'Time off'
                      ? { type: 'leave' }
                      : { type: 'employee' },
                  )
                }
                disabled={view === 'Time off' && employees.length === 0}
              >
                <Plus size={18} />
                {view === 'Time off' ? 'Request time off' : 'Add person'}
              </button>
            </div>
          </section>

          <section className="stats-grid" aria-label="Team statistics">
            {stats.map(({ title, value, note, icon: Icon, color }) => (
              <article className="stat-card" key={title}>
                <div className="stat-top">
                  <span>{title}</span>
                  <span className={`stat-icon ${color}`}>
                    <Icon size={18} strokeWidth={1.7} />
                  </span>
                </div>
                <strong className="stat-value">
                  {String(value).padStart(2, '0')}
                </strong>
                <p>
                  <span className={`tiny-dot ${color}`} />
                  {note}
                </p>
              </article>
            ))}
          </section>

          {view === 'People' && (
            <section
              className="directory panel"
              aria-label="Employee directory"
            >
              <div className="panel-heading">
                <div className="section-title">
                  <h2>All the right people</h2>
                  <span className="count-pill">{employees.length} people</span>
                </div>
                <span className="section-hint">A team worth knowing.</span>
              </div>
              <div
                className="directory-tabs"
                role="group"
                aria-label="Employee status"
              >
                {[
                  ['', 'Everyone', employees.length],
                  ['Active', 'Active', activeCount],
                  ['Onboarding', 'Onboarding', onboardingCount],
                  ['On leave', 'On leave', leaveCount],
                ].map(([value, label, count]) => (
                  <button
                    key={value}
                    className={filters.status === value ? 'tab active' : 'tab'}
                    aria-pressed={filters.status === value}
                    onClick={() => filter('status', String(value))}
                  >
                    {label}
                    <span>{count}</span>
                  </button>
                ))}
              </div>
              <div className="directory-toolbar">
                <label className="search-input">
                  <Search size={18} />
                  <input
                    type="search"
                    aria-label="Search people"
                    placeholder="Search by name, role, or location…"
                    value={filters.search}
                    onChange={(event) => filter('search', event.target.value)}
                  />
                  <span className="search-hint">Find your people</span>
                </label>
                <div className="filter-controls">
                  <Select
                    label="Filter by department"
                    value={filters.department}
                    onChange={(value) => filter('department', value)}
                  >
                    <option value="">All departments</option>
                    {departments.map((department) => (
                      <option key={department}>{department}</option>
                    ))}
                  </Select>
                  <Select
                    label="Sort people"
                    value={sort}
                    onChange={(value) => {
                      setSort(value)
                      setPage(1)
                    }}
                  >
                    <option value="default">Default order</option>
                    <option value="name">Name A–Z</option>
                    <option value="recent">Newest starters</option>
                  </Select>
                  <div
                    className="view-toggle"
                    role="group"
                    aria-label="Directory layout"
                  >
                    <button
                      className={layout === 'list' ? 'active' : ''}
                      aria-label="List view"
                      aria-pressed={layout === 'list'}
                      onClick={() => setLayout('list')}
                    >
                      <List size={17} />
                    </button>
                    <button
                      className={layout === 'grid' ? 'active' : ''}
                      aria-label="Grid view"
                      aria-pressed={layout === 'grid'}
                      onClick={() => setLayout('grid')}
                    >
                      <LayoutGrid size={16} />
                    </button>
                  </div>
                </div>
              </div>
              {visible.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">
                    <Search size={26} />
                  </span>
                  <h3>
                    {employees.length
                      ? 'No people found'
                      : 'Your team starts here'}
                  </h3>
                  <p>
                    {employees.length
                      ? 'Try a different name or give your filters a little room.'
                      : 'Add your first person to start building your directory.'}
                  </p>
                  <button
                    className="button secondary"
                    onClick={() =>
                      employees.length
                        ? (setFilters({
                            search: '',
                            department: '',
                            status: '',
                          }),
                          setPage(1))
                        : setModal({ type: 'employee' })
                    }
                  >
                    {employees.length
                      ? 'Clear filters'
                      : 'Add your first person'}
                  </button>
                </div>
              ) : layout === 'list' ? (
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Status</th>
                        <th scope="col">Role & department</th>
                        <th scope="col">Location</th>
                        <th scope="col">Start date</th>
                        <th scope="col">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((employee) => (
                        <tr key={employee.id}>
                          <td>
                            <button
                              className="person-link"
                              onClick={() =>
                                setModal({ type: 'profile', id: employee.id })
                              }
                            >
                              <Avatar employee={employee} />
                              <span>
                                <strong>{employee.name}</strong>
                                <small>{employee.email}</small>
                              </span>
                            </button>
                          </td>
                          <td>
                            <Badge status={employee.status} />
                          </td>
                          <td>
                            <span className="role-name">{employee.role}</span>
                            <span className="department-label">
                              {employee.department}
                            </span>
                          </td>
                          <td>
                            <span className="location">
                              <MapPin size={13} />
                              {employee.location}
                            </span>
                            <small className="employment-type">
                              {employee.workType}
                            </small>
                          </td>
                          <td className="date-cell">
                            {shortDate(employee.startDate)}
                          </td>
                          <td>
                            <button
                              className="icon-button"
                              aria-label={`View ${employee.name}`}
                              onClick={() =>
                                setModal({ type: 'profile', id: employee.id })
                              }
                            >
                              <MoreHorizontal size={19} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="people-grid">
                  {visible.map((employee) => (
                    <button
                      className="person-card"
                      key={employee.id}
                      onClick={() =>
                        setModal({ type: 'profile', id: employee.id })
                      }
                    >
                      <div className="person-card-top">
                        <Avatar employee={employee} large />
                        <ArrowUpRight size={17} />
                      </div>
                      <h3>{employee.name}</h3>
                      <p>{employee.role}</p>
                      <span className="department-chip">
                        {employee.department}
                      </span>
                      <div className="person-card-bottom">
                        <Badge status={employee.status} />
                        <span>
                          <MapPin size={12} />
                          {employee.location.split(',')[0]}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="pagination">
                <p>
                  Showing{' '}
                  <strong>
                    {filtered.length ? (currentPage - 1) * 8 + 1 : 0}–
                    {Math.min(currentPage * 8, filtered.length)}
                  </strong>{' '}
                  of <strong>{filtered.length}</strong> people
                </p>
                <div>
                  <button
                    className="button pagination-button"
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <span className="page-number">
                    {currentPage}
                    <span> / {pageCount}</span>
                  </span>
                  <button
                    className="button pagination-button"
                    disabled={currentPage === pageCount}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </section>
          )}

          {view === 'Overview' && (
            <div className="overview-grid">
              <section className="panel department-panel">
                <div className="panel-heading">
                  <div>
                    <h2>A team with many talents</h2>
                    <p className="muted">
                      Good things happen across departments.
                    </p>
                  </div>
                  <span className="stat-icon green">
                    <Users size={19} />
                  </span>
                </div>
                <div className="department-bars">
                  {departments.map((department) => {
                    const count = employees.filter(
                      (employee) => employee.department === department,
                    ).length
                    return (
                      <div key={department}>
                        <div>
                          <strong>{department}</strong>
                          <span>
                            {count} {count === 1 ? 'person' : 'people'}
                          </span>
                        </div>
                        <div className="bar-track">
                          <span
                            style={{
                              width: `${employees.length ? (count / employees.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
              <section className="overview-note">
                <span className="note-icon">
                  <Sprout size={30} strokeWidth={1.5} />
                </span>
                <p className="eyebrow">MAKE THEIR FIRST DAY COUNT</p>
                <h2>
                  New faces.
                  <br />
                  Fresh possibilities.
                </h2>
                <p>
                  {onboardingCount
                    ? `${onboardingCount} ${onboardingCount === 1 ? 'person is' : 'people are'} settling in. A warm welcome makes all the difference.`
                    : 'Every great team starts with a hello. Make room for someone new.'}
                </p>
                <button
                  className="button secondary"
                  onClick={() => {
                    filter('status', 'Onboarding')
                    navigate('People')
                  }}
                >
                  Meet your new starters
                  <ArrowRight size={17} />
                </button>
              </section>
              <section className="panel recent-panel">
                <div className="panel-heading">
                  <div>
                    <h2>The latest hellos</h2>
                    <p className="muted">Your most recent team members.</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => navigate('People')}
                  >
                    View all
                    <ArrowRight size={15} />
                  </button>
                </div>
                {[...employees]
                  .sort((a, b) => b.startDate.localeCompare(a.startDate))
                  .slice(0, 4)
                  .map((employee) => (
                    <button
                      className="recent-person"
                      key={employee.id}
                      onClick={() =>
                        setModal({ type: 'profile', id: employee.id })
                      }
                    >
                      <Avatar employee={employee} />
                      <span>
                        <strong>{employee.name}</strong>
                        <small>{employee.role}</small>
                      </span>
                      <span className="recent-date">
                        {shortDate(employee.startDate)}
                      </span>
                      <ArrowUpRight size={16} />
                    </button>
                  ))}
                {employees.length === 0 && (
                  <p className="empty-state">
                    Add your first person to get started.
                  </p>
                )}
              </section>
              <section className="panel review-panel">
                <div className="panel-heading">
                  <h2>A little on your radar</h2>
                  <Clock3 size={20} />
                </div>
                <strong className="review-number">
                  {String(pendingCount).padStart(2, '0')}
                </strong>
                <h3>Time-off requests</h3>
                <p className="muted">
                  {pendingCount
                    ? 'A little time away is waiting for your okay.'
                    : 'All caught up. There are no requests waiting for review.'}
                </p>
                <button
                  className="text-button"
                  onClick={() => navigate('Time off')}
                >
                  Review requests
                  <ArrowRight size={16} />
                </button>
              </section>
            </div>
          )}

          {view === 'Time off' && (
            <section className="panel leave-panel">
              <div className="panel-heading">
                <div className="section-title">
                  <h2>Time well spent</h2>
                  <span className="count-pill">{pendingCount} pending</span>
                </div>
                <Select
                  label="Filter time-off requests"
                  value={leaveFilter}
                  onChange={setLeaveFilter}
                >
                  <option>All requests</option>
                  <option>Pending</option>
                  <option>Approved</option>
                  <option>Declined</option>
                </Select>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Person</th>
                      <th>Leave type</th>
                      <th>Dates</th>
                      <th>Status</th>
                      <th>Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests
                      .filter(
                        (request) =>
                          leaveFilter === 'All requests' ||
                          request.status === leaveFilter,
                      )
                      .map((request) => {
                        const employee = employees.find(
                          (person) => person.id === request.employeeId,
                        )!
                        return (
                          <tr key={request.id}>
                            <td>
                              <button
                                className="person-link"
                                onClick={() =>
                                  setModal({ type: 'profile', id: employee.id })
                                }
                              >
                                <Avatar employee={employee} />
                                <span>
                                  <strong>{employee.name}</strong>
                                  <small>{employee.department}</small>
                                </span>
                              </button>
                            </td>
                            <td>{request.type}</td>
                            <td className="date-cell">
                              {shortDate(request.startDate)}
                              <span className="date-range-separator">→</span>
                              {shortDate(request.endDate)}
                            </td>
                            <td>
                              <Badge status={request.status} />
                            </td>
                            <td>
                              {request.status === 'Pending' ? (
                                <div className="leave-actions">
                                  <button
                                    className="approve-button"
                                    aria-label={`Approve ${employee.name}'s request`}
                                    onClick={() =>
                                      update(
                                        {
                                          ...data,
                                          requests: requests.map((item) =>
                                            item.id === request.id
                                              ? { ...item, status: 'Approved' }
                                              : item,
                                          ),
                                        },
                                        'Time-off request approved',
                                      )
                                    }
                                  >
                                    <Check size={16} />
                                    Approve
                                  </button>
                                  <button
                                    className="icon-button decline-button"
                                    aria-label={`Decline ${employee.name}'s request`}
                                    onClick={() =>
                                      update(
                                        {
                                          ...data,
                                          requests: requests.map((item) =>
                                            item.id === request.id
                                              ? { ...item, status: 'Declined' }
                                              : item,
                                          ),
                                        },
                                        'Time-off request declined',
                                      )
                                    }
                                  >
                                    <X size={17} />
                                  </button>
                                </div>
                              ) : (
                                <span className="muted">Reviewed</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
              {requests.filter(
                (request) =>
                  leaveFilter === 'All requests' ||
                  request.status === leaveFilter,
              ).length === 0 && (
                <div className="empty-state">
                  <span className="empty-icon">
                    <CalendarDays size={28} />
                  </span>
                  <h3>Nothing on the calendar</h3>
                  <p>
                    No{' '}
                    {leaveFilter === 'All requests'
                      ? ''
                      : leaveFilter.toLowerCase()}{' '}
                    requests to show.
                  </p>
                </div>
              )}
              <div className="leave-footnote">
                <CircleHelp size={15} />
                Approving a request records the decision. Update a person's
                status in their profile when their leave begins.
              </div>
            </section>
          )}

          <footer className="page-footer">
            <span>
              <Sprout size={14} />A little more human. A lot more together.
            </span>
            <span>
              People & Co. <span className="footer-dot">·</span> Sample
              workspace
            </span>
          </footer>
        </main>
      </div>

      {modal?.type === 'employee' && (
        <Modal
          title={
            modal.employee
              ? 'A little profile refresh.'
              : 'Make room for someone great.'
          }
          subtitle={
            modal.employee
              ? 'Keep their details up to date.'
              : 'A new face. A fresh perspective. Add them to your people.'
          }
          close={close}
          wide
        >
          <EmployeeForm
            employee={modal.employee}
            employees={employees}
            save={saveEmployee}
            close={close}
          />
        </Modal>
      )}
      {modal?.type === 'leave' && (
        <Modal
          title="Make a little space."
          subtitle="Send a time-off request for review."
          close={close}
        >
          <LeaveForm
            employees={employees}
            close={close}
            save={(request) => {
              update(
                { ...data, requests: [request, ...requests] },
                'Time-off request submitted',
              )
              close()
            }}
          />
        </Modal>
      )}
      {modal?.type === 'profile' && profile && (
        <Modal title="A person worth knowing." close={close}>
          <div className="profile-heading">
            <Avatar employee={profile} large />
            <h3>{profile.name}</h3>
            <p>{profile.role}</p>
            <Badge status={profile.status} />
          </div>
          <dl className="profile-details">
            <div>
              <dt>
                <Mail size={15} />
                Work email
              </dt>
              <dd>
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
              </dd>
            </div>
            <div>
              <dt>Department</dt>
              <dd>{profile.department}</dd>
            </div>
            <div>
              <dt>
                <MapPin size={15} />
                Location
              </dt>
              <dd>{profile.location}</dd>
            </div>
            <div>
              <dt>Employment type</dt>
              <dd>{profile.workType}</dd>
            </div>
            <div>
              <dt>Start date</dt>
              <dd>{shortDate(profile.startDate)}</dd>
            </div>
          </dl>
          <div className="profile-actions">
            {deleteConfirm ? (
              <div className="delete-confirm">
                <p>Remove {profile.name} and their time-off requests?</p>
                <button
                  className="button danger"
                  onClick={() => {
                    update(
                      {
                        employees: employees.filter(
                          (employee) => employee.id !== profile.id,
                        ),
                        requests: requests.filter(
                          (request) => request.employeeId !== profile.id,
                        ),
                      },
                      `${profile.name} removed`,
                    )
                    close()
                  }}
                >
                  Yes, remove person
                </button>
                <button
                  className="text-button"
                  onClick={() => setDeleteConfirm(false)}
                >
                  Keep person
                </button>
              </div>
            ) : (
              <>
                <button
                  className="text-button danger-text"
                  onClick={() => setDeleteConfirm(true)}
                >
                  Remove person
                </button>
                <button
                  className="button primary"
                  onClick={() =>
                    setModal({ type: 'employee', employee: profile })
                  }
                >
                  <SlidersHorizontal size={16} />
                  Edit profile
                </button>
              </>
            )}
          </div>
        </Modal>
      )}
      {modal?.type === 'help' && (
        <Modal
          title="Welcome to your workspace."
          subtitle="A little guide to getting started."
          close={close}
        >
          <div className="help-content">
            <p>
              <strong>People</strong> is your team directory. Search, filter,
              open a profile, or add someone new. Switch between list and card
              views, and export the current results to CSV.
            </p>
            <p>
              <strong>Overview</strong> brings together team sizes, new
              starters, and requests that need a decision.
            </p>
            <p>
              <strong>Time off</strong> is where you submit requests and approve
              or decline them.
            </p>
            <p className="help-callout">
              This starter includes fictional sample data. Changes stay in this
              browser. Accounts, shared storage, and access controls have not
              been connected yet.
            </p>
            <button className="button primary" onClick={close}>
              Make yourself at home
              <ArrowRight size={16} />
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={15} />
          </span>
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast('')}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
