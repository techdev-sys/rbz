import React, { useState, useEffect } from 'react';
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
import DashboardApplicant from './components/DashboardApplicant';
import DashboardSenior from './components/DashboardSenior';
import DashboardExaminer from './components/DashboardExaminer';
import ReviewControlPanel from './components/ReviewControlPanel';

function App() {
  const [currentView, setCurrentView] = useState('login'); // login, dashboard, wizard
  const [userRole, setUserRole] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [companyData, setCompanyData] = useState(null);

  // Restore session if exists
  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    if (savedRole) {
      setUserRole(savedRole);
      setCurrentView('dashboard');
    }
  }, []);

  const handleRoleSelect = (role) => {
    setUserRole(role);
    localStorage.setItem('userRole', role);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('currentCompanyId'); // Clear session
    setCompanyData(null);
    setCurrentView('login');
    setCurrentStep(1);
  };

  const handleStartApp = (existingId, role) => {
    // Start or Resume Application
    if (existingId) localStorage.setItem('currentCompanyId', existingId);
    setCurrentView('wizard');
    setCurrentStep(1);
  };

  const handleReviewApp = (app) => {
    // Examiner reviewing app
    setCompanyData(app);
    localStorage.setItem('currentCompanyId', app.id);
    setCurrentView('wizard');
    setCurrentStep(1); // Start reviews from beginning
  };

  const handleProfileComplete = (data) => {
    setCompanyData(data);
    localStorage.setItem('currentCompanyId', data.id);
    setCurrentStep(2);
  };

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

  // Examiners see the Report Generation stage
  if (userRole === 'examiner' || userRole === 'senior_be') { // Senior BE might want to see it too? Let's say yes.
    stages.push({ id: 10, name: 'Report Generation', component: ReportGeneration });
  }

  const progress = (currentStep / stages.length) * 100;

  // Render Logic
  if (currentView === 'login') {
    return <LoginSelection onSelectRole={handleRoleSelect} />;
  }

  if (currentView === 'dashboard') {
    if (userRole === 'applicant') return <DashboardApplicant onLogout={handleLogout} onStartApp={handleStartApp} />;
    if (userRole === 'senior_be') return <DashboardSenior onLogout={handleLogout} />;
    if (userRole === 'examiner') return <DashboardExaminer onLogout={handleLogout} onReviewApp={handleReviewApp} />;
    return <LoginSelection onSelectRole={handleRoleSelect} />; // Fallback
  }

  // WIZARD VIEW
  return (
    <div className="rbz-app-container">
      {/* Left Sidebar Navigation */}
      <Sidebar
        stages={stages}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        progress={progress}
      />

      {/* Main Content Area */}
      <div className="rbz-main-content">
        {/* Page Header */}
        <div className="rbz-page-header" style={{ background: '#003366', color: 'white', padding: '20px', borderBottom: '4px solid #D4AF37' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <Button variant="outline-light" size="sm" onClick={() => setCurrentView('dashboard')} className="me-3">← Exit to Dashboard</Button>
              <Badge bg="warning" text="dark">{userRole === 'applicant' ? 'Applicant Mode' : 'Examiner Review Mode'}</Badge>
            </div>
            <div className="text-end">
              <small className="d-block" style={{ color: '#D4AF37' }}>Bank Supervision ,Surveillance and Financial Stability Division</small>
            </div>
          </div>
          <div className="d-flex align-items-center">
            <img
              src="/rbz-logo.png"
              alt="Reserve Bank of Zimbabwe"
              style={{ height: '60px', marginRight: '20px', backgroundColor: 'white', padding: '5px', borderRadius: '50%' }}
            />
            <div>
              <h3 className="mb-0" style={{ fontWeight: 'bold' }}>
                {stages[currentStep - 1]?.name}
              </h3>
              <p className="mb-0 small" style={{ opacity: 0.8 }}>
                Step {currentStep} of {stages.length} - Microfinance Licensing Application
              </p>
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="rbz-content-wrapper">
          {/* EXAMINER REVIEW CONTROL PANEL */}
          {(userRole === 'examiner' || userRole === 'senior_be') && (
            <ReviewControlPanel
              companyId={companyData?.id || localStorage.getItem('currentCompanyId')}
              stageId={stages[currentStep - 1]?.id}
              stageName={stages[currentStep - 1]?.name}
              examinerName="Current Examiner" // In real app, get from auth context
            />
          )}

          {/* STAGE CONTENT (ReadOnly if Examiner) */}
          {currentStep === 1 && <CompanyProfile onComplete={handleProfileComplete} readOnly={userRole === 'examiner' || userRole === 'senior_be'} />}
          {currentStep === 2 && <Stage2Ownership companyId={companyData?.id || localStorage.getItem('currentCompanyId')} onComplete={() => setCurrentStep(3)} readOnly={userRole === 'examiner' || userRole === 'senior_be'} />}
          {currentStep === 3 && <DirectorVetting companyData={companyData} onComplete={() => setCurrentStep(4)} readOnly={userRole === 'examiner' || userRole === 'senior_be'} />}
          {currentStep === 4 && <ApplicationForm onComplete={() => setCurrentStep(5)} readOnly={userRole === 'examiner' || userRole === 'senior_be'} />}
          {currentStep === 5 && <CapitalStructure onComplete={() => setCurrentStep(6)} readOnly={userRole === 'examiner' || userRole === 'senior_be'} />}
          {currentStep === 6 && <ProductsAndServices onComplete={() => setCurrentStep(7)} readOnly={userRole === 'examiner' || userRole === 'senior_be'} />}
          {currentStep === 7 && <FinancialProjections onComplete={() => setCurrentStep(8)} readOnly={userRole === 'examiner' || userRole === 'senior_be'} />}
          {currentStep === 8 && <GrowthAndDevelopment onComplete={() => setCurrentStep(9)} readOnly={userRole === 'examiner' || userRole === 'senior_be'} />}
          {currentStep === 9 && <Stage9DocumentsUpload onComplete={() => userRole === 'applicant' ? setCurrentView('dashboard') : setCurrentStep(10)} readOnly={userRole === 'examiner' || userRole === 'senior_be'} />}
          {currentStep === 10 && userRole !== 'applicant' && <ReportGeneration />}
        </div>

        {/* Footer for Wizard */}
        <div className="text-center py-3 mt-4" style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6', color: '#6c757d', fontSize: '0.85rem' }}>
          &copy; 2026 Reserve Bank of Zimbabwe. Bank Supervision, Surveillance & Financial Stability.
        </div>
      </div>

      {/* Floating Circular Progress Indicator */}
      <CircularProgress
        currentStep={currentStep}
        totalSteps={stages.length}
        stageName={stages[currentStep - 1]?.name}
        progress={progress}
      />
    </div>
  );
}

export default App;
