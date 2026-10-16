import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Paper,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Box,
  Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import TrainIcon from '@mui/icons-material/Train';
import { playClickSound } from '../utils/soundEngine';
import { TRAIN_LEVELS } from '../utils/trainWordsData';

const BALLOON_LEVELS = [
  { level: 1, title: 'Level 1: Beginner', desc: '2 Balloons / Fish — Easy choice for beginners' },
  { level: 2, title: 'Level 2: Explorer', desc: '3 Balloons / Fish — Slightly more options' },
  { level: 3, title: 'Level 3: Champion', desc: '4 Balloons / Fish — Great preschool challenge' },
  { level: 4, title: 'Level 4: Super Star', desc: '5 Balloons / Fish — For skilled sound masters' },
  { level: 5, title: 'Level 5: Master', desc: '6 Balloons / Fish — Ultimate phonics master' },
];

const LevelSelectorModal = ({ open, onClose, currentLevel, onSelectLevel, gameType = 'balloons' }) => {
  const isTrainGame = gameType === 'train';
  const [trainTab, setTrainTab] = useState(currentLevel >= 10 ? 1 : 0);

  const handleSelect = (lvl) => {
    playClickSound();
    onSelectLevel(lvl);
    onClose();
  };

  const prekTrainLevels = TRAIN_LEVELS.filter((l) => l.level <= 9);
  const kinderTrainLevels = TRAIN_LEVELS.filter((l) => l.level >= 10);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '28px',
          p: { xs: 1, sm: 2 },
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(16px)',
          maxHeight: '85vh',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isTrainGame ? (
            <TrainIcon sx={{ color: '#00E676', fontSize: '2rem' }} />
          ) : (
            <StarIcon sx={{ color: '#FF9100', fontSize: '2rem' }} />
          )}
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#2D3436' }}>
            {isTrainGame ? 'Select Train Level 🚂' : 'Select Phonics Level ⭐'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 1, sm: 2 } }}>
        {isTrainGame ? (
          <Box>
            <Tabs
              value={trainTab}
              onChange={(e, val) => {
                playClickSound();
                setTrainTab(val);
              }}
              variant="fullWidth"
              sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab
                label="Pre-K (Levels 1–9)"
                sx={{ fontWeight: 800, fontSize: '0.95rem', textTransform: 'none' }}
              />
              <Tab
                label="Kindergarten (Levels 10–19)"
                sx={{ fontWeight: 800, fontSize: '0.95rem', textTransform: 'none' }}
              />
            </Tabs>

            <Grid container spacing={1.5}>
              {(trainTab === 0 ? prekTrainLevels : kinderTrainLevels).map((item) => {
                const isCurrent = item.level === currentLevel;
                return (
                  <Grid item xs={12} key={item.level}>
                    <Paper
                      onClick={() => handleSelect(item.level)}
                      sx={{
                        p: 1.8,
                        borderRadius: '18px',
                        cursor: 'pointer',
                        border: isCurrent ? '3px solid #00E676' : '2px solid rgba(0,0,0,0.08)',
                        bgcolor: isCurrent ? '#E8F5E9' : '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.15s ease',
                        '&:hover': { transform: 'scale(1.015)', bgcolor: isCurrent ? '#E8F5E9' : '#F7FAFC' },
                      }}
                    >
                      <Box sx={{ pr: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Chip
                            label={item.grade}
                            size="small"
                            color={item.grade === 'Pre-K' ? 'secondary' : 'primary'}
                            sx={{ fontWeight: 800, fontSize: '0.75rem', height: 22 }}
                          />
                          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#2D3436' }}>
                            {item.title}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: '#4A5568', fontWeight: 600, display: 'block' }}>
                          {item.description}
                        </Typography>
                      </Box>
                      {isCurrent && <StarIcon sx={{ color: '#00E676', fontSize: '1.8rem', flexShrink: 0 }} />}
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        ) : (
          <Grid container spacing={1.5}>
            {BALLOON_LEVELS.map((item) => {
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
                      transition: 'all 0.15s ease',
                      '&:hover': { transform: 'scale(1.02)' },
                    }}
                  >
                    <div>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#2D3436' }}>
                        {item.title}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#636E72', fontWeight: 600 }}>
                        {item.desc}
                      </Typography>
                    </div>
                    {isCurrent && <StarIcon sx={{ color: '#FF9100', fontSize: '2rem' }} />}
                  </Paper>
                </Grid>
              );
            })}
          </Grid>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LevelSelectorModal;
