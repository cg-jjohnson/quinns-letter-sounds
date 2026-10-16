import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Button,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RefreshIcon from '@mui/icons-material/Refresh';
import { PHONICS_DATA, ALPHABET_KEYS } from '../utils/phonicsData';
import { getFocusLetters } from '../utils/adaptiveLearning';
import { speakPhonicsPrompt, speakShortSound, playClickSound } from '../utils/soundEngine';

const ProgressDashboard = ({
  stats,
  activeProfile,
  progress,
  trainProgress = {},
  wordStats = {},
  onResetStats,
}) => {
  const letters = stats?.letters || {};
  const words = wordStats?.words || {};

  let totalQuestions = 0;
  let totalCorrect = 0;

  ALPHABET_KEYS.forEach((ltr) => {
    const data = letters[ltr];
    if (data) {
      totalQuestions += data.total || 0;
      totalCorrect += data.correct || 0;
    }
  });

  const overallAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
  const focusList = getFocusLetters(stats, 4);

  const handlePlayLetter = (ltr) => {
    playClickSound();
    speakPhonicsPrompt(ltr);
  };

  const trainLevel = trainProgress.level || 1;
  const trainGrade = trainLevel <= 9 ? 'Pre-K' : 'Kindergarten';
  const trainTotalWords = trainProgress.total_words_spelled || 0;
  const trainInLevel = trainProgress.correct_in_level || 0;

  return (
    <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto', py: 3, px: 2 }}>
      {/* Header Summary */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            background: 'linear-gradient(45deg, #FF4081, #7C4DFF)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 1,
            fontSize: { xs: '1.6rem', sm: '2.2rem' },
          }}
        >
          {activeProfile?.name || 'Quinn'}'s Phonics Scores ⭐
        </Typography>
        <Typography variant="body1" sx={{ color: '#636E72', fontWeight: 600 }}>
          Track letter sound recognition and sight word spelling progress!
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper className="glass-card" sx={{ p: 2.5, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: '#FF4081', fontWeight: 800 }}>
              Letter Sound Accuracy
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#2D3436', my: 1 }}>
              {overallAccuracy}%
            </Typography>
            <LinearProgress
              variant="determinate"
              value={overallAccuracy}
              sx={{
                height: 12,
                borderRadius: 6,
                bgcolor: '#FCE4EC',
                '& .MuiLinearProgress-bar': { bgcolor: '#FF4081', borderRadius: 6 },
              }}
            />
            <Typography variant="caption" sx={{ color: '#888', mt: 1, display: 'block', fontWeight: 600 }}>
              {totalCorrect} of {totalQuestions} correct
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper className="glass-card" sx={{ p: 2.5, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: '#FF9100', fontWeight: 800 }}>
              Current & Best Streak
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, my: 1 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#666', fontWeight: 700 }}>BALLOONS</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#FF9100' }}>
                  {progress?.streak || 0} 🔥
                </Typography>
              </Box>
              <Box sx={{ borderLeft: '2px solid #EEE', pl: 2 }}>
                <Typography variant="caption" sx={{ color: '#666', fontWeight: 700 }}>TRAIN</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#7C4DFF' }}>
                  {trainProgress?.streak || 0} 🚂
                </Typography>
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: '#888', fontWeight: 600 }}>
              Best Streak: {Math.max(progress?.best_streak || 0, trainProgress?.best_streak || 0)} 🏆
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper className="glass-card" sx={{ p: 2.5, textAlign: 'center' }}>
            <Typography variant="h6" sx={{ color: '#7C4DFF', fontWeight: 800 }}>
              Practice Focus Sounds
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap', my: 1.5 }}>
              {focusList.map((item) => (
                <Chip
                  key={item.letter}
                  label={`${item.letter} (${PHONICS_DATA[item.letter]?.sound})`}
                  onClick={() => handlePlayLetter(item.letter)}
                  clickable
                  sx={{
                    bgcolor: '#EDE7F6',
                    color: '#512DA8',
                    fontWeight: 800,
                    borderRadius: '16px',
                  }}
                />
              ))}
            </Box>
            <Typography variant="caption" sx={{ color: '#888', fontWeight: 600 }}>
              Sounds prioritized during games
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Phonics Spelling Train Mastery Section */}
      <Paper className="glass-card" sx={{ p: 3, mb: 4, borderRadius: '24px', border: '2px solid #FFE082' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontSize: '2.4rem' }}>🚂</Typography>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#E65100' }}>
                Phonics Spelling Train Progress
              </Typography>
              <Typography variant="body2" sx={{ color: '#6D4C41', fontWeight: 600 }}>
                {trainGrade} • Level {trainLevel} • 15 correct required to unlock next level
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={`${trainTotalWords} Words Spelled`}
              sx={{ bgcolor: '#FFF8E1', color: '#E65100', fontWeight: 800, border: '1px solid #FFE082' }}
            />
            <Chip
              label={`${trainInLevel} / 15 in Lvl ${trainLevel}`}
              color="warning"
              sx={{ fontWeight: 800 }}
            />
          </Box>
        </Box>

        <Box sx={{ width: '100%', mb: 2.5 }}>
          <LinearProgress
            variant="determinate"
            value={Math.min(100, (trainInLevel / 15) * 100)}
            sx={{
              height: 12,
              borderRadius: 6,
              bgcolor: '#FFF8E1',
              '& .MuiLinearProgress-bar': { bgcolor: '#FF9800', borderRadius: 6 },
            }}
          />
        </Box>

        {Object.keys(words).length > 0 ? (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#4A5568', mb: 1.5 }}>
              Words Practiced:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(words).map(([word, stat]) => (
                <Chip
                  key={word}
                  label={`${word} (${stat.correct}/${stat.total})`}
                  color={stat.correct === stat.total ? 'success' : 'default'}
                  variant="outlined"
                  sx={{ fontWeight: 700, borderRadius: '12px' }}
                />
              ))}
            </Box>
          </Box>
        ) : (
          <Typography variant="body2" sx={{ color: '#718096', fontStyle: 'italic' }}>
            No train words practiced yet. Hop on the Phonics Spelling Train in the Games Lobby! 🚂
          </Typography>
        )}
      </Paper>

      {/* All Letter Sounds Grid */}
      <Paper className="glass-card" sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#2D3436', mb: 2, textAlign: 'center' }}>
          All 26 Letter Sounds Mastery 🔤
        </Typography>

        <Grid container spacing={1.5} justifyContent="center">
          {ALPHABET_KEYS.map((ltr) => {
            const data = letters[ltr] || { correct: 0, total: 0 };
            const pInfo = PHONICS_DATA[ltr];
            const acc = data.total > 0 ? data.correct / data.total : 0;
            const stars = data.total === 0 ? 0 : acc >= 0.85 ? 3 : acc >= 0.5 ? 2 : 1;

            return (
              <Grid item xs={4} sm={3} md={2} key={ltr}>
                <Paper
                  onClick={() => handlePlayLetter(ltr)}
                  sx={{
                    p: 1.5,
                    textAlign: 'center',
                    borderRadius: '20px',
                    border: '2px solid rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 16px rgba(124, 77, 255, 0.2)',
                    },
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 800, color: pInfo.color }}>
                    {ltr}{ltr.toLowerCase()} {pInfo.emoji}
                  </Typography>

                  <Typography variant="caption" sx={{ color: '#636E72', fontWeight: 700, display: 'block' }}>
                    "{pInfo.sound}" ({pInfo.word})
                  </Typography>

                  {/* Stars */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 0.5 }}>
                    {[1, 2, 3].map((s) => (
                      <StarIcon
                        key={s}
                        sx={{
                          fontSize: '1rem',
                          color: s <= stars ? '#FFC107' : '#E0E0E0',
                        }}
                      />
                    ))}
                  </Box>

                  <Typography variant="caption" sx={{ color: '#999', fontSize: '0.75rem', fontWeight: 600 }}>
                    {data.correct}/{data.total}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Reset Stats & System Version */}
      <Box sx={{ textAlign: 'center', mt: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<RefreshIcon />}
          onClick={onResetStats}
          size="small"
          sx={{ borderRadius: '20px', fontWeight: 700 }}
        >
          Reset All Phonics Scores
        </Button>
        <Typography variant="caption" sx={{ color: '#A0AEC0', fontWeight: 600 }}>
          System Version: <strong>v1.3.0</strong> • Audio Engine: Pre-recorded Human Phonics
        </Typography>
      </Box>
    </Box>
  );
};

export default ProgressDashboard;
