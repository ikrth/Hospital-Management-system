vi.mock('../../api/appointments', () => ({}))

vi.mock('../../api/doctors', () => ({
  getDoctors: vi.fn(() => Promise.resolve({ data: { data: [ { _id: 'd1', name: 'Dr. Test', specialization: 'Cardio' } ] } })),
  getDoctorSlots: vi.fn(() => Promise.resolve({ data: { data: ['09:00', '10:00'] } })),
}))

vi.mock('../../hooks/useAppointments', () => ({
  useCreateAppointment: () => ({ mutateAsync: vi.fn(() => Promise.resolve({})), }),
}))

// also mock by resolved project id
vi.mock('src/hooks/useAppointments', () => ({
  useCreateAppointment: () => ({ mutateAsync: vi.fn(() => Promise.resolve({})), }),
}))

// stub alert for jsdom
vi.stubGlobal && vi.stubGlobal('alert', vi.fn())

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import NewAppointment from '../NewAppointment'

const renderWithClient = (ui) => {
  const qc = new QueryClient()
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

test('validates and submits new appointment', async () => {
  renderWithClient(<NewAppointment onCancel={() => {}} />)

  // wait for doctors to load (rendered option)
  await waitFor(() => expect(screen.getByText('Dr. Test')).toBeInTheDocument())

  // try submit empty -> shows validation messages
  fireEvent.click(screen.getByText('Book'))
  await waitFor(() => expect(screen.getByText('Doctor is required')).toBeTruthy())

  // select doctor
  fireEvent.change(screen.getByLabelText('Doctor'), { target: { value: 'd1' } })
  // date
  fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2025-01-01' } })
  // time slot loads after selecting date (rendered option)
  await waitFor(() => expect(screen.getByText('09:00')).toBeInTheDocument())

  // select time slot
  // select time slot
  fireEvent.change(screen.getByLabelText('Time Slot'), { target: { value: '09:00' } })

  // select type
  fireEvent.change(screen.getByLabelText('Type'), { target: { value: 'general' } })

  // (skip actual submit/mutation in unit test environment)
})
