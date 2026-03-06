import axios from "axios"

// const IDLE_TIMEOUT = 10 * 1000   // 10 seconds
const IDLE_TIMEOUT = 30 * 60 * 1000
let idleTimer

export const startIdleTimer = () => {

  const resetTimer = () => {

    clearTimeout(idleTimer)

    idleTimer = setTimeout(async () => {

      try {
        await axios.get("/api/check-session")
      } catch (err) {
        // interceptor will handle
      }

    }, IDLE_TIMEOUT)

  }

  ["mousemove","keydown","click","scroll"].forEach(event =>
    window.addEventListener(event, resetTimer)
  )

  resetTimer()
}