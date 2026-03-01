import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { Button, Badge } from 'react-bootstrap';
import Sidebar from './components/Sidebar';
import CircularProgress from './components/CircularProgress';
import DirectorVetting from './components/DirectorVetting';
import CompanyProfile from './components/CompanyProfile';
import Stage2Ownership from './components/Stage2Ownership';
import ApplicationForm from './components/ApplicationForm';
import CapitalStructure from './components/CapitalStructure';
import ProductsAndServices from './components/ProductsAndServices';
import FinancialProjections from './components/FinancialProjections';
import GrowthAndDevelopment from './components/GrowthAndDevelopment';
import Stage9DocumentsUpload from './components/Stage9DocumentsUpload';
import ReportGeneration from './components/ReportGeneration';
import LoginSelection from './components/LoginSelection';
import ApplicantLanding from './components/ApplicantLanding';
import ApplicantAuth from './components/ApplicantAuth';
import DashboardApplicant from './components/DashboardApplicant';
import DashboardSenior from './components/DashboardSenior';
import DashboardExaminer from './components/DashboardExaminer';
import ExaminerInstitutionReview from './components/ExaminerInstitutionReview';
import ReviewControlPanel from './components/ReviewControlPanel';
import WorkflowStatusPanel from './components/WorkflowStatusPanel';
import ApplicationChat from './components/ApplicationChat';

// --- CORE WIZARD COMPONENT ---
const WizardLayout = ({ userRole, companyData, setCompanyData }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Define Stages based on Role
  let stages = [
    { id: 1, name: 'Company Profile', component: CompanyProfile },
    { id: 2, name: 'Ownership Structure', component: Stage2Ownership },
    { id: 3, name: 'Directors & Governance', component: DirectorVetting },
    { id: 4, name: 'Application Form', component: ApplicationForm },
    { id: 5, name: 'Capital Structure', component: CapitalStructure },
    { id: 6, name: 'Products & Services', component: ProductsAndServices },
    { id: 7, name: 'Financial Projections', component: FinancialProjections },
    { id: 8, name: 'Growth & Development', component: GrowthAndDevelopment },
    { id: 9, name: 'Documents Upload', component: Stage9DocumentsUpload }
  ];

  if (userRole === 'examiner' || userRole === 'senior_be') {
    stages.push({ id: 10, name: 'Report Generation', component: ReportGeneration });
  }

  const progress = (currentStep / stages.length) * 100;

  const handleProfileComplete = (data) => {
    setCompanyData(data);
    localStorage.setItem('currentCompanyId', data.id);
    setCurrentStep(2);
  };

  const handleExitToDashboard = () => {
    navigate(`/${userRole}`);
  };

  return (
    <div className="rbz-app-container">
      <Sidebar
        stages={stages}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        progress={progress}
      />

      <div className="rbz-main-content">
        <div className="py-3 px-4 position-relative" style={{ zIndex: 10, background: '#003366', borderBottom: '3px solid #c5a236' }}>
          <div className="d-flex justify-content-between align-items-center">
            {/* Left side: Logo and Title */}
            <div className="d-flex align-items-center">
              <img src="/rbz-logo.png" alt="Reserve Bank of Zimbabwe" style={{ height: '42px', marginRight: '16px', background: 'white', padding: '3px', borderRadius: '4px' }} />
              <div>
                <h4 className="mb-0 fw-bold" style={{ color: 'white', fontSize: '1.05rem' }}>{stages[currentStep - 1]?.name}</h4>
                <p className="mb-0 small" style={{ color: 'rgba(255,255,255,0.55)' }}>Step {currentStep} of {stages.length} — Microfinance Licensing Application</p>
              </div>
            </div>

            {/* Right side: Actions, Badges */}
            <div className="d-flex align-items-center gap-3">
              <div className="d-none d-md-flex align-items-center">
                <small style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500, letterSpacing: '0.3px' }}>Bank Supervision Division</small>
              </div>
              <span style={{
                background: userRole === 'applicant' ? 'rgba(255,255,255,0.12)' : 'rgba(197,162,54,0.2)',
                color: userRole === 'applicant' ? 'rgba(255,255,255,0.8)' : '#c5a236',
                padding: '5px 14px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.15)'
              }}>
                {userRole === 'applicant' ? 'Applicant Mode' : 'Examiner Review Mode'}
              </span>
              <Button size="sm" onClick={handleExitToDashboard}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', fontWeight: 500, borderRadius: '20px', padding: '5px 14px' }}>
                ← Exit to Dashboard
              </Button>
            </div>
          </div>
        </div>

        <div className="d-flex flex-grow-1" style={{ overflow: 'hidden' }}>
          <div className="rbz-content-wrapper flex-grow-1 position-relative" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
            {currentStep === 1 && <CompanyProfile onComplete={handleProfileComplete} readOnly={userRole === 'examiner' || userRole === 'senior_be'} />}
            {currentStep === 2 && <Stage2Ownership companyId={companyData?.id || localStorage.getItem('currentCompanyId')} onComplete={() => setCurrentStep(3)} readOnly={userRole === 'examiner' || userRole === 'senior_be'} />}
            {currentStep === 3 && <DirectorVetting companyData={companyData} onComplete={() => setCurrentStep(4)} readOnly={userRole === 'examiner' || userRole === 'senior_be'} />}
            {currentStep === 4 && <ApplicationForm onComplete={() => setCurrentStep(5)} readOnly={userRole === 'examiner' || userRole === 'senior_be'} />}
            {currentStep === 5 && <CapitalStructure onComplete={() => setCurrentStep(6)} readOnly={userRole === 'examiner' || userRole === 'senior_be'} />}
            {currentStep === 6 && <ProductsAndServices onComplete={() => setCurrentStep(7)} readOnly={userRole === 'examiner' || userRole === 'senior_be'} />}
            {currentStep === 7 && <FinancialProjections onComplete={() => setCurrentStep(8)} readOnly={userRole === 'examiner' || userRole === 'senior_be'} />}
            {currentStep === 8 && <GrowthAndDevelopment onComplete={() => setCurrentStep(9)} readOnly={userRole === 'examiner' || userRole === 'senior_be'} />}
            {currentStep === 9 && <Stage9DocumentsUpload onComplete={() => userRole === 'applicant' ? handleExitToDashboard() : setCurrentStep(10)} readOnly={userRole === 'examiner' || userRole === 'senior_be'} />}
            {currentStep === 10 && userRole !== 'applicant' && <ReportGeneration />}

            <div className="text-center py-3 mt-4" style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6', color: '#6c757d', fontSize: '0.85rem' }}>
              &copy; 2026 Reserve Bank of Zimbabwe. Bank Supervision, Surveillance & Financial Stability.
            </div>
          </div>

          {(userRole === 'examiner' || userRole === 'senior_be') && (
            <div style={{ width: '450px', minWidth: '450px', borderLeft: '4px solid var(--rbz-gold)', backgroundColor: '#f4f7f6', padding: '20px', overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
              <h5 className="fw-bold mb-3" style={{ color: 'var(--rbz-navy)' }}>Supervisory Intelligence</h5>
              <WorkflowStatusPanel
                companyId={companyData?.id || localStorage.getItem('currentCompanyId')}
                currentStep={currentStep}
                onStageComplete={() => { }}
              />
              <ReviewControlPanel
                companyId={companyData?.id || localStorage.getItem('currentCompanyId')}
                stageId={stages[currentStep - 1]?.id}
                stageName={stages[currentStep - 1]?.name}
                examinerName="P. T. Madamombe"
              />
            </div>
          )}
        </div>
      </div>

      {userRole === 'applicant' && (
        <ApplicationChat
          companyId={companyData?.id || localStorage.getItem('currentCompanyId')}
          currentUserRole="applicant"
          userName={localStorage.getItem('applicantName') || 'Applicant'}
        />
      )}
    </div>
  );
};


