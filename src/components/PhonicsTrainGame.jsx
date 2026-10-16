import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  LinearProgress,
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
  playCheerSound,
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

  // Game UI state
  const [isDrivingOff, setIsDrivingOff] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [wrongShake, setWrongShake] = useState(false);
  const [hintText, setHintText] = useState('');
  const [levelUpModalOpen, setLevelUpModalOpen] = useState(false);

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
    setIsDrivingOff(false);
    setIsEntering(true);

    setTimeout(() => {
      setIsEntering(false);
      speakWordSpellingPrompt(randomWordObj.word);
    }, 600);
  }, []);

  // Initialize word on mount and when level changes
  useEffect(() => {
    setupWord(currentLevel);
  }, [currentLevel, setupWord]);

  // Play word sound
  const handleReplayPrompt = () => {
    playClickSound();
    if (currentWordObj) {
      speakWordSpellingPrompt(currentWordObj.word);
    }
  };

  // Place letter onto track
  const handleDockLetterClick = (letterItem) => {
    if (isDrivingOff || letterItem.isPlaced) return;
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

  // Remove letter from track back to dock
  const handlePlacedLetterClick = (placedItem) => {
    if (isDrivingOff) return;
    playClickSound();
    setPlacedLetters((prev) => prev.filter((item) => item.id !== placedItem.id));
    setDockLetters((prev) =>
      prev.map((item) => (item.id === placedItem.id ? { ...item, isPlaced: false } : item))
    );
    setWrongShake(false);
  };

  // Give gentle clue
  const handleHintClick = () => {
    playClickSound();
    if (!currentWordObj) return;
    const word = currentWordObj.word;
    const firstChar = word[0];
    speakShortSound(firstChar);
    setHintText(`Hint: ${currentWordObj.hint} Starts with "${firstChar}"!`);
  };

  // Validate the spelled word (Whistle click)
  const handleCheckWord = () => {
    if (isDrivingOff || !currentWordObj) return;

    const spelled = placedLetters.map((l) => l.char).join('');
    const target = currentWordObj.word.toUpperCase();

    if (spelled === target) {
      // SUCCESS!
      playTrainWhistle();
      setTimeout(() => playTrainChug(), 350);
      setIsDrivingOff(true);

      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FF4081', '#7C4DFF', '#00E676', '#FFD600', '#00B0FF'],
      });

      const newStreak = streak + 1;
      const newCorrectInLevel = correctInLevel + 1;
      const newStars = stars + 1;
      setStreak(newStreak);
      setStars(newStars);

      // Check level advancement (15 words correct)
      const required = levelConfig.requiredCorrect || 15;
      let nextLevel = currentLevel;
      let nextCorrectInLevel = newCorrectInLevel;

      if (newCorrectInLevel >= required) {
        nextLevel = Math.min(19, currentLevel + 1);
        nextCorrectInLevel = 0;
        setTimeout(() => {
          setLevelUpModalOpen(true);
          playTrainLevelUp();
        }, 1200);
      } else {
        setTimeout(() => {
          speakSuccessPraise();
        }, 1000);
      }

      setCorrectInLevel(nextCorrectInLevel);

      // Record to backend SQLite
      if (onRecordResult) {
        onRecordResult(currentWordObj.word, true, nextLevel, newStreak, nextCorrectInLevel);
      }

      // Next word after driving off
      setTimeout(() => {
        if (nextLevel !== currentLevel) {
          setCurrentLevel(nextLevel);
        } else {
          setupWord(currentLevel);
        }
      }, 2600);
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
        setHintText(`Check your letters! Click a car to return it and try again!`);
      }
    }
  };

  const targetLength = currentWordObj ? currentWordObj.word.length : 3;

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
        {/* Sky Header: Word Prompt & Audio Controls */}
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
              Hear Word
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

          {/* Current Word & Clue */}
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
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: '#2D3748',
                  letterSpacing: '2px',
                  fontSize: { xs: '1.1rem', sm: '1.3rem' },
                }}
              >
                {currentWordObj.word}
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
              transition: isDrivingOff
                ? 'transform 2.2s cubic-bezier(0.25, 1, 0.5, 1)'
                : isEntering
                ? 'transform 0.5s ease-out'
                : 'none',
              transform: isDrivingOff
                ? 'translateX(130vw)'
                : isEntering
                ? 'translateX(-100vw)'
                : 'translateX(0)',
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
                boxShadow: '0 6px 12px rgba(0,0,0,0.25)',
                position: 'relative',
                ml: 0.5,
              }}
            >
              <Typography sx={{ fontSize: { xs: '2rem', sm: '2.5rem' }, lineHeight: 1 }}>🚂</Typography>

              {/* Steam Puffs */}
              <Box
                sx={{
                  position: 'absolute',
                  top: -18,
                  right: 18,
                  fontSize: '1.3rem',
                  animation: 'steamFloat 1.8s infinite',
                  '@keyframes steamFloat': {
                    '0%': { transform: 'translateY(0) scale(0.8)', opacity: 0.8 },
                    '100%': { transform: 'translateY(-20px) scale(1.4)', opacity: 0 },
                  },
                }}
              >
                💨
              </Box>

              {/* Engine Wheels */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -12,
                  display: 'flex',
                  gap: { xs: 2, sm: 2.8 },
                }}
              >
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    bgcolor: '#212121',
                    border: '3px solid #FFD600',
                  }}
                />
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    bgcolor: '#212121',
                    border: '3px solid #FFD600',
                  }}
                />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Validation Whistle Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 1, zIndex: 2 }}>
          <Button
            variant="contained"
            onClick={handleCheckWord}
            disabled={isDrivingOff || placedLetters.length === 0}
            sx={{
              background: 'linear-gradient(45deg, #FF9100, #FF3D00)',
              color: 'white',
              px: { xs: 3, sm: 5 },
              py: { xs: 1.2, sm: 1.6 },
              borderRadius: '30px',
              fontSize: { xs: '1.1rem', sm: '1.35rem' },
              fontWeight: 800,
              boxShadow: '0 6px 20px rgba(255, 61, 0, 0.4)',
              textTransform: 'none',
              display: 'flex',
              gap: 1.5,
              alignItems: 'center',
              '&:hover': {
                background: 'linear-gradient(45deg, #FF6D00, #DD2C00)',
                transform: 'scale(1.03)',
              },
            }}
          >
            <span>🚂💨</span>
            <span>Blow Whistle to Check!</span>
          </Button>
        </Box>
      </Paper>

      {/* THE LETTER DOCK (BOTTOM) */}
      <Box
        sx={{
          width: '100%',
          mt: 3,
          p: { xs: 2, sm: 3 },
          bgcolor: 'white',
          borderRadius: 4,
          boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
          border: '2px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 800,
            color: '#4A5568',
            mb: 2,
            textAlign: 'center',
            fontSize: { xs: '1rem', sm: '1.15rem' },
          }}
        >
          {levelConfig.mode === 'ordered'
            ? '👉 Tap each letter car in order to build your train!'
            : '👉 Tap the letters to put them on your train track!'}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: { xs: 1.5, sm: 2.5 },
          }}
        >
          {dockLetters.map((item, index) => {
            const carColor = CAR_COLORS[index % CAR_COLORS.length];

            return (
              <Box
                key={item.id}
                onClick={() => handleDockLetterClick(item)}
                sx={{
                  width: { xs: 64, sm: 78 },
                  height: { xs: 72, sm: 88 },
                  bgcolor: item.isPlaced ? '#CFD8DC' : carColor,
                  opacity: item.isPlaced ? 0.35 : 1,
                  borderRadius: '12px 12px 4px 4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  cursor: item.isPlaced ? 'default' : 'pointer',
                  boxShadow: item.isPlaced ? 'none' : '0 6px 14px rgba(0,0,0,0.15)',
                  position: 'relative',
                  transform: item.isPlaced ? 'scale(0.92)' : 'scale(1)',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  '&:hover': {
                    transform: item.isPlaced ? 'none' : 'scale(1.08) translateY(-4px)',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                    fontWeight: 800,
                    lineHeight: 1,
                    textShadow: item.isPlaced ? 'none' : '0 2px 4px rgba(0,0,0,0.25)',
                  }}
                >
                  {item.char}
                </Typography>

                {/* Dock Wheels */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -8,
                    display: 'flex',
                    gap: { xs: 2.2, sm: 3 },
                  }}
                >
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      bgcolor: '#37474F',
                      border: '2px solid #ECEFF1',
                    }}
                  />
                  <Box
                    sx={{
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      bgcolor: '#37474F',
                      border: '2px solid #ECEFF1',
                    }}
                  />
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* LEVEL UP MODAL */}
      <Dialog
        open={levelUpModalOpen}
        onClose={() => setLevelUpModalOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 5,
            p: 3,
            textAlign: 'center',
            maxWidth: 420,
            background: 'linear-gradient(135deg, #FFFDE7 0%, #FFF8E1 100%)',
          },
        }}
      >
        <DialogContent sx={{ p: 2 }}>
          <Typography sx={{ fontSize: '4rem', mb: 1 }}>🚂🎉</Typography>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#FF6D00', mb: 1 }}>
            Level Up!
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#37474F', mb: 2 }}>
            Quinn unlocked Level {currentLevel}!
          </Typography>
          <Typography variant="body1" sx={{ color: '#546E7A', mb: 3 }}>
            You spelled 15 words correctly! You are a super speller!
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => setLevelUpModalOpen(false)}
            sx={{
              borderRadius: '25px',
              fontWeight: 800,
              fontSize: '1.1rem',
              px: 4,
              py: 1.2,
            }}
          >
            Keep Chugging! 🚂
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PhonicsTrainGame;
