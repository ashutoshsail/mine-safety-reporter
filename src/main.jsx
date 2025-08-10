import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AppProvider } from './context/AppContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ConfigProvider } from './context/ConfigContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ConfigProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </ConfigProvider>
    </AuthProvider>
  </React.StrictMode>,
)
