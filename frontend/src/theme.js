import { createTheme } from '@mui/material/styles';

// Modern warm theme with amber/beige tones and glassmorphism
export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#f59e0b', // Amber 500
      light: '#fbbf24', // Amber 400
      dark: '#d97706', // Amber 600
      contrastText: '#1c1917', // Stone 900
    },
    secondary: {
      main: '#ec4899', // Pink 500
      light: '#f472b6', // Pink 400
      dark: '#db2777', // Pink 600
      contrastText: '#ffffff',
    },
    background: {
      default: '#1c1917', // Stone 900
      paper: 'rgba(41, 37, 36, 0.6)', // Stone 800 with transparency
    },
    text: {
      primary: '#fafaf9', // Stone 50
      secondary: '#e7e5e4', // Stone 200
    },
    error: {
      main: '#ef4444',
    },
    warning: {
      main: '#f59e0b',
    },
    success: {
      main: '#10b981',
    },
    info: {
      main: '#8b5cf6', // Purple 500
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(12px)',
          borderRadius: 12,
          padding: '10px 24px',
          boxShadow: '0 4px 20px rgba(245, 158, 11, 0.15)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 30px rgba(245, 158, 11, 0.25)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(245, 158, 11, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(20px)',
          background: 'rgba(41, 37, 36, 0.6)',
          border: '1px solid rgba(245, 158, 11, 0.15)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px rgba(245, 158, 11, 0.2)',
            borderColor: 'rgba(245, 158, 11, 0.3)',
          },
        },
      },
    },
  },
});
