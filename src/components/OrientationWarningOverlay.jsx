import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import ScreenRotationIcon from '@mui/icons-material/ScreenRotation';

const OrientationWarningOverlay = () => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // If mobile/tablet portrait
      const isNarrow = window.innerWidth < window.innerHeight && window.innerWidth < 800;
      setIsPortrait(isNarrow);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait || dismissed) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        bgcolor: 'rgba(45, 52, 54, 0.95)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        textAlign: 'center',
        color: '#FFF',
      }}
    >
      <ScreenRotationIcon sx={{ fontSize: '4.5rem', color: '#FF4081', mb: 2, animation: 'bounce 1.5s infinite alternate' }} />

      <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
        Turn Your Screen Sideways! 📱✨
      </Typography>

      <Typography variant="body1" sx={{ color: '#DFE6E9', maxWidth: 320, mb: 3 }}>
        Quinn's Letter Sounds plays best in landscape horizontal mode so balloons and fish have lots of room!
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={() => setDismissed(true)}
        sx={{ borderRadius: '20px', fontWeight: 800 }}
      >
        Keep Playing Anyway
      </Button>
    </Box>
  );
};

export default OrientationWarningOverlay;
