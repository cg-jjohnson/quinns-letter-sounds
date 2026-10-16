import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider, CssBaseline, Box, Container } from '@mui/material';
import theme from './theme/theme';
import NavBar from './components/NavBar';
import GameLobby from './components/GameLobby';
import PhonicsBalloonGame from './components/PhonicsBalloonGame';
import PhonicsFishGame from './components/PhonicsFishGame';
import PhonicsMatchGame from './components/PhonicsMatchGame';
import PhonicsTrainGame from './components/PhonicsTrainGame';
import ProgressDashboard from './components/ProgressDashboard';
import ProfileModal from './components/ProfileModal';
import LevelSelectorModal from './components/LevelSelectorModal';
import AdminPanelModal from './components/AdminPanelModal';
import OrientationWarningOverlay from './components/OrientationWarningOverlay';

export default function App() {
  const [activeTab, setActiveTab] = useState('game'); // 'game' | 'stats'
  const [activeGame, setActiveGame] = useState('lobby'); // 'lobby' | 'train' | 'balloons' | 'fishing' | 'matching'
  
  // Profile & State
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState({ id: 1, name: 'Quinn', avatar: '🦄' });
  const [progress, setProgress] = useState({ level: 1, streak: 0, best_streak: 0, correct_in_level: 0 });
  const [trainProgress, setTrainProgress] = useState({ level: 1, correct_in_level: 0, total_words_spelled: 0, streak: 0, best_streak: 0 });
  const [stats, setStats] = useState({ letters: {} });
  const [wordStats, setWordStats] = useState({ words: {} });
  const [settings, setSettings] = useState({ soundHintEnabled: true, scrambleOnWrong: false, letterCase: 'both' });

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Load Active Profile and Data from Backend API
  const loadActiveProfileData = useCallback(async () => {
    try {
      const res = await fetch('/api/profiles/active');
      if (res.ok) {
        const data = await res.json();
        if (data.profile) setActiveProfile(data.profile);
        if (data.progress) setProgress(data.progress);
        if (data.trainProgress) setTrainProgress(data.trainProgress);
        if (data.letters) setStats({ letters: data.letters });
        if (data.words) setWordStats({ words: data.words });
        if (data.settings) setSettings(data.settings);
      }
    } catch (e) {
      console.warn('Backend offline, using fallback local state:', e);
    }
  }, []);

  const loadProfilesList = useCallback(async () => {
    try {
      const res = await fetch('/api/profiles');
      if (res.ok) {
        const data = await res.json();
        if (data.profiles) setProfiles(data.profiles);
      }
    } catch (e) {
      console.warn('Failed to load profiles list', e);
    }
  }, []);

  useEffect(() => {
    loadActiveProfileData();
    loadProfilesList();
  }, [loadActiveProfileData, loadProfilesList]);

  // Handle Question Result
  const handleRecordResult = async (letter, isCorrect) => {
    const newStreak = isCorrect ? (progress.streak || 0) + 1 : 0;
    const newBest = Math.max(progress.best_streak || 0, newStreak);
    const newCorrectInLevel = isCorrect ? (progress.correct_in_level || 0) + 1 : (progress.correct_in_level || 0);

    // Auto level up every 10 correct answers (up to level 5)
    let newLevel = progress.level || 1;
    if (newCorrectInLevel >= 10 && newLevel < 5) {
      newLevel += 1;
    }

    const updatedProgress = {
      ...progress,
      streak: newStreak,
      best_streak: newBest,
      correct_in_level: newCorrectInLevel >= 10 ? 0 : newCorrectInLevel,
      level: newLevel,
    };
    setProgress(updatedProgress);

    // Update local stats
    const currentLetters = stats.letters || {};
    const currentLtr = currentLetters[letter] || { correct: 0, total: 0 };
    const updatedLetters = {
      ...currentLetters,
      [letter]: {
        correct: currentLtr.correct + (isCorrect ? 1 : 0),
        total: currentLtr.total + 1,
      },
    };
    setStats({ letters: updatedLetters });

    // Sync to backend SQLite
    try {
      await fetch('/api/stats/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: activeProfile.id,
          letter,
          isCorrect,
          level: newLevel,
          streak: newStreak,
          correctInLevel: updatedProgress.correct_in_level,
        }),
      });
    } catch (e) {
      console.error('Failed to sync stat to server', e);
    }
  };

  // Handle Phonics Train Word Result
  const handleRecordTrainResult = async (word, isCorrect, newLevel, newStreak, newCorrectInLevel) => {
    const upperWord = word.toUpperCase();
    const prevWordStat = wordStats.words[upperWord] || { correct: 0, total: 0 };
    const updatedWordStat = {
      correct: prevWordStat.correct + (isCorrect ? 1 : 0),
      total: prevWordStat.total + 1,
    };
    const updatedWords = { ...wordStats.words, [upperWord]: updatedWordStat };
    setWordStats({ words: updatedWords });

    const newBest = Math.max(trainProgress.best_streak || 0, newStreak);
    const newTotalWords = (trainProgress.total_words_spelled || 0) + (isCorrect ? 1 : 0);
    const updatedTrainProg = {
      ...trainProgress,
      level: newLevel,
      streak: newStreak,
      best_streak: newBest,
      correct_in_level: newCorrectInLevel,
      total_words_spelled: newTotalWords,
    };
    setTrainProgress(updatedTrainProg);

    try {
      await fetch('/api/train/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: activeProfile.id,
          word: upperWord,
          isCorrect,
          level: newLevel,
          streak: newStreak,
          correctInLevel: newCorrectInLevel,
        }),
      });
    } catch (e) {
      console.error('Failed to sync train stat to server', e);
    }
  };

  // Reset Stats
  const handleResetStats = async () => {
    if (!window.confirm('Reset all phonics scores for this player?')) return;
    try {
      await fetch('/api/stats/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: activeProfile.id }),
      });
      await fetch('/api/train/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: activeProfile.id }),
      });
      setStats({ letters: {} });
      setWordStats({ words: {} });
      setProgress((p) => ({ ...p, streak: 0, best_streak: 0, correct_in_level: 0 }));
      setTrainProgress((p) => ({ ...p, streak: 0, best_streak: 0, correct_in_level: 0 }));
    } catch (e) {
      console.error('Failed to reset stats', e);
    }
  };

  // Profile management
  const handleSelectProfile = async (id) => {
    try {
      await fetch(`/api/profiles/${id}/select`, { method: 'POST' });
      loadActiveProfileData();
      loadProfilesList();
    } catch (e) {
      console.error('Failed to switch profile', e);
    }
  };

  const handleCreateProfile = async (name, avatar) => {
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar }),
      });
      if (res.ok) {
        loadActiveProfileData();
        loadProfilesList();
      }
    } catch (e) {
      console.error('Failed to create profile', e);
    }
  };

  const handleUpdateAvatar = async (id, avatar) => {
    try {
      await fetch(`/api/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar }),
      });
      setActiveProfile((p) => ({ ...p, avatar }));
      loadProfilesList();
    } catch (e) {
      console.error('Failed to update avatar', e);
    }
  };

  // Settings
  const handleUpdateSettings = async (newSetting) => {
    const merged = { ...settings, ...newSetting };
    setSettings(merged);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSetting),
      });
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <OrientationWarningOverlay />

      {/* Floating Animated Clouds Background */}
      <div className="clouds-bg">
        <div className="cloud cloud-1" />
        <div className="cloud cloud-2" />
        <div className="cloud cloud-3" />
      </div>

      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <NavBar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeGame={activeGame}
          onGameChange={setActiveGame}
          level={progress.level || 1}
          onOpenLevelSelector={() => setIsLevelModalOpen(true)}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
          onOpenAdminPanel={() => setIsAdminModalOpen(true)}
          activeProfile={activeProfile}
          streak={progress.streak || 0}
        />

        <Container maxWidth="lg" sx={{ flexGrow: 1, py: { xs: 1, sm: 2 } }}>
          {activeTab === 'stats' ? (
            <ProgressDashboard
              stats={stats}
              activeProfile={activeProfile}
              progress={progress}
              trainProgress={trainProgress}
              wordStats={wordStats}
              onResetStats={handleResetStats}
            />
          ) : activeGame === 'lobby' ? (
            <GameLobby
              onSelectGame={setActiveGame}
              activeProfile={activeProfile}
            />
          ) : activeGame === 'train' ? (
            <PhonicsTrainGame
              level={trainProgress.level || 1}
              onRecordResult={handleRecordTrainResult}
              stats={stats}
              trainProgress={trainProgress}
              activeProfile={activeProfile}
              onBackToLobby={() => setActiveGame('lobby')}
            />
          ) : activeGame === 'balloons' ? (
            <PhonicsBalloonGame
              level={progress.level || 1}
              onLevelUp={() => setProgress((p) => ({ ...p, level: (p.level || 1) + 1 }))}
              onRecordResult={handleRecordResult}
              stats={stats}
              settings={settings}
              activeProfile={activeProfile}
            />
          ) : activeGame === 'fishing' ? (
            <PhonicsFishGame
              level={progress.level || 1}
              onRecordResult={handleRecordResult}
              stats={stats}
              settings={settings}
              activeProfile={activeProfile}
            />
          ) : (
            <PhonicsMatchGame
              level={progress.level || 1}
              onRecordResult={handleRecordResult}
              stats={stats}
              settings={settings}
              activeProfile={activeProfile}
            />
          )}
        </Container>

        {/* Dialog Modals */}
        <ProfileModal
          open={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          profiles={profiles}
          activeProfile={activeProfile}
          onSelectProfile={handleSelectProfile}
          onCreateProfile={handleCreateProfile}
          onUpdateAvatar={handleUpdateAvatar}
        />

        <LevelSelectorModal
          open={isLevelModalOpen}
          onClose={() => setIsLevelModalOpen(false)}
          currentLevel={progress.level || 1}
          onSelectLevel={(lvl) => setProgress((p) => ({ ...p, level: lvl }))}
        />

        <AdminPanelModal
          open={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />
      </Box>
    </ThemeProvider>
  );
}