// --- ROUTER & LOGIC WRAPPER ---
function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);
  const [companyData, setCompanyData] = useState(null);

  useEffect(() => {
    // If we land on a path that requires auth, we ensure userRole is synced
    if (userRole) {
      localStorage.setItem('userRole', userRole);
    }
  }, [userRole]);

  const handleRoleSelect = (role) => {
    setUserRole(role);
    localStorage.setItem('userRole', role);
    navigate(`/${role}`);
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentCompanyId');
    localStorage.removeItem('examinerUsername');
    setCompanyData(null);
    navigate('/login');
  };

  const handleStartApp = (existingId, role) => {
    if (existingId) localStorage.setItem('currentCompanyId', existingId);
    navigate(`/${role || userRole}/application`);
  };

  const handleReviewApp = (app) => {
    setCompanyData(app);
    localStorage.setItem('currentCompanyId', app.id);
    if (userRole === 'examiner') {
      navigate('/examiner/institution-review');
    } else {
      navigate(`/${userRole}/review`);
    }
  };

  return (
    <Routes>
      <Route path="/" element={<ApplicantLanding />} />
      <Route path="/auth" element={<ApplicantAuth onLogin={handleRoleSelect} />} />
      <Route path="/staff-login" element={<LoginSelection onSelectRole={handleRoleSelect} />} />
      <Route path="/login" element={<Navigate to="/auth" />} />

      {/* Applicant Routes */}
      <Route path="/applicant" element={<DashboardApplicant onLogout={handleLogout} onStartApp={handleStartApp} />} />
      <Route path="/applicant/application" element={<WizardLayout userRole="applicant" companyData={companyData} setCompanyData={setCompanyData} />} />

      {/* Examiner Routes */}
      <Route path="/examiner" element={<DashboardExaminer onLogout={handleLogout} onReviewApp={handleReviewApp} />} />
      <Route path="/examiner/institution-review" element={
        <ExaminerInstitutionReview
          companyId={companyData?.id || localStorage.getItem('currentCompanyId')}
          onBack={() => navigate('/examiner')}
        />
      } />
      <Route path="/examiner/review" element={<WizardLayout userRole="examiner" companyData={companyData} setCompanyData={setCompanyData} />} />

      {/* Senior Examiner Routes */}
      <Route path="/senior_be" element={<DashboardSenior onLogout={handleLogout} onReviewApp={handleReviewApp} />} />
      <Route path="/senior_be/review" element={<WizardLayout userRole="senior_be" companyData={companyData} setCompanyData={setCompanyData} />} />
    </Routes>
  );
}

export default App;
