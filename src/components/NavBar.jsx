import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TuneIcon from '@mui/icons-material/Tune';
import StarIcon from '@mui/icons-material/Star';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { playClickSound } from '../utils/soundEngine';

const NavBar = ({
  activeTab,
  onTabChange,
  activeGame,
  onGameChange,
  level,
  onOpenLevelSelector,
  onOpenProfileModal,
  onOpenAdminPanel,
  activeProfile,
  streak,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    playClickSound();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const handleTabSwitch = (tab) => {
    playClickSound();
    onTabChange(tab);
  };

  const handleGoLobby = () => {
    playClickSound();
    onTabChange('game');
    onGameChange('lobby');
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '2px solid rgba(255, 255, 255, 0.6)',
        color: '#2D3436',
        px: { xs: 1, sm: 2 },
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, py: 0.5 }}>
        {/* Left: App Title & Profile Avatar Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Tooltip title="Switch or Edit Profile">
            <Chip
              avatar={
                <span style={{ fontSize: '1.4rem', marginLeft: '6px' }}>
                  {activeProfile?.avatar || '🦄'}
                </span>
              }
              label={activeProfile?.name || 'Quinn'}
              onClick={onOpenProfileModal}
              clickable
              sx={{
                bgcolor: '#FF4081',
                color: '#FFF',
                fontWeight: 800,
                fontSize: '1.05rem',
                py: 2.2,
                px: 0.5,
                borderRadius: '20px',
                boxShadow: '0 4px 12px rgba(255, 64, 129, 0.3)',
                '&:hover': { bgcolor: '#F50057' },
              }}
            />
          </Tooltip>

          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(45deg, #FF4081, #7C4DFF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '1.1rem', sm: '1.4rem' },
                cursor: 'pointer',
              }}
              onClick={handleGoLobby}
            >
              Quinn's Letter Sounds 🎈🔊
            </Typography>
            <Chip
              label="v1.3.0"
              size="small"
              sx={{
                bgcolor: 'rgba(124, 77, 255, 0.12)',
                color: '#7C4DFF',
                fontWeight: 800,
                fontSize: '0.72rem',
                height: '22px',
                borderRadius: '8px',
                border: '1px solid rgba(124, 77, 255, 0.3)',
              }}
            />
          </Box>
        </Box>

        {/* Center: Navigation Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant={activeTab === 'game' && activeGame === 'lobby' ? 'contained' : 'outlined'}
            color="secondary"
            startIcon={<HomeIcon />}
            onClick={handleGoLobby}
            size="small"
            sx={{
              borderRadius: '20px',
              fontWeight: 800,
              fontSize: { xs: '0.85rem', sm: '0.95rem' },
            }}
          >
            Games 🏠
          </Button>

          <Button
            variant={activeTab === 'stats' ? 'contained' : 'outlined'}
            color="primary"
            startIcon={<AssessmentIcon />}
            onClick={() => handleTabSwitch('stats')}
            size="small"
            sx={{
              borderRadius: '20px',
              fontWeight: 800,
              fontSize: { xs: '0.85rem', sm: '0.95rem' },
            }}
          >
            Scores ⭐
          </Button>
        </Box>

        {/* Right: Level, Streak, Admin & Fullscreen */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {streak > 0 && (
            <Chip
              icon={<LocalFireDepartmentIcon sx={{ color: '#FF9100 !important' }} />}
              label={`${streak}`}
              size="small"
              sx={{
                bgcolor: '#FFF3E0',
                color: '#E65100',
                fontWeight: 800,
                border: '1px solid #FFE0B2',
              }}
            />
          )}

          <Tooltip title="Select Level">
            <Chip
              icon={<StarIcon sx={{ color: '#FFC107 !important' }} />}
              label={`Lvl ${level}`}
              onClick={onOpenLevelSelector}
              clickable
              size="small"
              sx={{
                bgcolor: '#FFFDE7',
                color: '#F57F17',
                fontWeight: 800,
                border: '1px solid #FFF59D',
              }}
            />
          </Tooltip>

          <Tooltip title="Admin Settings">
            <IconButton
              onClick={onOpenAdminPanel}
              size="small"
              sx={{
                bgcolor: 'rgba(124, 77, 255, 0.1)',
                color: '#7C4DFF',
                '&:hover': { bgcolor: 'rgba(124, 77, 255, 0.2)' },
              }}
            >
              <TuneIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Toggle Fullscreen">
            <IconButton
              onClick={toggleFullscreen}
              size="small"
              sx={{
                bgcolor: 'rgba(255, 64, 129, 0.1)',
                color: '#FF4081',
                '&:hover': { bgcolor: 'rgba(255, 64, 129, 0.2)' },
              }}
            >
              {isFullscreen ? <FullscreenExitIcon fontSize="small" /> : <FullscreenIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
