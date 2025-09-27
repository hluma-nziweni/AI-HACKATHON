import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import axios from 'axios';
import Messages from '../pages/Messages';
import AuthContext from '../context/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockUser = {
  id: 'user1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'Student',
  institution: 'Test University',
  avatar: 'avatar.png',
};

const mockAuthContext = {
  isAuthenticated: true,
  user: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
};

const mockInvites = [
  {
    _id: 'msg1',
    sender: { 
      _id: 's1', 
      fname: 'Alice', 
      lname: 'Smith', 
      role: 'Professor' 
    },
    receiver: { 
      _id: 'user1', 
      fname: 'John', 
      lname: 'Doe', 
      role: 'Student' 
    },
    project: {
      _id: 'p1',
      title: 'AI Research',
      funding_amount: 50000,
      status: 'Pending',
      creator: { role: 'Professor' },
      file: {
        data: "base64-string",
        contentType: "application/pdf",
        originalName: "proposal.pdf"
      }
    },
    message: 'Join my project!',
    status: 'Pending',
  }
];

const renderComponent = () =>
  render(
    <AuthContext.Provider value={mockAuthContext}>
      <MemoryRouter>
        <Messages />
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe('Messages Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays loading spinner initially', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    renderComponent();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('displays "No invites yet" if no invites are found', async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText(/No invites yet/i)).toBeInTheDocument();
    });
  });

  test('renders invite message card with content', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockInvites });
    renderComponent();
  
    await waitFor(() => {
      expect(screen.getByText(/AI Research/i)).toBeInTheDocument();
      expect(screen.getByText(/Join my project!/i)).toBeInTheDocument();
      expect(screen.getByText(/\$50000/i)).toBeInTheDocument();
      expect(screen.getByText(/Alice Smith/i)).toBeInTheDocument();
    });
  });
  
  test('allows accepting an invite', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockInvites });
    mockedAxios.put.mockResolvedValueOnce({});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Accept'));

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalled();
    });
  });

  test('allows declining an invite', async () => {
    mockedAxios.get.mockResolvedValue({ data: mockInvites });
    mockedAxios.put.mockResolvedValueOnce({});

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Decline')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Decline'));

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalled();
    });
  });
});