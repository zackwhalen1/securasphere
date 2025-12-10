import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './App.css';
import AboutPage from './AboutPage';
import ContactPage from './ContactPage';
import PhishingTrainerTool from './PhishingTrainerTool';
import SocialMediaAnalyzerTool from './SocialMediaAnalyzerTool';
import PhishingTrainingPage from './PhishingTrainingPage';
import PasswordSecurityPage from './PasswordSecurityPage';
import SocialMediaAnalysisPage from './SocialMediaAnalysisPage';
import UnifiedSocialMediaAnalyzer from './UnifiedSocialMediaAnalyzer';
import PasswordGeneratorAndCheckerTool from './PasswordGeneratorAndCheckerTool';
import PrivacyPage from './PrivacyPage';
import TermsPage from './TermsPage';
import HUDTestFixed from './HUDTestFixed';


// Component to scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/*New Home*/}
        <Route path="/" element={<HUDTestFixed />} />
        
        {/*New Info Pages*/}
        <Route path="/passwordchecker" element={<PasswordSecurityPage />} />
        <Route path="/phishing" element={<PhishingTrainingPage />} />
        <Route path="/social" element={<SocialMediaAnalysisPage />} />
        
        {/*Old Tool Pages */}
        <Route path="/social-media-analyzer" element={<UnifiedSocialMediaAnalyzer />} />

        {/*New Tool Pages*/}
        <Route path="/phishing-trainer-tool" element={<PhishingTrainerTool />} />
        <Route path="/social-media-analyzer-tool" element={<SocialMediaAnalyzerTool />} />
        <Route path="/password-generator-and-checker-tool" element={<PasswordGeneratorAndCheckerTool />} />

        {/*Footer Pages*/}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/contact" element={<ContactPage />} />

      </Routes>
    </Router>
  );
}

export default App;
