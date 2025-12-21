import React from 'react';
import './HUDTest.css';
import AIHelper from './components/AIHelper';

// Import components directly instead of dynamic imports
import HUDNeonWorking from './HUDNeonWorking';
import RadarLoading from './RadarLoading';

function HUDTestFixed() {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    if (isLoading) {
      // Simulate loading time for dramatic effect
      const loadingTimer = setTimeout(() => {
        // Show loading for a bit longer for the full effect
        setTimeout(() => {
          setIsLoading(false);
        }, 1500); // 1.5 seconds total loading time
      }, 500);

      return () => clearTimeout(loadingTimer);
    }
  }, [isLoading]); // React when isLoading changes

  if (isLoading) {
    return (
      <div className="hud-test-override" style={{ 
        minHeight: '100vh', 
        background: '#000',
        position: 'relative'
      }}>

        {/* Show loading animation */}
        <RadarLoading message='ENGAGING SECURITY PROTOCOLS...'/>
      </div>
    );
  }

  return (
    <div className="hud-test-override" style={{ 
      minHeight: '100vh', 
      background: '#000',
      position: 'relative'
    }}>
      
      {/* Show full HUD */}
      <div className="hud-test-override" style={{ position: 'relative', zIndex: 1 }}>
        <HUDNeonWorking />
      </div>

      {/* AI Helper Component */}
      <AIHelper />

    </div>
  );
}

export default HUDTestFixed;