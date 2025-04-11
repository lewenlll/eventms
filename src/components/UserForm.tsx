import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
} from '@mui/material';
import { User } from '../types';
import { generateId, validateEmail, validatePhoneNumber } from '../utils/helpers';
import { BlobService } from '../services/blobService';

interface UserFormProps {
  user?: User;
  onSubmit: (user: User) => void;
  onCancel: () => void;
}

const initialUser: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  chineseName: '',
  gender: 'male',
  dateOfBirth: '',
  email: '',
  phoneNumber: '',
};

export const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(user || initialUser);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData(user);
    } else {
      setFormData(initialUser);
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.chineseName) newErrors.chineseName = 'Chinese name is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const now = new Date().toISOString();
    const userData: User = {
      ...formData,
      id: user?.id || generateId(),
      createdAt: user?.createdAt || now,
      updatedAt: now,
    };

    console.log('Submitting user data:', userData);
    onSubmit(userData);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {user ? 'Edit User' : 'Create New User'}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          fullWidth
          margin="normal"
          label="Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={!!errors.name}
          helperText={errors.name}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Chinese Name"
          value={formData.chineseName}
          onChange={(e) => setFormData({ ...formData, chineseName: e.target.value })}
          error={!!errors.chineseName}
          helperText={errors.chineseName}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Gender</InputLabel>
          <Select
            value={formData.gender}
            label="Gender"
            onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
          >
            <MenuItem value="male">Male</MenuItem>
            <MenuItem value="female">Female</MenuItem>
          </Select>
        </FormControl>
        <TextField
          fullWidth
          margin="normal"
          label="Date of Birth"
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          InputLabelProps={{ shrink: true }}
          error={!!errors.dateOfBirth}
          helperText={errors.dateOfBirth}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          error={!!errors.email}
          helperText={errors.email}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Phone Number"
          value={formData.phoneNumber}
          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
          error={!!errors.phoneNumber}
          helperText={errors.phoneNumber}
        />
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="contained" type="submit">
            {user ? 'Update' : 'Create'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}; 