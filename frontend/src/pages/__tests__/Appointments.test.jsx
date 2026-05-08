import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import Appointments from '../Appointments'

vi.mock('../../api/appointments', () => ({
  getAppointments: vi.fn(() => Promise.resolve({ data: { data: [
    { _id: '1', doctor: { name: 'Dr. A' }, date: '2025-01-01', timeSlot: '09:00', status: 'pending' },
    { _id: '2', doctor: { name: 'Dr. B' }, date: '2025-01-02', timeSlot: '10:00', status: 'confirmed' }
  ], pagination: { totalPages: 1 } } })),
  cancelAppointment: vi.fn(() => Promise.resolve({}))
}))

const renderWithClient = (ui) => {
  const qc = new QueryClient()
  return render(
    <BrowserRouter>
      <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
    </BrowserRouter>
  )
}

test('renders appointment cards and cancels', async () => {
  const { getByText } = renderWithClient(<Appointments />)

  await waitFor(() => expect(screen.getByText('Dr. A')).toBeTruthy())

  expect(screen.getByText('Dr. A')).toBeInTheDocument()
  expect(screen.getByText('Dr. B')).toBeInTheDocument()

  // click cancel on first
  const cancelBtn = screen.getAllByText('Cancel')[0]
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  fireEvent.click(cancelBtn)

  await waitFor(() => expect(window.confirm).toHaveBeenCalled())
})
