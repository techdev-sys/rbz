import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { Button } from 'react-bootstrap';
import Sidebar from './components/Sidebar';
import DirectorVetting from './components/DirectorVetting';
import CompanyProfile from './components/CompanyProfile';
import Stage2Ownership from './components/Stage2Ownership';
import ApplicationForm from './components/ApplicationForm';
import CapitalStructure from './components/CapitalStructure';
import ProductsAndServices from './components/ProductsAndServices';
import FinancialProjections from './components/FinancialProjections';
import GrowthAndDevelopment from './components/GrowthAndDevelopment';
import ComplianceDocumentation from './components/ComplianceDocumentation';
import Stage9DocumentsUpload from './components/Stage9DocumentsUpload';
import Stage10ApplicationReview from './components/Stage10ApplicationReview';
import StageBankCapitalAdequacy from './components/StageBankCapitalAdequacy';
import StageDTMFIDepositProtection from './components/StageDTMFIDepositProtection';
import StageBankLiquidity from './components/StageBankLiquidity';
import StageBankITCyber from './components/StageBankITCyber';
import StageBankRecoveryResolution from './components/StageBankRecoveryResolution';
import ReportGeneration from './components/ReportGeneration';
import LoginSelection from './components/LoginSelection';
import ApplicantLanding from './components/ApplicantLanding';
import ApplicantAuth from './components/ApplicantAuth';
import DashboardApplicant from './components/DashboardApplicant';
import DashboardSenior from './components/DashboardSenior';
import DashboardExaminer from './components/DashboardExaminer';
import AIChatbot from './components/AIChatbot';
import ApplicationChat from './components/ApplicationChat';
import ExaminerInstitutionReview from './components/ExaminerInstitutionReview';
import ReviewControlPanel from './components/ReviewControlPanel';
import WorkflowStatusPanel from './components/WorkflowStatusPanel';
import RequireAuth from './components/RequireAuth';
import { getCompanyProfile } from './services/api';
import { clearSession, getRole } from './services/session';

