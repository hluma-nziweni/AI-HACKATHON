import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Layout from './components/dashboard/Layout';
// import Homepage from './components/dashboard/Calendar';
import HolisticAssistant from './components/Pages/HolisticAssist';
import LandingPage from './components/landingPage';
import SignIn from './components/signIn';
import SignUp from './components/signUp';

const App: React.FC = () => {
  return (
    <BrowserRouter>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/" element={<LandingPage/>} />
          <Route element={<Layout />}>
          {/* <Route path="/" element={<Homepage/>} /> */}
          
          <Route path="/holistic" element={<HolisticAssistant />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    </BrowserRouter>
  );
};

export default App;