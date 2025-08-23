import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { DataProvider } from './context/DataContext.jsx'
import { UIProvider } from './context/UIContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ConfigProvider } from './context/ConfigContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ConfigProvider>
        <UIProvider>
          <DataProvider>
            <App />
          </DataProvider>
        </UIProvider>
      </ConfigProvider>
    </AuthProvider>
  </React.StrictMode>,
)