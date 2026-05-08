import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import AITriage from './AITriage'

vi.mock('../api/ai', () => ({
  checkOllamaHealth: vi.fn().mockResolvedValue({ isOnline: true }),
  triageSymptoms: vi.fn().mockResolvedValue({
    data: {
      recommendedSpecialty: 'Cardiology',
      priorityLevel: 'high',
      urgencyMessage: 'Seek care immediately.',
      reasoning: 'High risk symptoms.',
      redFlags: ['chest pain'],
      appointmentType: 'emergency',
      priorityScore: 9,
    },
  }),
}))

vi.mock('../api/doctors', () => ({
  getDoctors: vi.fn().mockResolvedValue({
    data: {
      data: [{ _id: 'doc1', specialization: 'Cardiology', user: { name: 'Doc' } }],
    },
  }),
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

describe('AITriage', () => {
  it('shows analysis results after analyze', async () => {
    renderWithProviders(<AITriage />)

    fireEvent.change(screen.getByLabelText(/symptom/i), {
      target: { value: 'chest pain' },
    })
    fireEvent.click(screen.getByRole('button', { name: /add/i }))

    fireEvent.change(screen.getByLabelText(/age/i), { target: { value: '45' } })
    fireEvent.change(screen.getByLabelText(/gender/i), { target: { value: 'male' } })

    fireEvent.click(screen.getByRole('button', { name: /analyze/i }))

    const matches = await screen.findAllByText(/cardiology/i)
    expect(matches.length).toBeGreaterThan(0)
    const highs = screen.getAllByText(/high/i)
    expect(highs.length).toBeGreaterThan(0)
  })
})
