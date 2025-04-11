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
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
} from '@mui/material';
import { Event, User, Participant } from '../types';
import { generateId, isValidDateTimeRange } from '../utils/helpers';
import { BlobService } from '../services/blobService';
import { CheckBox, CheckBoxOutlineBlank } from '@mui/icons-material';

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
  const [formData, setFormData] = useState<Event>(() => {
    if (event) {
      return event;
    }
    return {
      ...initialEvent,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      const response = await BlobService.listUsers();
      if (response.success && response.data) {
        setUsers(response.data);
        if (event?.participants) {
          const participants = response.data.filter(user => 
            event.participants.some(p => p.userId === user.id)
          );
          setSelectedUsers(participants);
        }
      }
      setIsLoading(false);
    };

    loadUsers();
  }, [event]);

  const handleUserSelect = (user: User) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.chineseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const now = new Date().toISOString();
      const participants: Participant[] = selectedUsers.map(user => ({
        userId: user.id,
        user,
        paymentStatus: 'pending' as const,
        joinedAt: now,
      }));

      const eventData: Event = {
        ...formData,
        participants,
        updatedAt: now,
      };
      onSubmit(eventData);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (formData.fee < 0) newErrors.fee = 'Fee cannot be negative';
    if (!formData.startDateTime) newErrors.startDateTime = 'Start date/time is required';
    if (!formData.endDateTime) newErrors.endDateTime = 'End date/time is required';
    if (!isValidDateTimeRange(formData.startDateTime, formData.endDateTime)) {
      newErrors.endDateTime = 'End date/time must be after start date/time';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        {event ? 'Edit Event' : 'Create New Event'}
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              margin="normal"
              label="Event Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={!!errors.name}
              helperText={errors.name}
            />
          </Grid>
          <Grid item xs={12}>
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
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              margin="normal"
              label="Fee"
              type="number"
              value={formData.fee}
              onChange={(e) => setFormData({ ...formData, fee: Number(e.target.value) })}
              error={!!errors.fee}
              helperText={errors.fee}
            />
          </Grid>
          <Grid item xs={12}>
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
          </Grid>
          <Grid item xs={12}>
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
          </Grid>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Participants
            </Typography>
            <TextField
              fullWidth
              label="Search participants"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Paper sx={{ maxHeight: 300, overflow: 'auto', p: 2 }}>
              {isLoading ? (
                <Typography>Loading users...</Typography>
              ) : filteredUsers.length === 0 ? (
                <Typography>No users found</Typography>
              ) : (
                <List>
                  {filteredUsers.map((user) => (
                    <ListItem
                      key={user.id}
                      button
                      onClick={() => handleUserSelect(user)}
                      selected={selectedUsers.some(u => u.id === user.id)}
                    >
                      <ListItemText
                        primary={user.name}
                        secondary={`${user.chineseName} - ${user.email}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUserSelect(user);
                          }}
                        >
                          {selectedUsers.some(u => u.id === user.id) ? (
                            <CheckBox />
                          ) : (
                            <CheckBoxOutlineBlank />
                          )}
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
            {selectedUsers.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Selected Participants ({selectedUsers.length})
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedUsers.map(user => (
                    <Chip
                      key={user.id}
                      label={`${user.name} (${user.chineseName})`}
                      onDelete={() => handleUserSelect(user)}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={onCancel}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                {event ? 'Update' : 'Create'} Event
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};