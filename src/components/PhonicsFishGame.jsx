import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Button, Paper, IconButton, Tooltip } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ReplayIcon from '@mui/icons-material/Replay';
import confetti from 'canvas-confetti';
import Fish from './Fish';
import { PHONICS_DATA, ALPHABET_KEYS } from '../utils/phonicsData';
import { selectWeightedTargetLetter } from '../utils/adaptiveLearning';
import {
  speakPhonicsPrompt,
  speakShortSound,
  speakSuccessPraise,
  playSplashSound,
  playReelSound,
  playCheerSound,
  playClickSound,
} from '../utils/soundEngine';

const PhonicsFishGame = ({
  level,
  onRecordResult,
  stats,
  settings,
  activeProfile,
}) => {
  const [targetLetter, setTargetLetter] = useState('F');
  const [fishList, setFishList] = useState([]);
  const [caughtLetters, setCaughtLetters] = useState({});
  const [isLocked, setIsLocked] = useState(false);
  const [bucketCount, setBucketCount] = useState(0);
  const [isReeling, setIsReeling] = useState(false);
  const [reelingFish, setReelingFish] = useState(null);
  const isInitialMount = useRef(true);

  const fishCount = Math.min(6, Math.max(2, level + 1));

  const generateNewQuestion = useCallback(() => {
    const target = selectWeightedTargetLetter(stats);
    setTargetLetter(target);
    setCaughtLetters({});
    setIsLocked(false);
    setIsReeling(false);
    setReelingFish(null);

    const availableDistractors = ALPHABET_KEYS.filter((l) => l !== target);
    const shuffledDistractors = [...availableDistractors].sort(() => 0.5 - Math.random());
    const chosenDistractors = shuffledDistractors.slice(0, fishCount - 1);

    const fullList = [target, ...chosenDistractors].sort(() => 0.5 - Math.random());

    const fishObjects = fullList.map((letter, index) => ({
      letter,
      colorIndex: (index + Math.floor(Math.random() * 6)) % 6,
    }));

    setFishList(fishObjects);

    setTimeout(() => {
      speakPhonicsPrompt(target);
    }, 200);
  }, [fishCount, stats]);

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

  const handleFishClick = (clickedLetter) => {
    if (isLocked || caughtLetters[clickedLetter]) return;

    setIsLocked(true);
    const isCorrect = clickedLetter.toUpperCase() === targetLetter.toUpperCase();

    if (isCorrect) {
      playReelSound();
      setIsReeling(true);
      setReelingFish(clickedLetter);

      setTimeout(() => {
        playSplashSound();
        setCaughtLetters((prev) => ({ ...prev, [clickedLetter]: true }));
        setBucketCount((prev) => prev + 1);

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00B0FF', '#00E676', '#FFD600', '#FF4081'],
        });

        playCheerSound();
        speakSuccessPraise();

        onRecordResult(targetLetter, true);

        setTimeout(() => {
          generateNewQuestion();
        }, 2200);
      }, 700);
    } else {
      playSplashSound();
      setCaughtLetters((prev) => ({ ...prev, [clickedLetter]: true }));
      onRecordResult(targetLetter, false);

      if (settings?.scrambleOnWrong) {
        setTimeout(() => {
          setFishList((prev) => [...prev].sort(() => 0.5 - Math.random()));
          setIsLocked(false);
        }, 600);
      } else {
        setTimeout(() => {
          setIsLocked(false);
        }, 500);
      }
    }
  };

  const phonicsInfo = PHONICS_DATA[targetLetter] || PHONICS_DATA['F'];

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 950,
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
            Catch the fish with the sound:
          </Typography>

          <Button
            variant="contained"
            color="info"
            onClick={handlePlayShortSound}
            startIcon={<VolumeUpIcon />}
            sx={{
              borderRadius: '24px',
              px: 2.5,
              py: 0.8,
              fontSize: '1.2rem',
              fontWeight: 800,
              bgcolor: '#00B0FF',
              '&:hover': { bgcolor: '#0091EA' },
            }}
          >
            "{phonicsInfo.sound}" 🎣
          </Button>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Typography
            variant="body1"
            sx={{
              color: '#636E72',
              fontWeight: 700,
              fontSize: { xs: '0.95rem', sm: '1.1rem' },
            }}
          >
            Like in <strong>{phonicsInfo.word}</strong> {phonicsInfo.emoji}
          </Typography>

          <Tooltip title="Listen to prompt again">
            <IconButton
              onClick={handleReplayPrompt}
              size="small"
              sx={{
                bgcolor: 'rgba(0, 176, 255, 0.12)',
                color: '#00B0FF',
                '&:hover': { bgcolor: 'rgba(0, 176, 255, 0.25)' },
              }}
            >
              <ReplayIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Pond Arena */}
      <Paper
        sx={{
          width: '100%',
          minHeight: { xs: 300, sm: 380 },
          borderRadius: '32px',
          background: 'linear-gradient(180deg, #81D4FA 0%, #29B6F6 40%, #0288D1 100%)',
          boxShadow: 'inset 0 10px 20px rgba(0,0,0,0.15), 0 12px 28px rgba(2, 136, 209, 0.25)',
          p: { xs: 2, sm: 3 },
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Fisher Girl & Bucket Status Top Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 1, zIndex: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: '2.4rem' }}>👧🎣</Typography>
            <Typography sx={{ fontWeight: 800, color: '#FFF', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              {activeProfile?.name || 'Quinn'}'s Pond
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(8px)',
              px: 2,
              py: 0.8,
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Typography sx={{ fontSize: '1.4rem' }}>🪣</Typography>
            <Typography sx={{ fontWeight: 800, color: '#FFF', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
              Caught: {bucketCount}
            </Typography>
          </Box>
        </Box>

        {/* Swimming Fish Container */}
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: { xs: 2, sm: 3, md: 4 },
            my: 'auto',
            py: 2,
            zIndex: 1,
          }}
        >
          {fishList.map(({ letter, colorIndex }) => (
            <Fish
              key={`${letter}-${colorIndex}`}
              letter={letter}
              colorIndex={colorIndex}
              isCaught={!!caughtLetters[letter]}
              onClick={handleFishClick}
              letterCase={settings?.letterCase || 'both'}
            />
          ))}
        </Box>

        {/* Water Ripple Decor at Bottom */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-around',
            opacity: 0.4,
            color: '#FFF',
            fontSize: '1.2rem',
          }}
        >
          <span>〰️ 🫧</span>
          <span>🫧 🌿</span>
          <span>〰️ 🫧</span>
        </Box>
      </Paper>
    </Box>
  );
};

export default PhonicsFishGame;
