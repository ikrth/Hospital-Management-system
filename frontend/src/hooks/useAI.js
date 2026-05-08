import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { triageSymptoms, therapistChat } from '../api/ai'

export const useTriage = () => {
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const mutation = useMutation({
    mutationFn: triageSymptoms,
    onSuccess: (data) => {
      setResult(data?.data || data)
      setError(null)
    },
    onError: (err) => {
      setError(err)
    },
  })

  const analyze = async (payload) => {
    return mutation.mutateAsync(payload)
  }

  const reset = () => {
    setResult(null)
    setError(null)
    mutation.reset()
  }

  return {
    analyze,
    result,
    isLoading: mutation.isPending,
    error,
    reset,
  }
}

export const useTherapist = () => {
  const [reply, setReply] = useState(null)
  const [error, setError] = useState(null)

  const mutation = useMutation({
    mutationFn: therapistChat,
    onSuccess: (data) => {
      const payload = data?.data || data
      setReply(payload?.reply || payload)
      setError(null)
    },
    onError: (err) => {
      setError(err)
    },
  })

  const sendMessage = async (message, history) => {
    return mutation.mutateAsync({ message, conversationHistory: history })
  }

  const reset = () => {
    setReply(null)
    setError(null)
    mutation.reset()
  }

  return {
    sendMessage,
    reply,
    isLoading: mutation.isPending,
    error,
    reset,
  }
}
