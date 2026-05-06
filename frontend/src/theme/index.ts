import { createTheme, alpha } from '@mui/material/styles';

const GOLD = '#C9A84C';
const GOLD_LIGHT = '#E8C96D';
const GOLD_DARK = '#8B6914';
const BLACK = '#080808';
const PAPER = '#111111';
const PAPER_ELEVATED = '#1A1A1A';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: GOLD,
      light: GOLD_LIGHT,
      dark: GOLD_DARK,
      contrastText: '#080808',
    },
    secondary: {
      main: GOLD_LIGHT,
      light: '#F5E098',
      dark: GOLD,
      contrastText: '#080808',
    },
    background: {
      default: BLACK,
      paper: PAPER,
    },
    text: {
      primary: '#F5F0E8',
      secondary: '#8A8280',
    },
    divider: alpha(GOLD, 0.18),
    success: { main: '#4CAF50', contrastText: '#fff' },
    warning: { main: '#FF9800', contrastText: '#000' },
    error: { main: '#EF5350', contrastText: '#fff' },
    info: { main: '#29B6F6', contrastText: '#000' },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Playfair Display", serif', fontWeight: 800 },
    h2: { fontFamily: '"Playfair Display", serif', fontWeight: 700 },
    h3: { fontFamily: '"Playfair Display", serif', fontWeight: 700 },
    h4: { fontFamily: '"Playfair Display", serif', fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '0.02em' },
    overline: { letterSpacing: '0.15em', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: BLACK },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: PAPER,
          border: `1px solid ${alpha(GOLD, 0.12)}`,
        },
        elevation0: { backgroundColor: 'transparent', border: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: PAPER,
          border: `1px solid ${alpha(GOLD, 0.12)}`,
          borderRadius: 16,
          boxShadow: `0 2px 20px rgba(0,0,0,0.5)`,
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
          '&:hover': {
            border: `1px solid ${alpha(GOLD, 0.35)}`,
            boxShadow: `0 8px 40px rgba(201,168,76,0.12), 0 2px 20px rgba(0,0,0,0.6)`,
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.9rem',
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${GOLD_DARK} 0%, ${GOLD} 50%, ${GOLD_LIGHT} 100%)`,
          color: '#080808',
          fontWeight: 700,
          boxShadow: `0 4px 15px ${alpha(GOLD, 0.3)}`,
          '&:hover': {
            background: `linear-gradient(135deg, #6B4F0A 0%, ${GOLD_DARK} 50%, ${GOLD} 100%)`,
            boxShadow: `0 6px 20px ${alpha(GOLD, 0.4)}`,
          },
        },
        containedSecondary: {
          background: `linear-gradient(135deg, ${GOLD_DARK} 0%, ${GOLD} 50%, ${GOLD_LIGHT} 100%)`,
          color: '#080808',
          fontWeight: 700,
          boxShadow: `0 4px 15px ${alpha(GOLD, 0.3)}`,
          '&:hover': {
            background: `linear-gradient(135deg, #6B4F0A 0%, ${GOLD_DARK} 50%, ${GOLD} 100%)`,
            boxShadow: `0 6px 20px ${alpha(GOLD, 0.4)}`,
          },
        },
        outlined: {
          borderColor: alpha(GOLD, 0.5),
          color: GOLD,
          '&:hover': {
            borderColor: GOLD,
            backgroundColor: alpha(GOLD, 0.08),
          },
        },
        outlinedPrimary: {
          borderColor: alpha(GOLD, 0.5),
          color: GOLD,
          '&:hover': { borderColor: GOLD, backgroundColor: alpha(GOLD, 0.08) },
        },
        outlinedSecondary: {
          borderColor: alpha(GOLD, 0.5),
          color: GOLD,
          '&:hover': { borderColor: GOLD, backgroundColor: alpha(GOLD, 0.08) },
        },
        outlinedError: {
          borderColor: alpha('#EF5350', 0.5),
          color: '#EF5350',
          '&:hover': { backgroundColor: alpha('#EF5350', 0.08) },
        },
        text: { color: GOLD, '&:hover': { backgroundColor: alpha(GOLD, 0.08) } },
        textError: { color: '#EF5350' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'rgba(8,8,8,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha(GOLD, 0.2)}`,
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': { borderColor: alpha(GOLD, 0.25) },
            '&:hover fieldset': { borderColor: alpha(GOLD, 0.5) },
            '&.Mui-focused fieldset': { borderColor: GOLD },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: GOLD },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: { color: alpha(GOLD, 0.6) },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& fieldset': { borderColor: alpha(GOLD, 0.25) },
          '&:hover fieldset': { borderColor: alpha(GOLD, 0.5) },
          '&.Mui-focused fieldset': { borderColor: GOLD },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { '&.Mui-focused': { color: GOLD } },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6 },
        outlinedPrimary: { borderColor: alpha(GOLD, 0.5), color: GOLD },
        outlinedSecondary: { borderColor: alpha(GOLD, 0.5), color: GOLD },
        colorSuccess: { backgroundColor: alpha('#4CAF50', 0.15), color: '#81C784' },
        colorWarning: { backgroundColor: alpha('#FF9800', 0.15), color: '#FFB74D' },
        colorError: { backgroundColor: alpha('#EF5350', 0.15), color: '#EF9A9A' },
        colorInfo: { backgroundColor: alpha('#29B6F6', 0.15), color: '#81D4FA' },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: alpha(GOLD, 0.15) },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8 },
        standardInfo: { backgroundColor: alpha('#29B6F6', 0.1), border: `1px solid ${alpha('#29B6F6', 0.2)}` },
        standardSuccess: { backgroundColor: alpha('#4CAF50', 0.1), border: `1px solid ${alpha('#4CAF50', 0.2)}` },
        standardWarning: { backgroundColor: alpha('#FF9800', 0.1), border: `1px solid ${alpha('#FF9800', 0.2)}` },
        standardError: { backgroundColor: alpha('#EF5350', 0.1), border: `1px solid ${alpha('#EF5350', 0.2)}` },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: PAPER_ELEVATED,
          border: `1px solid ${alpha(GOLD, 0.2)}`,
          borderRadius: 16,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: alpha(GOLD, 0.08),
            color: GOLD,
            fontWeight: 700,
            borderColor: alpha(GOLD, 0.2),
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: alpha(GOLD, 0.1) },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: alpha(GOLD, 0.04) },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderColor: alpha(GOLD, 0.25),
          color: '#8A8280',
          '&.Mui-selected': {
            backgroundColor: alpha(GOLD, 0.15),
            color: GOLD,
            borderColor: GOLD,
            '&:hover': { backgroundColor: alpha(GOLD, 0.2) },
          },
          '&:hover': { backgroundColor: alpha(GOLD, 0.06) },
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: { backgroundColor: 'transparent' },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          color: alpha(GOLD, 0.3),
          '&.Mui-active': { color: GOLD },
          '&.Mui-completed': { color: GOLD },
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          '&.Mui-active': { color: GOLD, fontWeight: 700 },
          '&.Mui-completed': { color: alpha(GOLD, 0.7) },
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: { color: GOLD },
        track: { backgroundColor: GOLD },
        thumb: {
          backgroundColor: GOLD,
          '&:hover': { boxShadow: `0 0 0 8px ${alpha(GOLD, 0.16)}` },
        },
        rail: { backgroundColor: alpha(GOLD, 0.2) },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: GOLD,
            '& + .MuiSwitch-track': { backgroundColor: GOLD },
          },
        },
      },
    },
    MuiPagination: {
      styleOverrides: {
        root: {},
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: alpha(GOLD, 0.2),
            color: GOLD,
            border: `1px solid ${alpha(GOLD, 0.4)}`,
            '&:hover': { backgroundColor: alpha(GOLD, 0.3) },
          },
        },
      },
    },
    MuiRating: {
      styleOverrides: {
        iconFilled: { color: GOLD },
        iconHover: { color: GOLD_LIGHT },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        barColorPrimary: { backgroundColor: GOLD },
        colorPrimary: { backgroundColor: alpha(GOLD, 0.2) },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: { color: '#F5F0E8' },
      },
    },
  },
});

export default theme;
