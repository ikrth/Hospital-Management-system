import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import Therapy from './Therapy'

vi.mock('../api/ai', () => ({
  triageSymptoms: vi.fn().mockResolvedValue({
    data: {
      recommendedSpecialty: 'Psychiatry',
      appointmentType: 'therapy',
      priorityLevel: 'medium',
      priorityScore: 5,
    },
  }),
  sendTherapistMessage: vi.fn().mockResolvedValue({
    data: { reply: 'If you are in crisis, call 988.' },
  }),
}))

vi.mock('../api/doctors', () => ({
  getDoctors: vi.fn().mockResolvedValue({ data: { data: [] } }),
  getDoctorSlots: vi.fn(),
}))

vi.mock('../api/appointments', () => ({
  createAppointment: vi.fn(),
}))

vi.mock('../api/patients', () => ({
  getMyProfile: vi.fn(),
}))

const renderWithProviders = (ui) => {
  const client = new QueryClient()
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Therapy', () => {
  it('shows reply bubble and crisis banner', async () => {
    renderWithProviders(<Therapy />)

    fireEvent.change(screen.getByPlaceholderText(/type your message/i), {
      target: { value: 'I feel anxious' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send/i }))

    expect(
      await screen.findByText(/If you are in crisis, please call 988/i)
    ).toBeInTheDocument()
  })
})