// --- CORE WIZARD COMPONENT ---
const WizardLayout = ({ userRole, companyData, setCompanyData }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedStages, setCompletedStages] = useState(new Set());

  const markComplete = (stageId) => {
    setCompletedStages(prev => new Set([...prev, stageId]));
  };

  const institutionType = localStorage.getItem('institutionType') || 'MFI';
  const isBank = institutionType === 'COMMERCIAL_BANK';
  const isDTMFI = institutionType === 'DTMFI';
  const isReadOnly = userRole === 'examiner' || userRole === 'senior_be';

  // Build stage list dynamically by institution type:
  // MFI:   9 core stages + Review
  // DTMFI: 9 core stages + Deposit Protection + Review
  // Bank:  9 core stages + Capital Adequacy + Liquidity + IT/Cyber + Recovery & Resolution + Review
  const stages = [
    { id: 1, name: 'Company Profile', component: CompanyProfile },
    { id: 2, name: 'Ownership Structure', component: Stage2Ownership },
    { id: 3, name: 'Directors & Governance', component: DirectorVetting },
    { id: 4, name: 'Application Form', component: ApplicationForm },
    { id: 5, name: 'Capital Structure', component: CapitalStructure },
    { id: 6, name: 'Products & Services', component: ProductsAndServices },
    { id: 7, name: 'Financial Projections', component: FinancialProjections },
    { id: 8, name: 'Growth & Development', component: GrowthAndDevelopment },
    { id: 9, name: 'Compliance Declaration', component: ComplianceDocumentation },
    { id: 10, name: 'Documents Upload', component: Stage9DocumentsUpload },
    // DTMFI-only stage
    ...(isDTMFI ? [{ id: 'deposit-protection', name: 'Deposit Protection (DIPF)', component: StageDTMFIDepositProtection }] : []),
    // Bank-only stages
    ...(isBank ? [
      { id: 'cap-adequacy', name: 'Capital Adequacy (Basel III)', component: StageBankCapitalAdequacy },
      { id: 'liquidity', name: 'Liquidity Management', component: StageBankLiquidity },
      { id: 'it-cyber', name: 'IT & Cyber Risk', component: StageBankITCyber },
      { id: 'recovery', name: 'Recovery & Resolution', component: StageBankRecoveryResolution },
    ] : []),
    { id: 11, name: 'Application Review', component: Stage10ApplicationReview },
    ...(isReadOnly ? [{ id: 12, name: 'Report Generation', component: ReportGeneration }] : []),
  ];

  const progress = stages.length > 0 ? (completedStages.size / stages.length) * 100 : 0;

  const handleProfileComplete = (data) => {
    setCompanyData(data);
    localStorage.setItem('currentCompanyId', data.id);
    markComplete(1);
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
        completedStages={completedStages}
        progress={progress}
      />

      <div className="rbz-main-content">
        <div className="rbz-workspace-topbar">
          <div className="rbz-workspace-topbar-inner">
            {/* Left side: Logo and Title */}
            <div className="rbz-workspace-identity">
              <img src="/rbz-logo.png" alt="Reserve Bank of Zimbabwe" className="rbz-workspace-logo" />
              <div>
                <h4 className="rbz-workspace-title">{stages[currentStep - 1]?.name}</h4>
                <p className="rbz-workspace-subtitle">Step {currentStep} of {stages.length} — Institution Licensing Application</p>
              </div>
            </div>

            {/* Right side: Actions, Badges */}
            <div className="rbz-workspace-actions">
              <div className="rbz-workspace-division d-none d-md-flex">
                <small>Banking Supervision, Surveillance &amp; Financial Stability</small>
              </div>
              <span className={`rbz-mode-badge ${userRole === 'applicant' ? 'applicant' : 'examiner'}`}>
                {userRole === 'applicant' ? 'Applicant Mode' : 'Examiner Review Mode'}
              </span>
              <Button size="sm" onClick={handleExitToDashboard} className="rbz-exit-button">
                ← Exit to Dashboard
              </Button>
            </div>
          </div>
        </div>

        <div className="rbz-workspace-body d-flex flex-grow-1">
          <div className="rbz-content-wrapper rbz-workspace-scroll flex-grow-1 position-relative">

            {/* ── Stage Progress Indicator ── */}
            <div className="rbz-stage-progress">
              {/* Left: stage pill */}
              <div className="rbz-stage-progress-identity">
                <span className="rbz-stage-chip">
                  STAGE {currentStep} OF {stages.length}
                </span>
                <span className="rbz-stage-progress-title">
                  {stages[currentStep - 1]?.name}
                </span>
              </div>

              {/* Centre: dot-based step row */}
              <div className="rbz-stage-dots">
                {stages.map((s, i) => {
                  const done = completedStages.has(s.id);
                  const active = i + 1 === currentStep;
                  return (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
                      <div
                        title={`Stage ${s.id}: ${s.name}`}
                        style={{
                          width: active ? '28px' : '10px',
                          height: '10px',
                          borderRadius: '5px',
                          background: done ? '#9A7B3F' : active ? '#003366' : '#D0D5DD',
                          transition: 'all 0.3s ease',
                          cursor: 'default'
                        }}
                      />
                      {i < stages.length - 1 && (
                        <div style={{ width: '10px', height: '2px', background: done ? '#9A7B3F' : '#D0D5DD', margin: '0 2px' }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Right: progress % */}
              <div className="rbz-stage-percent">
                <div className="rbz-stage-percent-track">
                  <div className="rbz-stage-percent-fill" style={{ width: `${progress}%` }} />
                </div>
                <small>{Math.round(progress)}%</small>
              </div>
            </div>
            {/* ── End Stage Progress Indicator ── */}

            {(() => {
              const stage = stages[currentStep - 1];
              if (!stage) return null;
              const Comp = stage.component;
              const cid = companyData?.id || localStorage.getItem('currentCompanyId');
              const advance = () => { markComplete(stage.id); setCurrentStep(currentStep + 1); };

              if (Comp === CompanyProfile) return <CompanyProfile onComplete={handleProfileComplete} readOnly={isReadOnly} />;
              if (Comp === Stage2Ownership) return <Stage2Ownership companyId={cid} onComplete={advance} readOnly={isReadOnly} />;
              if (Comp === DirectorVetting) return <DirectorVetting companyData={companyData} onComplete={advance} readOnly={isReadOnly} />;
              if (Comp === Stage10ApplicationReview) return <Stage10ApplicationReview onGoToStage={setCurrentStep} onSubmit={handleExitToDashboard} />;
              if (Comp === ReportGeneration) return <ReportGeneration />;
              return <Comp onComplete={advance} readOnly={isReadOnly} />;
            })()}

            <div className="rbz-workspace-footer">
              &copy; 2026 Reserve Bank of Zimbabwe. Bank Supervision, Surveillance & Financial Stability.
            </div>
          </div>

          {(userRole === 'examiner' || userRole === 'senior_be') && (
            <div className="rbz-supervisory-panel">
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
                examinerName={localStorage.getItem('examinerUsername') || 'Examiner'}
              />
            </div>
          )}
        </div>
      </div>

      {userRole === 'applicant' && (
        <>
          <AIChatbot
            companyId={companyData?.id || localStorage.getItem('currentCompanyId')}
            currentStage={currentStep}
            stageName={stages[currentStep - 1]?.name}
            institutionName={localStorage.getItem('institutionName') || ''}
            userName={localStorage.getItem('applicantName') || 'Applicant'}
          />
          {/* Human channel to the examination team — stacked above the AI guide bubble */}
          <ApplicationChat
            companyId={companyData?.id || localStorage.getItem('currentCompanyId')}
            currentUserRole="applicant"
            userName={localStorage.getItem('applicantName') || 'Applicant'}
            bottomOffset={96}
          />
        </>
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
  const [userRole, setUserRole] = useState(getRole());
  const [companyData, setCompanyData] = useState(null);

  useEffect(() => {
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
    const wasStaff = userRole === 'examiner' || userRole === 'senior_be';
    clearSession();
    setUserRole(null);
    setCompanyData(null);
    navigate(wasStaff ? '/staff-login' : '/');
  };

  const handleStartApp = async (existingId, role) => {
    if (existingId) {
      localStorage.setItem('currentCompanyId', existingId);
      try {
        const response = await getCompanyProfile(existingId);
        if (response.data?.id) {
          setCompanyData(response.data);
        }
      } catch (err) {
      }
    }
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
      {/* Public landing */}
      <Route path="/" element={<ApplicantLanding />} />

      {/* Public applicant auth (separate URLs for sign-in vs registration) */}
      <Route path="/login" element={<ApplicantAuth onLogin={handleRoleSelect} />} />
      <Route path="/register" element={<ApplicantAuth onLogin={handleRoleSelect} />} />
      {/* Legacy /auth alias */}
      <Route path="/auth" element={<Navigate to="/login" replace />} />

      {/* Restricted RBZ staff portal */}
      <Route path="/staff-login" element={<LoginSelection onSelectRole={handleRoleSelect} />} />

      {/* Applicant — protected */}
      <Route path="/applicant" element={
        <RequireAuth allow="applicant">
          <DashboardApplicant onLogout={handleLogout} onStartApp={handleStartApp} />
        </RequireAuth>
      } />
      <Route path="/applicant/application" element={
        <RequireAuth allow="applicant">
          <WizardLayout userRole="applicant" companyData={companyData} setCompanyData={setCompanyData} />
        </RequireAuth>
      } />

      {/* Examiner — protected */}
      <Route path="/examiner" element={
        <RequireAuth allow="examiner">
          <DashboardExaminer onLogout={handleLogout} onReviewApp={handleReviewApp} />
        </RequireAuth>
      } />
      <Route path="/examiner/institution-review" element={
        <RequireAuth allow="examiner">
          <ExaminerInstitutionReview
            companyId={companyData?.id || localStorage.getItem('currentCompanyId')}
            onBack={() => navigate('/examiner')}
          />
        </RequireAuth>
      } />
      {/* Senior Examiner — protected */}
      <Route path="/senior_be" element={
        <RequireAuth allow="senior_be">
          <DashboardSenior onLogout={handleLogout} onReviewApp={handleReviewApp} />
        </RequireAuth>
      } />
      <Route path="/senior_be/review" element={
        <RequireAuth allow="senior_be">
          <ExaminerInstitutionReview
            companyId={companyData?.id || localStorage.getItem('currentCompanyId')}
            viewerRole="senior_be"
            onBack={() => navigate('/senior_be')}
          />
        </RequireAuth>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
