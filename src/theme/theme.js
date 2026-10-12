import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#FF4081', // Playful Pink
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#7C4DFF', // Bright Purple
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#00E676', // Cheerful Green
    },
    warning: {
      main: '#FF9100', // Warm Orange
    },
    info: {
      main: '#00B0FF', // Sky Blue
    },
    background: {
      default: '#F3E5F5',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2D3436',
      secondary: '#636E72',
    },
  },
  typography: {
    fontFamily: '"Fredoka", "Quicksand", "Comic Sans MS", cursive, sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 800 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: {
      textTransform: 'none',
      fontWeight: 800,
      fontSize: '1.1rem',
    },
  },
  shape: {
    borderRadius: 24,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
          transition: 'all 0.2s ease-in-out',
          '&:active': {
            transform: 'scale(0.96)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 24,
        },
      },
    },
  },
});

export default theme;
