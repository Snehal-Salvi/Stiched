import { Box, CircularProgress } from '@mui/material';

export default function PageLoader() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <CircularProgress color="secondary" />
    </Box>
  );
}
