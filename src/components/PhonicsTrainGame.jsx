import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import confetti from 'canvas-confetti';
import { TRAIN_LEVELS, getLevelConfig, getGradeForLevel } from '../utils/trainWordsData';
import {
  speakWordSpellingPrompt,
  speakShortSound,
  playTrainWhistle,
  playTrainChug,
  playTrainWrongHint,
  playTrainLevelUp,
  playClickSound,
  speakSuccessPraise,
} from '../utils/soundEngine';

const CAR_COLORS = ['#FF4081', '#7C4DFF', '#00E676', '#FFD600', '#FF9100', '#00B0FF', '#E040FB'];

const PhonicsTrainGame = ({
  level: initialLevel = 1,
  onRecordResult,
  stats = {},
  trainProgress = {},
  activeProfile,
  onBackToLobby,
}) => {
  const [currentLevel, setCurrentLevel] = useState(trainProgress.level || initialLevel || 1);
  const [correctInLevel, setCorrectInLevel] = useState(trainProgress.correct_in_level || 0);
  const [streak, setStreak] = useState(trainProgress.streak || 0);
  const [stars, setStars] = useState(trainProgress.total_words_spelled || 0);

  // Current word state
  const [currentWordObj, setCurrentWordObj] = useState(null);
  const [dockLetters, setDockLetters] = useState([]); // array of { id, char, isPlaced }
  const [placedLetters, setPlacedLetters] = useState([]); // array of { id, char }

  // Train animation state: 'off-left' -> 'entering' -> 'station' -> 'exiting'
  const [trainStatus, setTrainStatus] = useState('off-left');
  const [wrongShake, setWrongShake] = useState(false);
  const [hintText, setHintText] = useState('');
  const [levelUpModalOpen, setLevelUpModalOpen] = useState(false);

  // Keep in sync with external level updates (e.g. from navbar level selector)
  useEffect(() => {
    if (trainProgress.level && trainProgress.level !== currentLevel) {
      setCurrentLevel(trainProgress.level);
    }
  }, [trainProgress.level]);

  const levelConfig = getLevelConfig(currentLevel);

  // Generate word & letter cars for current level
  const setupWord = useCallback((levelNum) => {
    const config = getLevelConfig(levelNum);
    const words = config.words;
    const randomWordObj = words[Math.floor(Math.random() * words.length)];
    setCurrentWordObj(randomWordObj);

    const targetChars = randomWordObj.word.toUpperCase().split('');
    const lettersPool = targetChars.map((char, idx) => ({
      id: `target_${idx}_${char}_${Date.now()}_${Math.random()}`,
      char,
      isDistractor: false,
    }));

    // Add distractors if level config requires
    const distractorCount = config.distractorCount || 0;
    if (distractorCount > 0) {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
      const available = alphabet.filter((c) => !targetChars.includes(c));
      for (let i = 0; i < distractorCount; i++) {
        const randChar = available[Math.floor(Math.random() * available.length)];
        lettersPool.push({
          id: `distractor_${i}_${randChar}_${Date.now()}_${Math.random()}`,
          char: randChar,
          isDistractor: true,
        });
      }
    }

    // Scramble unless level 1 ('ordered')
    let finalDock = [...lettersPool];
    if (config.mode === 'scrambled') {
      finalDock.sort(() => Math.random() - 0.5);
    }

    setDockLetters(finalDock.map((item) => ({ ...item, isPlaced: false })));
    setPlacedLetters([]);
    setHintText('');
    setWrongShake(false);

    // Enter Left Animation: Start off-screen left, then smoothly roll into the station
    setTrainStatus('off-left');
    setTimeout(() => {
      setTrainStatus('entering');
    }, 40);

    // Once arrived at station, play spoken prompt
    setTimeout(() => {
      setTrainStatus('station');
      speakWordSpellingPrompt(randomWordObj.word);
    }, 2050);
  }, []);

  // Initialize word on mount and when level changes
  useEffect(() => {
    setupWord(currentLevel);
  }, [currentLevel, setupWord]);

  // Replay word sound
  const handleReplayPrompt = () => {
    playClickSound();
    if (currentWordObj) {
      speakWordSpellingPrompt(currentWordObj.word);
    }
  };

  // Place letter onto track (click)
  const handleDockLetterClick = (letterItem) => {
    if (trainStatus !== 'station' || letterItem.isPlaced) return;
    const targetLength = currentWordObj ? currentWordObj.word.length : 3;
    if (placedLetters.length >= targetLength) return;

    speakShortSound(letterItem.char);

    setDockLetters((prev) =>
      prev.map((item) => (item.id === letterItem.id ? { ...item, isPlaced: true } : item))
    );
    setPlacedLetters((prev) => [...prev, letterItem]);
    setWrongShake(false);
    setHintText('');
  };

  // Remove letter from track back to dock (click)
  const handlePlacedLetterClick = (placedItem) => {
    if (trainStatus !== 'station') return;
    playClickSound();
    setPlacedLetters((prev) => prev.filter((item) => item.id !== placedItem.id));
    setDockLetters((prev) =>
      prev.map((item) => (item.id === placedItem.id ? { ...item, isPlaced: false } : item))
    );
    setWrongShake(false);
  };

  // Hint button
  const handleHintClick = () => {
    playClickSound();
    if (!currentWordObj) return;
    const word = currentWordObj.word;
    const firstChar = word[0];
    speakShortSound(firstChar);
    setHintText(`Hint: ${currentWordObj.hint} Starts with the sound of "${firstChar}"!`);
  };

  // Validate the spelled word (Whistle click or Enter key)
  const handleCheckWord = useCallback(() => {
    if (trainStatus !== 'station' || !currentWordObj) return;

    const spelled = placedLetters.map((l) => l.char).join('');
    const target = currentWordObj.word.toUpperCase();

    if (spelled === target) {
      // SUCCESS!
      // 1. Play realistic train whistle and chugachuga choo-choo departure audio
      playTrainWhistle();
      setTimeout(() => playTrainChug(), 350);

      // 2. Start moving slower off the screen to the right (exit right)
      setTrainStatus('exiting');

      confetti({
        particleCount: 75,
        spread: 85,
        origin: { y: 0.6 },
        colors: ['#FF4081', '#7C4DFF', '#00E676', '#FFD600', '#00B0FF'],
      });

      const newStreak = streak + 1;
      const newCorrectInLevel = correctInLevel + 1;
      const newStars = stars + 1;
      setStreak(newStreak);
      setStars(newStars);

      // Check level advancement (15 words required)
      const required = levelConfig.requiredCorrect || 15;
      let nextLevel = currentLevel;
      let nextCorrectInLevel = newCorrectInLevel;

      if (newCorrectInLevel >= required) {
        nextLevel = Math.min(19, currentLevel + 1);
        nextCorrectInLevel = 0;
        setTimeout(() => {
          setLevelUpModalOpen(true);
          playTrainLevelUp();
        }, 1600);
      } else {
        setTimeout(() => {
          speakSuccessPraise();
        }, 1200);
      }

      setCorrectInLevel(nextCorrectInLevel);

      // Record to backend SQLite
      if (onRecordResult) {
        onRecordResult(currentWordObj.word, true, nextLevel, newStreak, nextCorrectInLevel);
      }

      // Next word enters from the left after train finishes pulling off
      setTimeout(() => {
        if (nextLevel !== currentLevel) {
          setCurrentLevel(nextLevel);
        } else {
          setupWord(currentLevel);
        }
      }, 3700);
    } else {
      // INCORRECT OR INCOMPLETE
      playTrainWrongHint();
      setWrongShake(true);

      if (onRecordResult) {
        onRecordResult(currentWordObj.word, false, currentLevel, 0, correctInLevel);
      }
      setStreak(0);

      if (placedLetters.length < target.length) {
        setHintText(`Keep going! Add all ${target.length} letters to finish the train!`);
      } else {
        setHintText(`Check your letters! Click a car or press Backspace to change them!`);
      }
    }
  }, [trainStatus, currentWordObj, placedLetters, streak, correctInLevel, stars, levelConfig, currentLevel, onRecordResult, setupWord]);

  // Keyboard typing support:
  // - Letters A-Z: only available letters in dock, placed into first open slot
  // - Backspace / Delete: removes rightmost placed letter
  // - Enter: validates word
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (levelUpModalOpen || trainStatus !== 'station') return;

      // Backspace / Delete: remove rightmost car
      if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        setPlacedLetters((prev) => {
          if (prev.length === 0) return prev;
          const lastPlaced = prev[prev.length - 1];
          playClickSound();
          setDockLetters((dock) =>
            dock.map((item) => (item.id === lastPlaced.id ? { ...item, isPlaced: false } : item))
          );
          return prev.slice(0, prev.length - 1);
        });
        setWrongShake(false);
        return;
      }

      // Enter: blow whistle / check word
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCheckWord();
        return;
      }

      // Letters A-Z
      const keyUpper = e.key.toUpperCase();
      if (/^[A-Z]$/.test(keyUpper)) {
        const targetLen = currentWordObj ? currentWordObj.word.length : 3;
        if (placedLetters.length >= targetLen) return;

        // Find matching letter in dock that is not yet placed
        const availableItem = dockLetters.find(
          (item) => !item.isPlaced && item.char === keyUpper
        );

        if (availableItem) {
          e.preventDefault();
          speakShortSound(availableItem.char);
          setDockLetters((prev) =>
            prev.map((item) => (item.id === availableItem.id ? { ...item, isPlaced: true } : item))
          );
          setPlacedLetters((prev) => [...prev, availableItem]);
          setWrongShake(false);
          setHintText('');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dockLetters, placedLetters, currentWordObj, trainStatus, levelUpModalOpen, handleCheckWord]);

  const targetLength = currentWordObj ? currentWordObj.word.length : 3;

  // Compute CSS transform and transition based on train animation state
  let trainTransform = 'translateX(0)';
  let trainTransition = 'none';

  if (trainStatus === 'off-left') {
    trainTransform = 'translateX(-120vw)';
    trainTransition = 'none';
  } else if (trainStatus === 'entering') {
    trainTransform = 'translateX(0)';
    trainTransition = 'transform 2.0s cubic-bezier(0.12, 0.9, 0.2, 1.0)';
  } else if (trainStatus === 'exiting') {
    trainTransform = 'translateX(130vw)';
    trainTransition = 'transform 3.6s cubic-bezier(0.35, 0.05, 0.15, 1)';
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 1040,
        mx: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        px: { xs: 1, sm: 2 },
        py: { xs: 1, sm: 2 },
        position: 'relative',
        userSelect: 'none',
      }}
    >
      {/* Top Navigation & Status Bar */}
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 2,
        }}
      >
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={onBackToLobby}
          sx={{
            borderRadius: '20px',
            borderColor: 'rgba(0,0,0,0.15)',
            color: '#4A5568',
            fontWeight: 700,
            bgcolor: 'white',
            '&:hover': { bgcolor: '#F7FAFC' },
          }}
        >
          Lobby
        </Button>

        {/* Level & Grade Badge */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={`${levelConfig.grade} • Level ${currentLevel}`}
            color="primary"
            sx={{ fontWeight: 800, fontSize: '0.9rem', px: 1 }}
          />
          <Chip
            icon={<StarIcon sx={{ color: '#FFD600 !important' }} />}
            label={`${stars} Words`}
            sx={{ bgcolor: 'white', fontWeight: 800, border: '1px solid #E2E8F0' }}
          />
          {streak > 1 && (
            <Chip
              label={`🔥 ${streak} in a row!`}
              sx={{ bgcolor: '#FFF5F5', color: '#E53E3E', fontWeight: 800, border: '1px solid #FED7D7' }}
            />
          )}
        </Box>

        {/* Level Progression Tracker (15 Words) */}
        <Box sx={{ minWidth: 160, display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#4A5568', mb: 0.3 }}>
            🚂 {correctInLevel} / {levelConfig.requiredCorrect || 15} to Next Level
          </Typography>
          <Box sx={{ width: '100%', height: 10, bgcolor: 'rgba(0,0,0,0.08)', borderRadius: 5, overflow: 'hidden' }}>
            <Box
              sx={{
                width: `${Math.min(100, (correctInLevel / (levelConfig.requiredCorrect || 15)) * 100)}%`,
                height: '100%',
                bgcolor: '#00E676',
                borderRadius: 5,
                transition: 'width 0.4s ease',
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Main Railroad Stage */}
      <Paper
        elevation={4}
        sx={{
          width: '100%',
          bgcolor: 'linear-gradient(180deg, #E0F7FA 0%, #E8F5E9 100%)',
          background: 'linear-gradient(180deg, #B3E5FC 0%, #C8E6C9 60%, #81C784 100%)',
          borderRadius: 4,
          p: { xs: 2, sm: 3 },
          position: 'relative',
          overflow: 'hidden',
          minHeight: 380,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '3px solid #81D4FA',
        }}
      >
        {/* Sky Header: Word Audio Controls & Mystery Icon (NO WORD TEXT DISPLAYED) */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1,
            zIndex: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              variant="contained"
              color="secondary"
              startIcon={<VolumeUpIcon />}
              onClick={handleReplayPrompt}
              sx={{
                borderRadius: '24px',
                px: 2.5,
                py: 1,
                fontWeight: 800,
                fontSize: { xs: '0.9rem', sm: '1.05rem' },
                boxShadow: '0 4px 14px rgba(124, 77, 255, 0.4)',
              }}
            >
              Hear Word 🔊
            </Button>
            <Tooltip title="Need a hint?">
              <IconButton
                onClick={handleHintClick}
                sx={{ bgcolor: 'white', boxShadow: 1, color: '#FFB300', '&:hover': { bgcolor: '#FFFDE7' } }}
              >
                <LightbulbIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Picture Clue & Length Mystery Dots — (WORD IS NOT DISPLAYED TO PREVENT CHEATING) */}
          {currentWordObj && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                bgcolor: 'rgba(255, 255, 255, 0.9)',
                px: 2.5,
                py: 0.8,
                borderRadius: '24px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
              }}
            >
              <Typography sx={{ fontSize: '1.8rem', lineHeight: 1 }}>{currentWordObj.emoji}</Typography>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 800,
                  color: '#718096',
                  letterSpacing: '3px',
                }}
              >
                {Array(currentWordObj.word.length).fill('●').join(' ')}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Hint Notice */}
        {hintText && (
          <Box
            sx={{
              mt: 1,
              p: 1,
              bgcolor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: 2,
              textAlign: 'center',
              border: '1px solid #FFD54F',
              zIndex: 2,
            }}
          >
            <Typography variant="body2" sx={{ color: '#D97706', fontWeight: 700 }}>
              💡 {hintText}
            </Typography>
          </Box>
        )}

        {/* THE RAILROAD TRACK & MOVING TRAIN */}
        <Box
          sx={{
            position: 'relative',
            my: { xs: 3, sm: 4 },
            width: '100%',
            height: 140,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          {/* Railroad Track Visual Elements */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 22,
              left: 0,
              right: 0,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              backgroundImage:
                'repeating-linear-gradient(90deg, #5D4037 0px, #5D4037 12px, transparent 12px, transparent 28px)',
              borderTop: '4px solid #78909C',
              borderBottom: '4px solid #78909C',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          />

          {/* THE TRAIN (Locomotive + Placed Cars) */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              gap: 1,
              transition: trainTransition,
              transform: trainTransform,
              animation: wrongShake ? 'shake 0.5s' : 'none',
              '@keyframes shake': {
                '0%, 100%': { transform: 'translateX(0)' },
                '20%, 60%': { transform: 'translateX(-8px)' },
                '40%, 80%': { transform: 'translateX(8px)' },
              },
            }}
          >
            {/* Placed Letter Cars */}
            {Array.from({ length: targetLength }).map((_, index) => {
              const placed = placedLetters[index];
              const carColor = CAR_COLORS[index % CAR_COLORS.length];

              return placed ? (
                // Occupied Letter Train Car
                <Box
                  key={placed.id}
                  onClick={() => handlePlacedLetterClick(placed)}
                  sx={{
                    width: { xs: 68, sm: 84 },
                    height: { xs: 76, sm: 94 },
                    bgcolor: carColor,
                    borderRadius: '12px 12px 4px 4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'transform 0.15s',
                    '&:hover': { transform: 'scale(1.05)' },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: '2rem', sm: '2.6rem' },
                      fontWeight: 800,
                      lineHeight: 1,
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    }}
                  >
                    {placed.char}
                  </Typography>

                  {/* Wheels */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: -10,
                      display: 'flex',
                      gap: { xs: 2.5, sm: 3.5 },
                    }}
                  >
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        bgcolor: '#263238',
                        border: '3px solid #ECEFF1',
                      }}
                    />
                    <Box
                      sx={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        bgcolor: '#263238',
                        border: '3px solid #ECEFF1',
                      }}
                    />
                  </Box>
                </Box>
              ) : (
                // Empty Track Slot
                <Box
                  key={`empty_${index}`}
                  sx={{
                    width: { xs: 68, sm: 84 },
                    height: { xs: 76, sm: 94 },
                    border: '3px dashed rgba(255, 255, 255, 0.85)',
                    bgcolor: 'rgba(255, 255, 255, 0.25)',
                    borderRadius: '12px 12px 4px 4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 800,
                    fontSize: '1.4rem',
                  }}
                >
                  {index + 1}
                </Box>
              );
            })}

            {/* Locomotive Steam Engine at the front of the train */}
            <Box
              sx={{
                width: { xs: 85, sm: 105 },
                height: { xs: 80, sm: 98 },
                bgcolor: '#C2185B',
                background: 'linear-gradient(135deg, #E91E63 0%, #880E4F 100%)',
                borderRadius: '6px 20px 4px 4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: '0 6px 14px rgba(0,0,0,0.25)',
                position: 'relative',
              }}
            >
              {/* Smokestack & Animated Steam */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -24,
                  right: 18,
                  width: 18,
                  height: 24,
                  bgcolor: '#37474F',
                  borderRadius: '4px 4px 0 0',
                }}
              >
                {/* Steam Puff Animation */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -16,
                    left: -2,
                    fontSize: '1.4rem',
                    animation: trainStatus === 'exiting' ? 'fastSmoke 0.4s infinite' : 'slowSmoke 1.5s infinite',
                    '@keyframes fastSmoke': {
                      '0%': { transform: 'translateY(0) scale(0.6)', opacity: 0.9 },
                      '100%': { transform: 'translateY(-24px) scale(1.6)', opacity: 0 },
                    },
                    '@keyframes slowSmoke': {
                      '0%': { transform: 'translateY(0) scale(0.8)', opacity: 0.8 },
                      '100%': { transform: 'translateY(-14px) scale(1.2)', opacity: 0 },
                    },
                  }}
                >
                  💨
                </Box>
              </Box>

              {/* Locomotive Cab Window & Headlight */}
              <Box
                sx={{
                  width: 28,
                  height: 26,
                  bgcolor: '#FFE082',
                  border: '2px solid #5D4037',
                  borderRadius: 2,
                  mb: 0.5,
                  boxShadow: 'inset 0 0 4px rgba(0,0,0,0.3)',
                }}
              />
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 800, letterSpacing: 0.5 }}>
                CHO-CHO
              </Typography>

              {/* Locomotive Wheels */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -12,
                  display: 'flex',
                  gap: 1.5,
                }}
              >
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    bgcolor: '#212121',
                    border: '3px solid #ECEFF1',
                  }}
                />
                <Box
                  sx={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    bgcolor: '#D32F2F',
                    border: '3px solid #FFF',
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Whistle Validation Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', zIndex: 2, mt: 1 }}>
          <Button
            variant="contained"
            color="success"
            size="large"
            disabled={trainStatus !== 'station' || placedLetters.length === 0}
            onClick={handleCheckWord}
            sx={{
              borderRadius: '28px',
              px: { xs: 3, sm: 5 },
              py: 1.5,
              fontWeight: 900,
              fontSize: { xs: '1.1rem', sm: '1.3rem' },
              background: 'linear-gradient(45deg, #00E676 30%, #00C853 90%)',
              boxShadow: '0 6px 18px rgba(0, 230, 118, 0.4)',
              transform: placedLetters.length === targetLength ? 'scale(1.04)' : 'none',
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'scale(1.08)',
                background: 'linear-gradient(45deg, #00C853 30%, #00B0FF 90%)',
              },
            }}
          >
            🚂💨 Toot! Check Word
          </Button>
        </Box>
      </Paper>

      {/* Station Platform Dock (Available Letters) */}
      <Box
        sx={{
          width: '100%',
          mt: 2.5,
          p: { xs: 2, sm: 2.5 },
          bgcolor: 'white',
          borderRadius: 4,
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          border: '2px solid rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', mb: 1.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#2D3748' }}>
            Station Letter Cars 🚉 (Click or Type)
          </Typography>
          <Chip
            icon={<KeyboardIcon fontSize="small" />}
            label="Type or Click!"
            size="small"
            sx={{ bgcolor: '#EDF2F7', fontWeight: 700, color: '#4A5568' }}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: { xs: 1.5, sm: 2 },
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 90,
          }}
        >
          {dockLetters.map((item, idx) => {
            const isUsed = item.isPlaced;
            const carColor = CAR_COLORS[idx % CAR_COLORS.length];

            return (
              <Box
                key={item.id}
                onClick={() => handleDockLetterClick(item)}
                sx={{
                  width: { xs: 68, sm: 82 },
                  height: { xs: 74, sm: 90 },
                  bgcolor: isUsed ? 'rgba(0,0,0,0.06)' : carColor,
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isUsed ? 'rgba(0,0,0,0.2)' : 'white',
                  cursor: isUsed || trainStatus !== 'station' ? 'default' : 'pointer',
                  boxShadow: isUsed ? 'none' : '0 6px 14px rgba(0,0,0,0.18)',
                  border: isUsed ? '2px dashed rgba(0,0,0,0.15)' : 'none',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: isUsed ? 'scale(0.92)' : 'scale(1)',
                  '&:hover': {
                    transform: isUsed || trainStatus !== 'station' ? 'scale(0.92)' : 'scale(1.08)',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: '2.2rem', sm: '2.8rem' },
                    fontWeight: 900,
                    lineHeight: 1,
                    textShadow: isUsed ? 'none' : '0 2px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  {item.char}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Level Up Celebration Dialog */}
      <Dialog
        open={levelUpModalOpen}
        onClose={() => setLevelUpModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '28px',
            p: 2,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #FFFDE7 0%, #FFFFFF 100%)',
            border: '4px solid #FFD600',
          },
        }}
      >
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <EmojiEventsIcon sx={{ fontSize: '5rem', color: '#FFD600', animation: 'bounce 1s infinite' }} />
          <Typography variant="h4" sx={{ fontWeight: 900, color: '#D97706' }}>
            All Aboard! 🚂⭐
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#2D3748' }}>
            Level Complete!
          </Typography>
          <Typography variant="body1" sx={{ color: '#4A5568', fontWeight: 600 }}>
            Awesome job spelling 15 words! You've advanced to Level {currentLevel}!
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => {
              playClickSound();
              setLevelUpModalOpen(false);
            }}
            sx={{
              borderRadius: '24px',
              px: 4,
              py: 1.2,
              fontWeight: 800,
              fontSize: '1.1rem',
              mt: 1,
            }}
          >
            Keep Chugging! 🚀
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PhonicsTrainGame;
