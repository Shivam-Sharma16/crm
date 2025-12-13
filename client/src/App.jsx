import React from 'react'
import {MainRoutes} from './routes/Mainroutes'
import './App.css'

const App = () => {
  return (
   <div style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>

     <MainRoutes />
   </div>
  )
}

export default App