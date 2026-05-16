import React, { useState } from 'react';
import Login from './components/Login';
import Interview from './components/Interview';
import AdminDashboard from './components/AdminDashboard';

function App() {
    const [user, setUser] = useState(null);
    const [isAdminMode, setIsAdminMode] = useState(false);

    const handleLoginSuccess = (userData) => {
        console.log("Login Success. User Data:", userData);
        // Robust check for Admin Role
        if (userData.role?.toLowerCase() === 'admin') {
            setIsAdminMode(true);
        } else {
            setIsAdminMode(false);
        }
        setUser(userData);
    };

    const handleLogout = () => {
        setUser(null);
        setIsAdminMode(false);
    };

    return (
        <div className="min-h-screen">
            {!user ? (
                <Login onLoginSuccess={handleLoginSuccess} />
            ) : isAdminMode ? (
                <AdminDashboard onBack={handleLogout} />
            ) : (
                <Interview user={user} onLogout={handleLogout} />
            )}
        </div>
    );
}

export default App;
