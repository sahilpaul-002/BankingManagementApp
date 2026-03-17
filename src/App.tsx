
import { Outlet } from 'react-router'
import './App.css'

function App() {

  return (
    <>
      <div className="application-container bg-[var(--color-800)] min-w-[99vw] min-h-screen">
        <Outlet />
      </div>
    </>
  )
}

export default App
