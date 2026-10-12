import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { playClickSound } from '../utils/soundEngine';

const AVATARS = [
  '🦄', '🦊', '🦁', '🐻', '🐼', '🐰',
  '🐶', '🐱', '🦋', '🦖', '🐬', '🐙',
  '🚀', '👑', '🌈', '⭐', '🎈', '🎨',
];

const ProfileModal = ({
  open,
  onClose,
  profiles = [],
  activeProfile,
  onSelectProfile,
  onCreateProfile,
  onUpdateAvatar,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦄');

  const handleSelect = (profile) => {
    playClickSound();
    onSelectProfile(profile.id);
    onClose();
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    playClickSound();
    onCreateProfile(newName.trim(), selectedAvatar);
    setNewName('');
    setIsCreating(false);
    onClose();
  };

  const handleChangeAvatar = (avatar) => {
    playClickSound();
    if (activeProfile) {
      onUpdateAvatar(activeProfile.id, avatar);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
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
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#2D3436' }}>
          Player Profiles 🌟
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Existing Profiles List */}
        {!isCreating ? (
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: '#636E72' }}>
              Choose who is playing:
            </Typography>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              {profiles.map((p) => {
                const isActive = p.id === activeProfile?.id;
                return (
                  <Grid item xs={6} sm={4} key={p.id}>
                    <Paper
                      onClick={() => handleSelect(p)}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        border: isActive ? '3px solid #FF4081' : '2px solid rgba(0,0,0,0.08)',
                        bgcolor: isActive ? '#FFF0F5' : '#FFF',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'scale(1.04)' },
                      }}
                    >
                      <Typography sx={{ fontSize: '2.5rem', mb: 0.5 }}>{p.avatar}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#2D3436' }}>
                        {p.name}
                      </Typography>
                      {isActive && (
                        <Chip label="Active" size="small" sx={{ mt: 0.5, bgcolor: '#FF4081', color: '#FFF', fontWeight: 800 }} />
                      )}
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>

            {/* Avatar Selector for Active Profile */}
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#2D3436' }}>
              Change {activeProfile?.name || 'Quinn'}'s Avatar:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {AVATARS.map((av) => (
                <IconButton
                  key={av}
                  onClick={() => handleChangeAvatar(av)}
                  sx={{
                    fontSize: '1.6rem',
                    p: 0.8,
                    bgcolor: activeProfile?.avatar === av ? '#FF408122' : 'transparent',
                    border: activeProfile?.avatar === av ? '2px solid #FF4081' : 'none',
                    borderRadius: '12px',
                  }}
                >
                  {av}
                </IconButton>
              ))}
            </Box>

            <Button
              variant="outlined"
              color="secondary"
              startIcon={<AddIcon />}
              onClick={() => { playClickSound(); setIsCreating(true); }}
              fullWidth
              sx={{ borderRadius: '20px', py: 1, fontWeight: 800 }}
            >
              Add New Profile
            </Button>
          </Box>
        ) : (
          /* Create New Profile Form */
          <Box sx={{ pt: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#2D3436' }}>
              Create New Profile (No Passwords Required!)
            </Typography>

            <TextField
              label="Child's Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              fullWidth
              autoFocus
              sx={{ mb: 2 }}
            />

            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1, color: '#2D3436' }}>
              Pick an Avatar:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {AVATARS.map((av) => (
                <IconButton
                  key={av}
                  onClick={() => { playClickSound(); setSelectedAvatar(av); }}
                  sx={{
                    fontSize: '1.6rem',
                    p: 0.8,
                    bgcolor: selectedAvatar === av ? '#7C4DFF22' : 'transparent',
                    border: selectedAvatar === av ? '2px solid #7C4DFF' : 'none',
                    borderRadius: '12px',
                  }}
                >
                  {av}
                </IconButton>
              ))}
            </Box>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => { playClickSound(); setIsCreating(false); }}
                fullWidth
                sx={{ borderRadius: '20px' }}
              >
                Back
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={handleCreate}
                disabled={!newName.trim()}
                fullWidth
                sx={{ borderRadius: '20px', fontWeight: 800 }}
              >
                Create & Play!
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
