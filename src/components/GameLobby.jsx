import React from 'react';
import { Box, Typography, Card, CardContent, CardActionArea, Grid } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { playClickSound, speakIntro } from '../utils/soundEngine';

const GAMES = [
  {
    id: 'train',
    title: 'Phonics Spelling Train',
    icon: '🚂',
    badge: 'New! Sight Words',
    desc: 'Listen to the word & sounds, build the letter train cars, and blow the whistle!',
    color: '#FF6D00',
    bgGradient: 'linear-gradient(135deg, #FF6D00 0%, #FFA726 100%)',
    audioIntro: 'train',
  },
  {
    id: 'balloons',
    title: 'Phonics Balloon Pop',
    icon: '🎈',
    badge: 'Popular',
    desc: 'Listen to the sound and pop the matching letter balloon!',
    color: '#FF4081',
    bgGradient: 'linear-gradient(135deg, #FF4081 0%, #FF80AB 100%)',
    audioIntro: 'balloons',
  },
  {
    id: 'fishing',
    title: 'Phonics Pond Fishing',
    icon: '🎣',
    badge: 'Fun Pond',
    desc: 'Listen to the sound and reel in the matching swimming fish!',
    color: '#00B0FF',
    bgGradient: 'linear-gradient(135deg, #00B0FF 0%, #80D8FF 100%)',
    audioIntro: 'fishing',
  },
  {
    id: 'matching',
    title: 'Sound & Picture Match',
    icon: '🧩',
    badge: 'Phonics Cards',
    desc: 'Match the letter sound to the word and picture!',
    color: '#7C4DFF',
    bgGradient: 'linear-gradient(135deg, #7C4DFF 0%, #B388FF 100%)',
    audioIntro: 'balloons',
  },
];

const GameLobby = ({ onSelectGame, activeProfile }) => {
  const handleCardClick = (game) => {
    playClickSound();
    speakIntro(game.audioIntro);
    onSelectGame(game.id);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1000, mx: 'auto', py: 3, px: 2, textAlign: 'center' }}>
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
        Welcome, {activeProfile?.name || 'Quinn'}! {activeProfile?.avatar || '🦄'}
      </Typography>

      <Typography
        variant="h6"
        sx={{
          color: '#555',
          fontWeight: 600,
          mb: 4,
          fontSize: { xs: '1rem', sm: '1.25rem' },
        }}
      >
        Pick a fun Phonics game to learn your letter sounds! 🔊✨
      </Typography>

      <Grid container spacing={3} justifyContent="center" alignItems="stretch">
        {GAMES.map((game) => (
          <Grid item xs={12} sm={6} md={4} key={game.id} sx={{ display: 'flex' }}>
            <Card
              className="glass-card"
              sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '28px',
                transition: 'transform 0.25s, box-shadow 0.25s',
                border: '3px solid rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: `0 16px 32px ${game.color}33`,
                },
              }}
            >
              <CardActionArea
                onClick={() => handleCardClick(game)}
                sx={{
                  p: 3,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Box>
                  <Box
                    sx={{
                      width: 90,
                      height: 90,
                      mx: 'auto',
                      mb: 2,
                      borderRadius: '50%',
                      background: game.bgGradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '3.2rem',
                      boxShadow: `0 8px 20px ${game.color}44`,
                    }}
                  >
                    {game.icon}
                  </Box>

                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      color: game.color,
                      mb: 1,
                      fontSize: { xs: '1.25rem', sm: '1.4rem' },
                    }}
                  >
                    {game.title}
                  </Typography>

                  <Typography variant="body1" sx={{ color: '#636E72', fontWeight: 600, px: 1 }}>
                    {game.desc}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    mt: 3,
                    py: 1,
                    px: 3,
                    borderRadius: '20px',
                    background: game.bgGradient,
                    color: '#FFF',
                    fontWeight: 800,
                    fontSize: '1.05rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <VolumeUpIcon fontSize="small" /> Play Now!
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Version & Audio Engine Info Footer */}
      <Box sx={{ mt: 5, pt: 2, borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
        <Typography variant="caption" sx={{ color: '#718096', fontWeight: 600, letterSpacing: '0.5px' }}>
          Quinn's Letter Sounds • <strong>v1.3.0</strong> • Pure Human Phonics Audio
        </Typography>
      </Box>
    </Box>
  );
};

export default GameLobby;
