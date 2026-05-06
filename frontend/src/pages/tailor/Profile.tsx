import { useState, useEffect, useRef } from 'react';
import {
  Container, Grid, Typography, Paper, TextField, Button, Box,
  Chip, CircularProgress, Stack, Switch, FormControlLabel,
  Alert, IconButton, ImageList, ImageListItem, ImageListItemBar,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { Add, Delete, CloudUpload, Save } from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { toast } from 'react-toastify';
import {
  getMyTailorProfile, createTailorProfile,
  updateTailorProfile, addShopPhoto, removeShopPhoto,
} from '../../api/tailors';
import type { Tailor } from '../../types';
import { SERVICE_CATEGORIES } from '../../types';
import PageLoader from '../../components/common/PageLoader';

interface ServiceField {
  name: string;
  category: string;
  price: number;
  turnaroundDays: number;
  description: string;
}

interface ProfileForm {
  shopName: string;
  description: string;
  experience: number;
  isAvailable: boolean;
  city: string;
  state: string;
  pincode: string;
  services: ServiceField[];
}

export default function TailorProfile() {
  const [tailor, setTailor] = useState<Tailor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const isNew = !tailor;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    defaultValues: {
      shopName: '', description: '', experience: 0, isAvailable: true,
      city: '', state: '', pincode: '',
      services: [{ name: '', category: "Women's Wear", price: 0, turnaroundDays: 7, description: '' }],
    },
  });

  const { fields: serviceFields, append, remove } = useFieldArray({ control, name: 'services' });

  useEffect(() => {
    getMyTailorProfile()
      .then(({ data }) => {
        setTailor(data);
        reset({
          shopName: data.shopName,
          description: data.description,
          experience: data.experience,
          isAvailable: data.isAvailable,
          city: data.location.city,
          state: data.location.state,
          pincode: data.location.pincode,
          services: data.services.length > 0
            ? data.services.map((s) => ({
                name: s.name,
                category: s.category,
                price: s.price,
                turnaroundDays: s.turnaroundDays,
                description: s.description,
              }))
            : [{ name: '', category: "Women's Wear", price: 0, turnaroundDays: 7, description: '' }],
        });
      })
      .catch(() => { /* new profile */ })
      .finally(() => setLoading(false));
  }, [reset]);

  const onSubmit = async (data: ProfileForm) => {
    setSaving(true);
    const payload = {
      shopName: data.shopName,
      description: data.description,
      experience: Number(data.experience),
      isAvailable: data.isAvailable,
      location: { city: data.city, state: data.state, pincode: data.pincode },
      services: data.services.map((s) => ({ ...s, price: Number(s.price), turnaroundDays: Number(s.turnaroundDays) })),
    };
    try {
      if (isNew) {
        const { data: d } = await createTailorProfile(payload);
        setTailor(d);
        toast.success('Shop profile created!');
      } else {
        const { data: d } = await updateTailorProfile(payload);
        setTailor(d);
        toast.success('Profile updated!');
      }
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAddPhoto = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return toast.error('Select an image first');
    setPhotoLoading(true);
    const fd = new FormData();
    fd.append('image', file);
    fd.append('caption', photoCaption);
    try {
      await addShopPhoto(fd);
      const { data } = await getMyTailorProfile();
      setTailor(data);
      setPhotoCaption('');
      if (fileRef.current) fileRef.current.value = '';
      toast.success('Photo added!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleRemovePhoto = async (photoId: string) => {
    try {
      await removeShopPhoto(photoId);
      setTailor((t) => t ? { ...t, shopPhotos: t.shopPhotos.filter((p) => p._id !== photoId) } : t);
      toast.success('Photo removed');
    } catch {
      toast.error('Remove failed');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} mb={1}>
        {isNew ? 'Set Up Your Shop Profile' : 'Edit Shop Profile'}
      </Typography>
      <Typography color="text.secondary" mb={4}>
        {isNew ? 'Create your profile to start accepting bookings.' : 'Keep your services and details up to date.'}
      </Typography>

      {isNew && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Creating a profile will upgrade your account to tailor role.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Shop Info</Typography>
            <Box component="form" id="profile-form" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2.5}>
                <Controller name="shopName" control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Shop Name" fullWidth placeholder="e.g. Meena Tailors" />
                  )}
                />
                <Controller name="description" control={control}
                  render={({ field }) => (
                    <TextField {...field} label="About Your Shop" multiline rows={3} fullWidth
                      placeholder="Tell customers about your experience, specialties..." />
                  )}
                />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Controller name="experience" control={control}
                      render={({ field }) => (
                        <TextField {...field} label="Years of Experience" type="number" fullWidth inputProps={{ min: 0 }} />
                      )}
                    />
                  </Grid>
                </Grid>
                <Controller name="isAvailable" control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch checked={field.value} onChange={field.onChange} color="secondary" />}
                      label="Currently accepting new orders"
                    />
                  )}
                />
              </Stack>
            </Box>
          </Paper>

          {/* Location */}
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Location</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller name="city" control={control} rules={{ required: 'City is required' }}
                  render={({ field }) => (
                    <TextField {...field} label="City *" fullWidth error={!!errors.city}
                      helperText={errors.city?.message} placeholder="Mumbai" />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Controller name="state" control={control}
                  render={({ field }) => <TextField {...field} label="State" fullWidth placeholder="Maharashtra" />}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Controller name="pincode" control={control}
                  render={({ field }) => <TextField {...field} label="Pincode" fullWidth placeholder="400001" />}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Services */}
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight={700}>Services & Pricing</Typography>
              <Button
                size="small"
                startIcon={<Add />}
                onClick={() => append({ name: '', category: "Women's Wear", price: 0, turnaroundDays: 7, description: '' })}
                variant="outlined"
              >
                Add Service
              </Button>
            </Box>

            <Stack spacing={2}>
              {serviceFields.map((field, idx) => (
                <Box
                  key={field.id}
                  sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, position: 'relative' }}
                >
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6}>
                      <Controller name={`services.${idx}.name`} control={control} rules={{ required: true }}
                        render={({ field: f }) => (
                          <TextField {...f} label="Service Name *" size="small" fullWidth
                            placeholder="e.g. Blouse Stitching" />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Controller name={`services.${idx}.category`} control={control}
                        render={({ field: f }) => (
                          <FormControl fullWidth size="small">
                            <InputLabel>Category</InputLabel>
                            <Select {...f} label="Category">
                              {SERVICE_CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                            </Select>
                          </FormControl>
                        )}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Controller name={`services.${idx}.price`} control={control}
                        render={({ field: f }) => (
                          <TextField {...f} label="Price (₹)" type="number" size="small" fullWidth inputProps={{ min: 0 }} />
                        )}
                      />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Controller name={`services.${idx}.turnaroundDays`} control={control}
                        render={({ field: f }) => (
                          <TextField {...f} label="Days to Complete" type="number" size="small" fullWidth inputProps={{ min: 1 }} />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Controller name={`services.${idx}.description`} control={control}
                        render={({ field: f }) => (
                          <TextField {...f} label="Description (optional)" size="small" fullWidth
                            placeholder="Any notes about this service" />
                        )}
                      />
                    </Grid>
                  </Grid>
                  {serviceFields.length > 1 && (
                    <IconButton
                      size="small"
                      color="error"
                      sx={{ position: 'absolute', top: 8, right: 8 }}
                      onClick={() => remove(idx)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              ))}
            </Stack>
          </Paper>

          <Button
            type="submit"
            form="profile-form"
            variant="contained"
            color="secondary"
            size="large"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save />}
            disabled={saving}
          >
            {isNew ? 'Create Profile' : 'Save Changes'}
          </Button>
        </Grid>

        {/* Shop photos sidebar */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Shop Photos</Typography>

            {!isNew && (
              <>
                <Stack spacing={1.5} mb={2}>
                  <TextField
                    size="small" label="Caption (optional)"
                    value={photoCaption}
                    onChange={(e) => setPhotoCaption(e.target.value)}
                    fullWidth
                  />
                  <input
                    type="file"
                    ref={fileRef}
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    id="photo-upload"
                  />
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      startIcon={<CloudUpload />}
                      onClick={() => fileRef.current?.click()}
                      fullWidth
                    >
                      Select Image
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleAddPhoto}
                      disabled={photoLoading}
                    >
                      {photoLoading ? <CircularProgress size={18} color="inherit" /> : <Add />}
                    </Button>
                  </Box>
                </Stack>
              </>
            )}

            {isNew ? (
              <Alert severity="info">Save your profile first to add shop photos.</Alert>
            ) : tailor?.shopPhotos.length === 0 ? (
              <Typography color="text.secondary" variant="body2">No photos yet. Add some to attract customers.</Typography>
            ) : (
              <ImageList cols={2} gap={8}>
                {tailor?.shopPhotos.map((photo) => (
                  <ImageListItem key={photo._id} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <img src={photo.image} alt={photo.caption} loading="lazy" />
                    <ImageListItemBar
                      title={photo.caption || ''}
                      actionIcon={
                        <IconButton size="small" sx={{ color: 'white' }} onClick={() => handleRemovePhoto(photo._id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      }
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
