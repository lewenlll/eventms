import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  TextField,
  Button,
  Dialog,
  Chip,
  Collapse,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  KeyboardArrowDown as ExpandMoreIcon,
  KeyboardArrowUp as ExpandLessIcon,
} from '@mui/icons-material';
import { Event } from '../types';
import { BlobService } from '../services/blobService';
import { EventForm } from './EventForm';
import { formatDateTime } from '../utils/helpers';

export const EventList: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const loadEvents = async () => {
    setIsLoading(true);
    const response = await BlobService.listEvents();
    if (response.success && response.data) {
      setEvents(response.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setIsFormOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setSelectedEvent(event);
    setIsFormOpen(true);
  };

  const handleDeleteEvent = async (event: Event) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      const response = await BlobService.deleteEvent(event.id);
      if (response.success) {
        await loadEvents();
      }
    }
  };

  const handleSubmit = async (eventData: Event) => {
    console.log('Saving event data:', eventData);
    const response = await BlobService.saveEvent(eventData);
    console.log('Save response:', response);
    if (response.success) {
      setIsFormOpen(false);
      await loadEvents();
    } else {
      console.error('Failed to save event:', response.error);
    }
  };

  const toggleExpand = (eventId: string) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  const handleUpdatePaymentStatus = async (
    event: Event,
    userId: string,
    newStatus: 'pending' | 'paid' | 'refunded'
  ) => {
    const updatedEvent = {
      ...event,
      participants: event.participants.map((p) =>
        p.userId === userId ? { ...p, paymentStatus: newStatus } : p
      ),
      updatedAt: new Date().toISOString(),
    };

    const response = await BlobService.saveEvent(updatedEvent);
    if (response.success) {
      await loadEvents();
    }
  };

  const filteredEvents = events.filter((event) =>
    event.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Events</Typography>
        <Button variant="contained" onClick={handleCreateEvent}>
          Create Event
        </Button>
      </Box>

      <TextField
        fullWidth
        margin="normal"
        label="Search events"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Fee</TableCell>
              <TableCell>Start</TableCell>
              <TableCell>End</TableCell>
              <TableCell>Participants</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No events found
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => (
                <React.Fragment key={event.id}>
                  <TableRow>
                    <TableCell>
                      <IconButton size="small" onClick={() => toggleExpand(event.id)}>
                        {expandedEventId === event.id ? (
                          <ExpandLessIcon />
                        ) : (
                          <ExpandMoreIcon />
                        )}
                      </IconButton>
                    </TableCell>
                    <TableCell>{event.name}</TableCell>
                    <TableCell>{event.description}</TableCell>
                    <TableCell>${event.fee}</TableCell>
                    <TableCell>{formatDateTime(event.startDateTime)}</TableCell>
                    <TableCell>{formatDateTime(event.endDateTime)}</TableCell>
                    <TableCell>{event.participants.length}</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleEditEvent(event)} size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteEvent(event)} size="small">
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                      <Collapse in={expandedEventId === event.id} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                          <Typography variant="h6" gutterBottom component="div">
                            Participants
                          </Typography>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Chinese Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Phone</TableCell>
                                <TableCell>Payment Status</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {event.participants.map((participant) => (
                                <TableRow key={participant.userId}>
                                  <TableCell>{participant.user.name}</TableCell>
                                  <TableCell>{participant.user.chineseName}</TableCell>
                                  <TableCell>{participant.user.email}</TableCell>
                                  <TableCell>{participant.user.phoneNumber}</TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      {['pending', 'paid', 'refunded'].map((status) => (
                                        <Chip
                                          key={status}
                                          label={status}
                                          color={
                                            status === 'paid'
                                              ? 'success'
                                              : status === 'refunded'
                                              ? 'error'
                                              : 'default'
                                          }
                                          variant={
                                            participant.paymentStatus === status
                                              ? 'filled'
                                              : 'outlined'
                                          }
                                          onClick={() =>
                                            handleUpdatePaymentStatus(
                                              event,
                                              participant.userId,
                                              status as 'pending' | 'paid' | 'refunded'
                                            )
                                          }
                                          sx={{ cursor: 'pointer' }}
                                        />
                                      ))}
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="md" fullWidth>
        <EventForm
          event={selectedEvent || undefined}
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      </Dialog>
    </Box>
  );
}; 