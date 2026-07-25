// Centralised session management — all auth-related localStorage access goes through here.

const SESSION_KEYS = [
    'jwtToken',
    'userRole',
    'currentCompanyId',
    'institutionName',
    'applicantName',
    'applicantEmail',
    'licenseType',
    'examinerUsername',
    'examinerEmployeeId',
    'examinerDesignation'
];

const APPLICANT_ROLE = 'applicant';
const STAFF_ROLES = ['examiner', 'senior_be'];

export const getToken = () => localStorage.getItem('jwtToken');

export const getRole = () => localStorage.getItem('userRole');

export const isAuthenticated = () => Boolean(getToken() && getRole());

export const hasRole = (role) => {
    const current = getRole();
    if (!current) return false;
    if (Array.isArray(role)) return role.includes(current);
    return current === role;
};

export const isApplicant = () => getRole() === APPLICANT_ROLE;

export const isStaff = () => STAFF_ROLES.includes(getRole());

export const clearSession = () => {
    // Best-effort server-side revoke. Fire-and-forget so logout still completes
    // even if the backend is offline. The Authorization header is auto-added
    // by the axios interceptor (which reads from localStorage), so we MUST kick
    // this off before wiping the token below.
    const token = localStorage.getItem('jwtToken');
    if (token) {
        try {
            fetch('/api/auth/logout', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                keepalive: true,
            }).catch(() => { /* network error — token still gets cleared locally */ });
        } catch (_) { /* fetch unavailable in this environment */ }
    }

    SESSION_KEYS.forEach(k => localStorage.removeItem(k));
    try {
        sessionStorage.removeItem('pendingEmail');
        sessionStorage.removeItem('pendingPassword');
    } catch (_) {
        /* sessionStorage may be unavailable in some embedded contexts */
    }
};

export const loginRouteFor = (role) => {
    if (STAFF_ROLES.includes(role)) return '/staff-login';
    return '/login';
};

export const dashboardRouteFor = (role) => {
    if (role === 'examiner') return '/examiner';
    if (role === 'senior_be') return '/senior_be';
    return '/applicant';
};
