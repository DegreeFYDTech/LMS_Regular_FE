import React, { useState, createContext } from 'react';

export const LeadsContext = createContext();

export const LeadsContextProvider = ({ children }) => {
    const [leads, setLeads] = useState([]);
    return (
        <LeadsContext.Provider value={{ leads, setLeads }}>
            {children}
        </LeadsContext.Provider>
    );
};
