import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getToken, getRole, loginRouteFor } from '../services/session';

/**
 * Route guard. Redirects unauthenticated users to the appropriate login page,
 * and prevents role mismatches (e.g. an applicant hitting /examiner).
 */
const RequireAuth = ({ allow, children }) => {
    const location = useLocation();
    const token = getToken();
    const role = getRole();
    const allowed = Array.isArray(allow) ? allow : [allow];

    if (!token || !role) {
        const target = loginRouteFor(allowed[0]);
        return <Navigate to={target} state={{ from: location }} replace />;
    }

    if (!allowed.includes(role)) {
        // Authenticated but for a different role — push them to their own dashboard.
        if (role === 'applicant') return <Navigate to="/applicant" replace />;
        if (role === 'examiner') return <Navigate to="/examiner" replace />;
        if (role === 'senior_be') return <Navigate to="/senior_be" replace />;
        return <Navigate to="/" replace />;
    }

    return children;
};

export default RequireAuth;
