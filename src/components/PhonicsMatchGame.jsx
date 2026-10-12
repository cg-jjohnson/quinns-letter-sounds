import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Button, Paper, Card, CardActionArea, IconButton, Tooltip, Grid } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ReplayIcon from '@mui/icons-material/Replay';
import confetti from 'canvas-confetti';
import { PHONICS_DATA, ALPHABET_KEYS } from '../utils/phonicsData';
import { selectWeightedTargetLetter } from '../utils/adaptiveLearning';
import {
  speakPhonicsPrompt,
  speakShortSound,
  speakSuccessPraise,
  playCheerSound,
  playClickSound,
} from '../utils/soundEngine';

const PhonicsMatchGame = ({
  level,
  onRecordResult,
  stats,
  settings,
  activeProfile,
}) => {
  const [targetLetter, setTargetLetter] = useState('C');
  const [cards, setCards] = useState([]);
  const [wrongCards, setWrongCards] = useState({});
  const [isLocked, setIsLocked] = useState(false);
  const isInitialMount = useRef(true);

  const cardCount = Math.min(4, Math.max(2, level + 1));

  const generateNewQuestion = useCallback(() => {
    const target = selectWeightedTargetLetter(stats);
    setTargetLetter(target);
    setWrongCards({});
    setIsLocked(false);

    const availableDistractors = ALPHABET_KEYS.filter((l) => l !== target);
    const shuffledDistractors = [...availableDistractors].sort(() => 0.5 - Math.random());
    const chosenDistractors = shuffledDistractors.slice(0, cardCount - 1);

    const fullList = [target, ...chosenDistractors].sort(() => 0.5 - Math.random());

    const cardObjects = fullList.map((letter) => ({
      letter,
      data: PHONICS_DATA[letter],
    }));

    setCards(cardObjects);

    setTimeout(() => {
      speakPhonicsPrompt(target);
    }, 200);
  }, [cardCount, stats]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      generateNewQuestion();
    }
  }, [generateNewQuestion]);

  const handleReplayPrompt = () => {
    playClickSound();
    speakPhonicsPrompt(targetLetter);
  };

  const handlePlayShortSound = () => {
    playClickSound();
    speakShortSound(targetLetter);
  };

  const handleCardClick = (letter) => {
    if (isLocked || wrongCards[letter]) return;

    setIsLocked(true);
    playClickSound();

    const isCorrect = letter.toUpperCase() === targetLetter.toUpperCase();

    if (isCorrect) {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#7C4DFF', '#00E676', '#FF4081', '#FFD600'],
      });

      playCheerSound();
      speakSuccessPraise();
      onRecordResult(targetLetter, true);

      setTimeout(() => {
        generateNewQuestion();
      }, 2200);
    } else {
      setWrongCards((prev) => ({ ...prev, [letter]: true }));
      onRecordResult(targetLetter, false);
      setTimeout(() => {
        setIsLocked(false);
      }, 500);
    }
  };

  const phonicsInfo = PHONICS_DATA[targetLetter] || PHONICS_DATA['C'];

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 900,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 1.5, sm: 3 },
        px: 2,
      }}
    >
      {/* Phonics Sound Prompt Card */}
      <Paper
        className="glass-card"
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: { xs: 2, sm: 3 },
          width: '100%',
          maxWidth: 680,
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: '#2D3436',
              fontSize: { xs: '1.2rem', sm: '1.5rem' },
            }}
          >
            Which picture starts with the sound:
          </Typography>

          <Button
            variant="contained"
            color="secondary"
            onClick={handlePlayShortSound}
            startIcon={<VolumeUpIcon />}
            sx={{
              borderRadius: '24px',
              px: 2.5,
              py: 0.8,
              fontSize: '1.2rem',
              fontWeight: 800,
              bgcolor: '#7C4DFF',
              '&:hover': { bgcolor: '#651FFF' },
            }}
          >
            "{phonicsInfo.sound}" 🧩
          </Button>

          <Tooltip title="Listen again">
            <IconButton
              onClick={handleReplayPrompt}
              size="small"
              sx={{
                bgcolor: 'rgba(124, 77, 255, 0.12)',
                color: '#7C4DFF',
                '&:hover': { bgcolor: 'rgba(124, 77, 255, 0.25)' },
              }}
            >
              <ReplayIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Picture Cards Grid */}
      <Grid container spacing={3} justifyContent="center" sx={{ maxWidth: 800 }}>
        {cards.map(({ letter, data }) => {
          const isWrong = !!wrongCards[letter];
          return (
            <Grid item xs={6} sm={6} md={3} key={letter}>
              <Card
                className="glass-card"
                sx={{
                  borderRadius: '28px',
                  border: isWrong ? '3px solid #EF5350' : '3px solid rgba(255,255,255,0.8)',
                  opacity: isWrong ? 0.45 : 1,
                  transform: isWrong ? 'scale(0.95)' : 'none',
                  transition: 'all 0.25s ease',
                  '&:hover': {
                    transform: isWrong ? 'scale(0.95)' : 'translateY(-8px) scale(1.03)',
                  },
                }}
              >
                <CardActionArea
                  onClick={() => handleCardClick(letter)}
                  sx={{
                    p: 2.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Typography sx={{ fontSize: { xs: '3.5rem', sm: '4.5rem' } }}>
                    {data.emoji}
                  </Typography>

                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      color: data.color || '#2D3436',
                      fontSize: { xs: '1.2rem', sm: '1.4rem' },
                    }}
                  >
                    {data.word}
                  </Typography>

                  <Box
                    sx={{
                      bgcolor: 'rgba(124, 77, 255, 0.1)',
                      color: '#7C4DFF',
                      px: 2,
                      py: 0.5,
                      borderRadius: '16px',
                      fontWeight: 800,
                      fontSize: '1rem',
                    }}
                  >
                    Letter {data.letter}
                  </Box>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default PhonicsMatchGame;
