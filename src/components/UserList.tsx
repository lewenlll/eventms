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
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { User } from '../types';
import { BlobService } from '../services/blobService';
import { UserForm } from './UserForm';
import { formatDate } from '../utils/helpers';

export const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadUsers = async () => {
    setIsLoading(true);
    const response = await BlobService.listUsers();
    if (response.success && response.data) {
      setUsers(response.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleCreateTestUsers = async () => {
    if (window.confirm('This will create 100 test users. Are you sure?')) {
      setIsLoading(true);
      try {
        for (let i = 1; i <= 100; i++) {
          const testUser: User = {
            id: `test-${i}`,
            name: `Test User ${i}`,
            chineseName: `测试用户 ${i}`,
            gender: i % 2 === 0 ? 'male' : 'female',
            dateOfBirth: '1990-01-01',
            email: `test${i}@example.com`,
            phoneNumber: `12345678${i.toString().padStart(2, '0')}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          await BlobService.saveUser(testUser);
        }
        await loadUsers();
      } catch (error) {
        console.error('Error creating test users:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteUser = async (user: User) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const response = await BlobService.deleteUser(user.id);
      if (response.success) {
        await loadUsers();
      }
    }
  };

  const handleSubmit = async (userData: User) => {
    console.log('Saving user data:', userData);
    const response = await BlobService.saveUser(userData);
    console.log('Save response:', response);
    if (response.success) {
      setIsFormOpen(false);
      await loadUsers();
    } else {
      console.error('Failed to save user:', response.error);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.chineseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Users</Typography>
        <Box>
          <Button variant="outlined" onClick={handleCreateTestUsers} sx={{ mr: 2 }}>
            Create Test Users
          </Button>
          <Button variant="contained" onClick={handleCreateUser}>
            Create User
          </Button>
        </Box>
      </Box>

      <TextField
        fullWidth
        margin="normal"
        label="Search users"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Chinese Name</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Date of Birth</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.chineseName}</TableCell>
                  <TableCell>{user.gender}</TableCell>
                  <TableCell>{formatDate(user.dateOfBirth)}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phoneNumber}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEditUser(user)} size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDeleteUser(user)} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)} maxWidth="md" fullWidth>
        <UserForm
          user={selectedUser || undefined}
          onSubmit={handleSubmit}
          onCancel={() => setIsFormOpen(false)}
        />
      </Dialog>
    </Box>
  );
}; 