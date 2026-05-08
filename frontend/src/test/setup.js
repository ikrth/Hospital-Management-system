import '@testing-library/jest-dom'
import { vi } from 'vitest'

vi.mock('../api/apiClient', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  }
}))

// Also mock by project-alias/module-id that vitest may resolve to
vi.mock('src/api/apiClient', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: {} })),
    post: vi.fn(() => Promise.resolve({ data: {} })),
  }
}))

// Global mocks for API modules so components can be imported safely in tests
vi.mock('../api/doctors', () => ({
  getDoctors: vi.fn(() => Promise.resolve({ data: { data: [] } })),
  getDoctorSlots: vi.fn(() => Promise.resolve({ data: { data: [] } })),
}))

vi.mock('../api/appointments', () => ({
  getAppointments: vi.fn(() => Promise.resolve({ data: { data: [], pagination: {} } })),
  createAppointment: vi.fn(() => Promise.resolve({ data: {} })),
  cancelAppointment: vi.fn(() => Promise.resolve({ data: {} })),
}))

// stub window helpers used by components
if (typeof globalThis.alert === 'undefined') {
  vi.stubGlobal('alert', vi.fn())
}
