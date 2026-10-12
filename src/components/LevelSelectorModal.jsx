import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Paper,
  Typography,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import { playClickSound } from '../utils/soundEngine';

const LEVELS = [
  { level: 1, title: 'Level 1: Beginner', balloons: '2 Balloons / Fish', desc: 'Easy choice for beginners' },
  { level: 2, title: 'Level 2: Explorer', balloons: '3 Balloons / Fish', desc: 'Slightly more options' },
  { level: 3, title: 'Level 3: Champion', balloons: '4 Balloons / Fish', desc: 'Great preschool challenge' },
  { level: 4, title: 'Level 4: Super Star', balloons: '5 Balloons / Fish', desc: 'For skilled sound masters' },
  { level: 5, title: 'Level 5: Master', balloons: '6 Balloons / Fish', desc: 'Ultimate phonics master' },
];

const LevelSelectorModal = ({ open, onClose, currentLevel, onSelectLevel }) => {
  const handleSelect = (lvl) => {
    playClickSound();
    onSelectLevel(lvl);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '28px',
          p: 1.5,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#2D3436' }}>
          Select Level ⭐
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={1.5}>
          {LEVELS.map((item) => {
            const isCurrent = item.level === currentLevel;
            return (
              <Grid item xs={12} key={item.level}>
                <Paper
                  onClick={() => handleSelect(item.level)}
                  sx={{
                    p: 2,
                    borderRadius: '20px',
                    cursor: 'pointer',
                    border: isCurrent ? '3px solid #FF9100' : '2px solid rgba(0,0,0,0.08)',
                    bgcolor: isCurrent ? '#FFF8E1' : '#FFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                    '&:hover': { transform: 'scale(1.02)' },
                  }}
                >
                  <div>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#2D3436' }}>
                      {item.title}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#636E72', fontWeight: 600 }}>
                      {item.balloons} — {item.desc}
                    </Typography>
                  </div>
                  {isCurrent && <StarIcon sx={{ color: '#FF9100', fontSize: '2rem' }} />}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>
    </Dialog>
  );
};

export default LevelSelectorModal;
