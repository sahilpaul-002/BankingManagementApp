
import { Outlet } from 'react-router'
import './App.css'

function App() {

  return (
    <>
      <div className="application-container bg-[var(--color-100)] w-[100vw] h-[100vh]">
        <Outlet />
      </div>
    </>
  )
}

export default App
