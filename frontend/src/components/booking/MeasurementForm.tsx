import { useState } from 'react';
import {
  Box, Typography, ToggleButton, ToggleButtonGroup, TextField,
  Grid, Button, Collapse, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Alert,
} from '@mui/material';
import { Straighten, Inventory2, InfoOutlined } from '@mui/icons-material';
import type { GarmentType, MeasurementType } from '../../types';

interface Props {
  garmentType: GarmentType;
  measurementType: MeasurementType;
  measurements: Record<string, string>;
  onTypeChange: (type: MeasurementType) => void;
  onMeasurementsChange: (m: Record<string, string>) => void;
}

const FIELDS: Partial<Record<GarmentType, Array<{ key: string; label: string }>>> = {
  blouse: [
    { key: 'bust', label: 'Bust (cm)' },
    { key: 'waist', label: 'Waist (cm)' },
    { key: 'hip', label: 'Hip (cm)' },
    { key: 'shoulderWidth', label: 'Shoulder Width (cm)' },
    { key: 'sleeveLength', label: 'Sleeve Length (cm)' },
    { key: 'blouseLength', label: 'Blouse Length (cm)' },
  ],
  salwar_kameez: [
    { key: 'bust', label: 'Bust (cm)' },
    { key: 'waist', label: 'Waist (cm)' },
    { key: 'hip', label: 'Hip (cm)' },
    { key: 'shoulderWidth', label: 'Shoulder Width (cm)' },
    { key: 'sleeveLength', label: 'Sleeve Length (cm)' },
    { key: 'kurtaLength', label: 'Kurta Length (cm)' },
    { key: 'salwarLength', label: 'Salwar/Churidar Length (cm)' },
  ],
  lehenga: [
    { key: 'waist', label: 'Waist (cm)' },
    { key: 'hip', label: 'Hip (cm)' },
    { key: 'skirtLength', label: 'Skirt Length (cm)' },
    { key: 'bust', label: 'Bust — for blouse (cm)' },
    { key: 'shoulderWidth', label: 'Shoulder Width (cm)' },
    { key: 'sleeveLength', label: 'Sleeve Length (cm)' },
    { key: 'blouseLength', label: 'Blouse Length (cm)' },
  ],
  dress: [
    { key: 'bust', label: 'Bust (cm)' },
    { key: 'waist', label: 'Waist (cm)' },
    { key: 'hip', label: 'Hip (cm)' },
    { key: 'shoulderWidth', label: 'Shoulder Width (cm)' },
    { key: 'sleeveLength', label: 'Sleeve Length (cm)' },
    { key: 'dressLength', label: 'Dress Length (cm)' },
  ],
  mens_shirt: [
    { key: 'chest', label: 'Chest (cm)' },
    { key: 'waist', label: 'Waist (cm)' },
    { key: 'shoulder', label: 'Shoulder (cm)' },
    { key: 'sleeveLength', label: 'Sleeve Length (cm)' },
    { key: 'shirtLength', label: 'Shirt Length (cm)' },
    { key: 'collar', label: 'Collar / Neck (cm)' },
  ],
  mens_pants: [
    { key: 'waist', label: 'Waist (cm)' },
    { key: 'hip', label: 'Hip (cm)' },
    { key: 'inseam', label: 'Inseam (cm)' },
    { key: 'outseam', label: 'Outseam (cm)' },
    { key: 'thigh', label: 'Thigh (cm)' },
  ],
  kurta: [
    { key: 'chest', label: 'Chest (cm)' },
    { key: 'waist', label: 'Waist (cm)' },
    { key: 'shoulder', label: 'Shoulder (cm)' },
    { key: 'sleeveLength', label: 'Sleeve Length (cm)' },
    { key: 'kurtaLength', label: 'Kurta Length (cm)' },
  ],
  other: [
    { key: 'bust', label: 'Bust / Chest (cm)' },
    { key: 'waist', label: 'Waist (cm)' },
    { key: 'hip', label: 'Hip (cm)' },
  ],
};

const WOMEN_CHART = [
  { size: 'XS (32)', bust: 80, waist: 62, hip: 86 },
  { size: 'S (34)', bust: 86, waist: 68, hip: 92 },
  { size: 'M (36)', bust: 92, waist: 74, hip: 98 },
  { size: 'L (38)', bust: 98, waist: 80, hip: 104 },
  { size: 'XL (40)', bust: 104, waist: 86, hip: 110 },
  { size: 'XXL (42)', bust: 110, waist: 92, hip: 116 },
];

