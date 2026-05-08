export const formatDate = (value) => {
  if (!value) return ''
  const date = new Date(value)
  return date.toLocaleDateString()
}

export const formatTime = (value) => value || ''
