import { ToastContainer } from "react-toastify"
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes"
import { App as AntApp } from "antd";

import { LeadsContextProvider } from './context/LeadsContext';
const App = () => {
  return (
    <BrowserRouter>
      <AntApp>
        <LeadsContextProvider>
          <AppRoutes />
        </LeadsContextProvider>

        <ToastContainer position="top-right" autoClose={1000} theme="colored" />
      </AntApp>
    </BrowserRouter>
  )
}

export default App