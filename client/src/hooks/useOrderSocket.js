import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext.jsx'

export function useOrderSocket(onUpdate) {
  const { user } = useAuth()

  useEffect(() => {
    if (!user || typeof onUpdate !== 'function') return

    // Vite proxy handles /socket.io forwarding with credentials
    const socket = io({
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })

    socket.on('order:update', (payload) => {
      onUpdate(payload)
    })

    return () => {
      socket.off('order:update')
      socket.disconnect()
    }
  }, [user, onUpdate])
}

export default useOrderSocket

