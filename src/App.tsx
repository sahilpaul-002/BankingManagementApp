
import { Outlet } from 'react-router'
import './App.css'

function App() {

  return (
    <>
      <div className="application-container bg-[var(--color-800)] w-screen min-h-screen">
        <Outlet />
      </div>
    </>
  )
}

export default App
