import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Autocomplete,
  Chip,
  FormHelperText,
} from '@mui/material';
import { Event, User } from '../types';
import { generateId, isValidDateTimeRange } from '../utils/helpers';
import { BlobService } from '../services/blobService';

interface EventFormProps {
  event?: Event;
  onSubmit: (event: Event) => void;
  onCancel: () => void;
}

const initialEvent: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  description: '',
  fee: 0,
  startDateTime: '',
  endDateTime: '',
  participants: [],
};

export const EventForm: React.FC<EventFormProps> = ({ event, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState(event || initialEvent);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      const response = await BlobService.listUsers();
      if (response.success && response.data) {
        setUsers(response.data);
        if (event) {
          const eventUsers = response.data.filter((user) =>
            event.participants.some((p) => p.userId === user.id)
          );
          setSelectedUsers(eventUsers);
        }
      }
    };
    loadUsers();
  }, [event]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = 'Event name is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (formData.fee < 0) newErrors.fee = 'Fee cannot be negative';
    if (!formData.startDateTime) newErrors.startDateTime = 'Start date/time is required';
    if (!formData.endDateTime) newErrors.endDateTime = 'End date/time is required';
    if (
      formData.startDateTime &&
      formData.endDateTime &&
      !isValidDateTimeRange(formData.startDateTime, formData.endDateTime)
    ) {
      newErrors.endDateTime = 'End date/time must be after start date/time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const now = new Date().toISOString();
    const participants = selectedUsers.map((user) => ({
      userId: user.id,
      user,
      paymentStatus: 'pending' as const,
      joinedAt: now,
    }));

    const eventData: Event = {
      ...formData,
      id: event?.id || generateId(),
      participants,
      createdAt: event?.createdAt || now,
      updatedAt: now,
    };

    onSubmit(eventData);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {event ? 'Edit Event' : 'Create New Event'}
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <TextField
          fullWidth
          margin="normal"
          label="Event Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={!!errors.name}
          helperText={errors.name}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Description"
          multiline
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          error={!!errors.description}
          helperText={errors.description}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Fee"
          type="number"
          value={formData.fee}
          onChange={(e) => setFormData({ ...formData, fee: parseFloat(e.target.value) || 0 })}
          error={!!errors.fee}
          helperText={errors.fee}
        />
        <TextField
          fullWidth
          margin="normal"
          label="Start Date/Time"
          type="datetime-local"
          value={formData.startDateTime}
          onChange={(e) => setFormData({ ...formData, startDateTime: e.target.value })}
          InputLabelProps={{ shrink: true }}
          error={!!errors.startDateTime}
          helperText={errors.startDateTime}
        />
        <TextField
          fullWidth
          margin="normal"
          label="End Date/Time"
          type="datetime-local"
          value={formData.endDateTime}
          onChange={(e) => setFormData({ ...formData, endDateTime: e.target.value })}
          InputLabelProps={{ shrink: true }}
          error={!!errors.endDateTime}
          helperText={errors.endDateTime}
        />
        <Autocomplete
          multiple
          options={users}
          value={selectedUsers}
          onChange={(_, newValue) => setSelectedUsers(newValue)}
          getOptionLabel={(option) => `${option.name} (${option.chineseName})`}
          renderInput={(params) => (
            <TextField {...params} label="Participants" margin="normal" />
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                label={`${option.name} (${option.chineseName})`}
                {...getTagProps({ index })}
              />
            ))
          }
        />
        <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="contained" type="submit">
            {event ? 'Update' : 'Create'}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}; 