import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Layout from './components/dashboard/Layout';
import Homepage from './components/dashboard/Calendar';
import HolisticAssistant from './components/Pages/HolisticAssist';
import Permissions from './components/Pages/permissions';

const App: React.FC = () => {
  return (
    <BrowserRouter>
        <Routes>
          {/* <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/register" element={<Register />} /> */}
          <Route element={<Layout />}>
          <Route path="/" element={<Homepage/>} />
          <Route path="/holistic" element={<HolisticAssistant />} />
          <Route path="/permissions" element={<Permissions />} /> 
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
          
        </Routes>
    </BrowserRouter>
  );
};

export default App;