const MEN_CHART = [
  { size: 'S (38)', chest: 96, waist: 76, shoulder: 42 },
  { size: 'M (40)', chest: 101, waist: 81, shoulder: 44 },
  { size: 'L (42)', chest: 106, waist: 86, shoulder: 46 },
  { size: 'XL (44)', chest: 111, waist: 91, shoulder: 48 },
  { size: 'XXL (46)', chest: 116, waist: 96, shoulder: 50 },
];

const isMens = (g: GarmentType) => g === 'mens_shirt' || g === 'mens_pants' || g === 'kurta';
const isAlteration = (g: GarmentType) => g === 'alteration';

export default function MeasurementForm({ garmentType, measurementType, measurements, onTypeChange, onMeasurementsChange }: Props) {
  const [showChart, setShowChart] = useState(false);
  const fields = FIELDS[garmentType] ?? [];
  const mens = isMens(garmentType);
  const alteration = isAlteration(garmentType);

  const handleField = (key: string, value: string) => {
    onMeasurementsChange({ ...measurements, [key]: value });
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
        Measurements
      </Typography>

      <ToggleButtonGroup
        value={measurementType}
        exclusive
        onChange={(_, v) => v && onTypeChange(v)}
        size="small"
        sx={{ mb: 2 }}
      >
        <ToggleButton value="custom" sx={{ gap: 0.5, px: 2 }}>
          <Straighten fontSize="small" /> Enter Measurements
        </ToggleButton>
        <ToggleButton value="send_sample" sx={{ gap: 0.5, px: 2 }}>
          <Inventory2 fontSize="small" /> Send Sample Garment
        </ToggleButton>
      </ToggleButtonGroup>

      {measurementType === 'send_sample' && (
        <Alert severity="info" icon={<Inventory2 />} sx={{ mb: 1 }}>
          Bring a well-fitting garment to the tailor's shop — they will use it as the reference for stitching.
        </Alert>
      )}

      {measurementType === 'custom' && !alteration && (
        <>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">
              All measurements in centimetres (cm)
            </Typography>
            <Button
              size="small"
              startIcon={<InfoOutlined />}
              onClick={() => setShowChart((s) => !s)}
            >
              {showChart ? 'Hide' : 'View'} Size Chart
            </Button>
          </Box>

          <Collapse in={showChart}>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2, borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell><strong>Size</strong></TableCell>
                    {mens ? (
                      <>
                        <TableCell align="center">Chest</TableCell>
                        <TableCell align="center">Waist</TableCell>
                        <TableCell align="center">Shoulder</TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell align="center">Bust</TableCell>
                        <TableCell align="center">Waist</TableCell>
                        <TableCell align="center">Hip</TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(mens ? MEN_CHART : WOMEN_CHART).map((row) => (
                    <TableRow key={row.size} hover>
                      <TableCell>
                        <Chip label={row.size} size="small" variant="outlined" />
                      </TableCell>
                      {mens ? (
                        <>
                          <TableCell align="center">{(row as typeof MEN_CHART[0]).chest}</TableCell>
                          <TableCell align="center">{(row as typeof MEN_CHART[0]).waist}</TableCell>
                          <TableCell align="center">{(row as typeof MEN_CHART[0]).shoulder}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell align="center">{(row as typeof WOMEN_CHART[0]).bust}</TableCell>
                          <TableCell align="center">{(row as typeof WOMEN_CHART[0]).waist}</TableCell>
                          <TableCell align="center">{(row as typeof WOMEN_CHART[0]).hip}</TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Collapse>

          <Grid container spacing={1.5}>
            {fields.map(({ key, label }) => (
              <Grid item xs={12} sm={6} key={key}>
                <TextField
                  label={label}
                  type="number"
                  size="small"
                  fullWidth
                  value={measurements[key] ?? ''}
                  onChange={(e) => handleField(key, e.target.value)}
                  inputProps={{ min: 0, step: 0.5 }}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {alteration && measurementType === 'custom' && (
        <Alert severity="info">
          For alterations, please describe the changes needed in the Notes field below.
        </Alert>
      )}
    </Box>
  );
}
