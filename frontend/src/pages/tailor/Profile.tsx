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
  addWorkSample, removeWorkSample,
} from '../../api/tailors';
import type { Tailor } from '../../types';
import { SERVICE_CATEGORIES } from '../../types';
import PageLoader from '../../components/common/PageLoader';

interface ServiceField {
  name: string;
  category: string;
  price: number;
  priceMayVary: boolean;
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
  instagram: string;
  whatsapp: string;
  facebook: string;
  services: ServiceField[];
}

export default function TailorProfile() {
  const [tailor, setTailor] = useState<Tailor | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [sampleLoading, setSampleLoading] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');
  const [sampleCaption, setSampleCaption] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [selectedSample, setSelectedSample] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [samplePreview, setSamplePreview] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const sampleFileRef = useRef<HTMLInputElement>(null);
  const isNew = !tailor;

  const { control, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    defaultValues: {
      shopName: '', description: '', experience: 0, isAvailable: true,
      city: '', state: '', pincode: '', instagram: '', whatsapp: '', facebook: '',
      services: [{ name: '', category: "Women's Wear", price: 1, priceMayVary: false, turnaroundDays: 7, description: '' }],
    },
  });

  const { fields: serviceFields, append, remove } = useFieldArray({ control, name: 'services' });

  const handleSelectPhoto = (file?: File) => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setSelectedPhoto(file || null);
    setPhotoPreview(file ? URL.createObjectURL(file) : '');
  };

  const handleSelectSample = (file?: File) => {
    if (samplePreview) URL.revokeObjectURL(samplePreview);
    setSelectedSample(file || null);
    setSamplePreview(file ? URL.createObjectURL(file) : '');
  };

  useEffect(() => () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    if (samplePreview) URL.revokeObjectURL(samplePreview);
  }, [photoPreview, samplePreview]);

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
          instagram: data.socialLinks?.instagram || '',
          whatsapp: data.socialLinks?.whatsapp || '',
          facebook: data.socialLinks?.facebook || '',
          services: data.services.length > 0
            ? data.services.map((s) => ({
                name: s.name,
                category: s.category,
                price: s.price,
                priceMayVary: !!s.priceMayVary,
                turnaroundDays: s.turnaroundDays,
                description: s.description,
              }))
            : [{ name: '', category: "Women's Wear", price: 1, priceMayVary: false, turnaroundDays: 7, description: '' }],
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
      socialLinks: {
        instagram: data.instagram,
        whatsapp: data.whatsapp,
        facebook: data.facebook,
      },
      services: data.services.map((s) => ({ ...s, price: Number(s.price), priceMayVary: !!s.priceMayVary, turnaroundDays: Number(s.turnaroundDays) })),
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
    const file = selectedPhoto || fileRef.current?.files?.[0];
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
      handleSelectPhoto();
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

  const handleAddWorkSample = async () => {
    const file = selectedSample || sampleFileRef.current?.files?.[0];
    if (!file) return toast.error('Select a work sample image first');
    setSampleLoading(true);
    const fd = new FormData();
    fd.append('image', file);
    fd.append('caption', sampleCaption);
    try {
      await addWorkSample(fd);
      const { data } = await getMyTailorProfile();
      setTailor(data);
      setSampleCaption('');
      handleSelectSample();
      if (sampleFileRef.current) sampleFileRef.current.value = '';
      toast.success('Work sample added!');
    } catch {
      toast.error('Upload failed');
    } finally {
      setSampleLoading(false);
    }
  };

  const handleRemoveWorkSample = async (sampleId: string) => {
    try {
      await removeWorkSample(sampleId);
      setTailor((t) => t ? { ...t, workSamples: t.workSamples.filter((p) => p._id !== sampleId) } : t);
      toast.success('Work sample removed');
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

          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Social & Contact Links</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Controller name="instagram" control={control}
                  render={({ field }) => <TextField {...field} label="Instagram URL" fullWidth placeholder="https://instagram.com/yourshop" />}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="whatsapp" control={control}
                  render={({ field }) => <TextField {...field} label="WhatsApp Link" fullWidth placeholder="https://wa.me/91..." />}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Controller name="facebook" control={control}
                  render={({ field }) => <TextField {...field} label="Facebook URL" fullWidth placeholder="https://facebook.com/yourshop" />}
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
                onClick={() => append({ name: '', category: "Women's Wear", price: 1, priceMayVary: false, turnaroundDays: 7, description: '' })}
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
                      <Controller name={`services.${idx}.price`} control={control} rules={{ min: { value: 1, message: 'Price must be greater than 0' } }}
                        render={({ field: f }) => (
                          <TextField
                            {...f}
                            label="Price (₹)"
                            type="number"
                            size="small"
                            fullWidth
                            inputProps={{ min: 1 }}
                            error={!!errors.services?.[idx]?.price}
                            helperText={errors.services?.[idx]?.price?.message}
                          />
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
                    <Grid item xs={12} sm={6}>
                      <Controller name={`services.${idx}.priceMayVary`} control={control}
                        render={({ field: f }) => (
                          <FormControlLabel
                            control={<Switch checked={!!f.value} onChange={f.onChange} color="secondary" />}
                            label="Price may vary as per customization"
                          />
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

        {/* Media sidebar */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
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
                    onChange={(e) => handleSelectPhoto(e.target.files?.[0])}
                  />
                  {selectedPhoto && (
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1.25,
                        alignItems: 'center',
                        p: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                      }}
                    >
                      <Box
                        component="img"
                        src={photoPreview}
                        alt="Selected shop"
                        sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1 }}
                      />
                      <Box minWidth={0} flex={1}>
                        <Typography variant="body2" fontWeight={600} noWrap>{selectedPhoto.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(selectedPhoto.size / 1024 / 1024).toFixed(2)} MB selected
                        </Typography>
                      </Box>
                      <IconButton size="small" color="error" onClick={() => {
                        handleSelectPhoto();
                        if (fileRef.current) fileRef.current.value = '';
                      }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      startIcon={<CloudUpload />}
                      onClick={() => fileRef.current?.click()}
                      fullWidth
                    >
                      {selectedPhoto ? 'Change Image' : 'Select Image'}
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

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={0.5}>Portfolio / Work Samples</Typography>
            <Typography color="text.secondary" variant="body2" mb={2}>
              Add finished garment photos that customers will see first on your detail page.
            </Typography>

            {!isNew && (
              <>
                <Stack spacing={1.5} mb={2}>
                  <TextField
                    size="small"
                    label="Caption (optional)"
                    value={sampleCaption}
                    onChange={(e) => setSampleCaption(e.target.value)}
                    fullWidth
                  />
                  <input
                    type="file"
                    ref={sampleFileRef}
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    id="sample-upload"
                    onChange={(e) => handleSelectSample(e.target.files?.[0])}
                  />
                  {selectedSample && (
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 1.25,
                        alignItems: 'center',
                        p: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                      }}
                    >
                      <Box
                        component="img"
                        src={samplePreview}
                        alt="Selected work sample"
                        sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 1 }}
                      />
                      <Box minWidth={0} flex={1}>
                        <Typography variant="body2" fontWeight={600} noWrap>{selectedSample.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(selectedSample.size / 1024 / 1024).toFixed(2)} MB selected
                        </Typography>
                      </Box>
                      <IconButton size="small" color="error" onClick={() => {
                        handleSelectSample();
                        if (sampleFileRef.current) sampleFileRef.current.value = '';
                      }}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      startIcon={<CloudUpload />}
                      onClick={() => sampleFileRef.current?.click()}
                      fullWidth
                    >
                      {selectedSample ? 'Change Image' : 'Select Image'}
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      onClick={handleAddWorkSample}
                      disabled={sampleLoading}
                    >
                      {sampleLoading ? <CircularProgress size={18} color="inherit" /> : <Add />}
                    </Button>
                  </Box>
                </Stack>
              </>
            )}

            {isNew ? (
              <Alert severity="info">Save your profile first to add portfolio images.</Alert>
            ) : tailor?.workSamples.length === 0 ? (
              <Typography color="text.secondary" variant="body2">No work samples yet. Add your best stitching work here.</Typography>
            ) : (
              <ImageList cols={2} gap={8}>
                {tailor?.workSamples.map((photo) => (
                  <ImageListItem key={photo._id} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                    <img src={photo.image} alt={photo.caption} loading="lazy" />
                    <ImageListItemBar
                      title={photo.caption || ''}
                      actionIcon={
                        <IconButton size="small" sx={{ color: 'white' }} onClick={() => handleRemoveWorkSample(photo._id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      }
                    />
                  </ImageListItem>
                ))}
              </ImageList>
            )}
          </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}
