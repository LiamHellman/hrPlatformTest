export const departments = [
  'Design',
  'Engineering',
  'Marketing',
  'Operations',
  'People',
] as const
export const statuses = ['Active', 'On leave', 'Onboarding'] as const
export type Department = (typeof departments)[number]
export type EmployeeStatus = (typeof statuses)[number]
export type Employee = {
  id: string
  name: string
  email: string
  role: string
  department: Department
  status: EmployeeStatus
  location: string
  workType: 'Full-time' | 'Contractor'
  startDate: string
  color: number
}
export type LeaveRequest = {
  id: string
  employeeId: string
  type: 'Vacation' | 'Personal' | 'Sick leave'
  startDate: string
  endDate: string
  status: 'Pending' | 'Approved' | 'Declined'
}
export type AppData = { employees: Employee[]; requests: LeaveRequest[] }
export const STORAGE_KEY = 'people-and-co.v1'

export function dateOffset(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const names: [string, string, Department, EmployeeStatus, string][] = [
  ['Olivia Rhye', 'Product Designer', 'Design', 'Active', 'Toronto, CA'],
  ['Phoenix Baker', 'Engineering Lead', 'Engineering', 'Active', 'Austin, US'],
  ['Lana Steiner', 'People Partner', 'People', 'Active', 'Toronto, CA'],
  ['Demi Wilkinson', 'Brand Designer', 'Design', 'On leave', 'London, UK'],
  ['Drew Cano', 'Frontend Engineer', 'Engineering', 'Active', 'Vancouver, CA'],
  ['Natali Craig', 'Marketing Manager', 'Marketing', 'Active', 'New York, US'],
  [
    'Orlando Diggs',
    'Operations Manager',
    'Operations',
    'Active',
    'Toronto, CA',
  ],
  ['Andi Lane', 'Content Strategist', 'Marketing', 'Onboarding', 'London, UK'],
  ['Kate Morrison', 'UX Researcher', 'Design', 'Active', 'Berlin, DE'],
  [
    'Koray Okumus',
    'Backend Engineer',
    'Engineering',
    'Active',
    'Amsterdam, NL',
  ],
  ['Sienna Hewitt', 'Talent Specialist', 'People', 'Onboarding', 'Toronto, CA'],
  ['Alex Morgan', 'Finance Associate', 'Operations', 'Active', 'Austin, US'],
]

export function seedData(): AppData {
  return {
    employees: names.map(
      ([name, role, department, status, location], index) => ({
        id: `person-${index + 1}`,
        name,
        role,
        department,
        status,
        location,
        email: `${name.toLowerCase().replaceAll(' ', '.')}@people.example`,
        workType: index === 8 ? 'Contractor' : 'Full-time',
        startDate: dateOffset(
          index === 7 || index === 10 ? -3 : -400 + index * 23,
        ),
        color: index % 6,
      }),
    ),
    requests: [
      {
        id: 'leave-1',
        employeeId: 'person-1',
        type: 'Vacation',
        startDate: dateOffset(7),
        endDate: dateOffset(11),
        status: 'Pending',
      },
      {
        id: 'leave-2',
        employeeId: 'person-5',
        type: 'Personal',
        startDate: dateOffset(3),
        endDate: dateOffset(3),
        status: 'Pending',
      },
      {
        id: 'leave-3',
        employeeId: 'person-4',
        type: 'Vacation',
        startDate: dateOffset(-2),
        endDate: dateOffset(2),
        status: 'Approved',
      },
    ],
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
function isEmployee(value: unknown): value is Employee {
  if (!isRecord(value)) return false
  return (
    ['id', 'name', 'email', 'role', 'location', 'startDate'].every(
      (key) => typeof value[key] === 'string',
    ) &&
    departments.includes(value.department as Department) &&
    statuses.includes(value.status as EmployeeStatus) &&
    ['Full-time', 'Contractor'].includes(value.workType as string) &&
    Number.isInteger(value.color) &&
    Number(value.color) >= 0 &&
    Number(value.color) < 6
  )
}
function isRequest(value: unknown): value is LeaveRequest {
  return (
    isRecord(value) &&
    ['id', 'employeeId', 'startDate', 'endDate'].every(
      (key) => typeof value[key] === 'string',
    ) &&
    ['Vacation', 'Personal', 'Sick leave'].includes(value.type as string) &&
    ['Pending', 'Approved', 'Declined'].includes(value.status as string)
  )
}
export function loadData(): { data: AppData; warning: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { data: seedData(), warning: '' }
    const parsed: unknown = JSON.parse(raw)
    if (
      !isRecord(parsed) ||
      !Array.isArray(parsed.employees) ||
      !parsed.employees.every(isEmployee) ||
      !Array.isArray(parsed.requests) ||
      !parsed.requests.every(isRequest)
    )
      throw new Error('Invalid saved data')
    const ids = new Set(parsed.employees.map((employee) => employee.id))
    if (
      ids.size !== parsed.employees.length ||
      parsed.requests.some((request) => !ids.has(request.employeeId))
    )
      throw new Error('Invalid references')
    return {
      data: { employees: parsed.employees, requests: parsed.requests },
      warning: '',
    }
  } catch {
    return {
      data: seedData(),
      warning:
        'Saved data could not be loaded. Sample people are shown; changes are not saved until you choose to save them.',
    }
  }
}
