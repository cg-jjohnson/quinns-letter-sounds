import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Typography, Button, Paper, IconButton, Tooltip } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ReplayIcon from '@mui/icons-material/Replay';
import confetti from 'canvas-confetti';
import Balloon from './Balloon';
import { PHONICS_DATA, ALPHABET_KEYS } from '../utils/phonicsData';
import { selectWeightedTargetLetter } from '../utils/adaptiveLearning';
import {
  speakPhonicsPrompt,
  speakShortSound,
  speakSuccessPraise,
  playPopSound,
  playCheerSound,
  playLevelUpFanfare,
  playClickSound,
} from '../utils/soundEngine';

const PhonicsBalloonGame = ({
  level,
  onLevelUp,
  onRecordResult,
  stats,
  settings,
  activeProfile,
}) => {
  const [targetLetter, setTargetLetter] = useState('A');
  const [balloons, setBalloons] = useState([]);
  const [poppedLetters, setPoppedLetters] = useState({});
  const [isLocked, setIsLocked] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const isInitialMount = useRef(true);

  // Determine number of balloons based on level (Lvl 1: 2, Lvl 2: 3, Lvl 3: 4, Lvl 4: 5, Lvl 5+: 6)
  const balloonCount = Math.min(6, Math.max(2, level + 1));

  // Generate question with target letter and distractors
  const generateNewQuestion = useCallback(() => {
    const target = selectWeightedTargetLetter(stats);
    setTargetLetter(target);
    setPoppedLetters({});
    setIsLocked(false);
    setShowHint(settings?.soundHintEnabled ?? true);

    const availableDistractors = ALPHABET_KEYS.filter((l) => l !== target);
    const shuffledDistractors = [...availableDistractors].sort(() => 0.5 - Math.random());
    const chosenDistractors = shuffledDistractors.slice(0, balloonCount - 1);

    const fullList = [target, ...chosenDistractors].sort(() => 0.5 - Math.random());

    const balloonObjects = fullList.map((letter, index) => ({
      letter,
      colorIndex: (index + Math.floor(Math.random() * 8)) % 8,
    }));

    setBalloons(balloonObjects);

    // Prompt audio
    setTimeout(() => {
      speakPhonicsPrompt(target);
    }, 200);
  }, [balloonCount, stats, settings]);

  // Initial question load
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      generateNewQuestion();
    }
  }, [generateNewQuestion]);

  // Replay sound
  const handleReplayPrompt = () => {
    playClickSound();
    speakPhonicsPrompt(targetLetter);
  };

  const handlePlayShortSound = () => {
    playClickSound();
    speakShortSound(targetLetter);
  };

  // Handle balloon click
  const handleBalloonClick = (clickedLetter) => {
    if (isLocked || poppedLetters[clickedLetter]) return;

    setIsLocked(true);
    playPopSound();

    const isCorrect = clickedLetter.toUpperCase() === targetLetter.toUpperCase();

    // Visual pop
    setPoppedLetters((prev) => ({ ...prev, [clickedLetter]: true }));

    // Record result in parent stats & server
    onRecordResult(targetLetter, isCorrect);

    if (isCorrect) {
      // Confetti & Praises!
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FF4081', '#7C4DFF', '#00E676', '#FF9100', '#00B0FF'],
      });

      playCheerSound();
      speakSuccessPraise();

      setTimeout(() => {
        generateNewQuestion();
      }, 2200);
    } else {
      // Wrong balloon
      if (settings?.scrambleOnWrong) {
        setTimeout(() => {
          setBalloons((prev) => [...prev].sort(() => 0.5 - Math.random()));
          setIsLocked(false);
        }, 600);
      } else {
        setTimeout(() => {
          setIsLocked(false);
        }, 500);
      }
    }
  };

  const phonicsInfo = PHONICS_DATA[targetLetter] || PHONICS_DATA['A'];

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
            Which letter makes the sound:
          </Typography>

          <Button
            variant="contained"
            color="primary"
            onClick={handlePlayShortSound}
            startIcon={<VolumeUpIcon />}
            sx={{
              borderRadius: '24px',
              px: 2.5,
              py: 0.8,
              fontSize: '1.2rem',
              fontWeight: 800,
              bgcolor: '#FF4081',
              '&:hover': { bgcolor: '#F50057' },
            }}
          >
            "{phonicsInfo.sound}" 🔊
          </Button>
        </Box>

        {/* Word and Picture Association Hint */}
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

      {/* Floating Balloons Arena */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: { xs: 2, sm: 3, md: 4 },
          minHeight: { xs: 280, sm: 360 },
          width: '100%',
        }}
      >
        {balloons.map(({ letter, colorIndex }) => (
          <Balloon
            key={`${letter}-${colorIndex}`}
            letter={letter}
            colorIndex={colorIndex}
            isPopped={!!poppedLetters[letter]}
            balloonCount={balloonCount}
            onClick={handleBalloonClick}
            letterCase={settings?.letterCase || 'both'}
            hintEmoji={settings?.soundHintEnabled ? PHONICS_DATA[letter]?.emoji : null}
          />
        ))}
      </Box>
    </Box>
  );
};

export default PhonicsBalloonGame;
