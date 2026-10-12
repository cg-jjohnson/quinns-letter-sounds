import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Divider,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import { playClickSound, speakPhonicsSoundOnly } from '../utils/soundEngine';

const AdminPanelModal = ({
  open,
  onClose,
  settings = {},
  onUpdateSettings,
}) => {
  const handleToggle = (key) => (e) => {
    playClickSound();
    onUpdateSettings({ [key]: e.target.checked });
  };

  const handleCaseChange = (e) => {
    playClickSound();
    onUpdateSettings({ letterCase: e.target.value });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
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
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#2D3436' }}>
          Parent & Admin Panel ⚙️
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Phonics Sound Hint Mode */}
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings?.soundHintEnabled ?? true}
                onChange={handleToggle('soundHintEnabled')}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography sx={{ fontWeight: 800, color: '#2D3436' }}>
                  Show Picture / Emoji Hint 🍎
                </Typography>
                <Typography variant="caption" sx={{ color: '#636E72' }}>
                  Displays word association emojis on balloons/cards
                </Typography>
              </Box>
            }
          />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Challenge Scramble Mode */}
        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={settings?.scrambleOnWrong ?? false}
                onChange={handleToggle('scrambleOnWrong')}
                color="secondary"
              />
            }
            label={
              <Box>
                <Typography sx={{ fontWeight: 800, color: '#2D3436' }}>
                  Challenge Mode: Scramble on Wrong 🔀
                </Typography>
                <Typography variant="caption" sx={{ color: '#636E72' }}>
                  Reshuffles balloon / fish positions if missed
                </Typography>
              </Box>
            }
          />
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* Letter Case Display */}
        <FormControl component="fieldset" sx={{ width: '100%', mb: 2 }}>
          <FormLabel component="legend" sx={{ fontWeight: 800, color: '#2D3436', mb: 0.5 }}>
            Letter Display Case
          </FormLabel>
          <RadioGroup
            value={settings?.letterCase || 'both'}
            onChange={handleCaseChange}
          >
            <FormControlLabel value="both" control={<Radio color="primary" />} label="Both (Aa, Bb, Cc)" />
            <FormControlLabel value="uppercase" control={<Radio color="primary" />} label="Uppercase Only (A, B, C)" />
            <FormControlLabel value="lowercase" control={<Radio color="primary" />} label="Lowercase Only (a, b, c)" />
          </RadioGroup>
        </FormControl>

        <Divider sx={{ my: 1.5 }} />

        {/* Audio Test Button */}
        <Box sx={{ textAlign: 'center', mt: 1 }}>
          <Button
            variant="outlined"
            startIcon={<VolumeUpIcon />}
            onClick={() => speakPhonicsSoundOnly('A')}
            size="small"
            sx={{ borderRadius: '20px', fontWeight: 700 }}
          >
            Test Phonics Voice (Letter A)
          </Button>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={onClose}
          fullWidth
          sx={{ borderRadius: '20px', fontWeight: 800 }}
        >
          Save & Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdminPanelModal;
