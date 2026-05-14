import { Autocomplete, TextField, alpha } from '@mui/material';

const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kochi'];
const GOLD = '#C9A84C';

interface Props {
  value: string;
  onChange: (city: string) => void;
  label?: string;
  placeholder?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  sx?: object;
}

export default function CityAutocomplete({
  value, onChange, label, placeholder, size = 'small',
  fullWidth = true, startAdornment, endAdornment, onKeyDown, sx,
}: Props) {
  return (
    <Autocomplete
      fullWidth={fullWidth}
      freeSolo
      options={CITIES}
      value={value}
      onInputChange={(_, val) => onChange(val)}
      onChange={(_, val) => { if (val) onChange(val); }}
      slotProps={{
        paper: {
          sx: {
            bgcolor: '#1a1a1a',
            border: `1px solid ${alpha(GOLD, 0.2)}`,
            borderRadius: 2,
            mt: 0.5,
            '& .MuiAutocomplete-option': {
              color: '#F5F0E8',
              '&:hover, &[aria-selected="true"]': { bgcolor: alpha(GOLD, 0.1) },
            },
          },
        },
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          size={size}
          onKeyDown={onKeyDown}
          sx={sx}
          InputProps={{
            ...params.InputProps,
            ...(startAdornment && { startAdornment }),
            ...(endAdornment && { endAdornment }),
          }}
        />
      )}
    />
  );
}
