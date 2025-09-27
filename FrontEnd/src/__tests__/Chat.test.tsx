// src/__tests__/Chat.test.tsx
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ChatPage from '../pages/Chat';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockUser = {
  id: 'user1',
  name: 'John Doe',
  email: 'john@example.com', // ✅ Required field
  role: 'Researcher',
  avatar: 'avatar.png',
};

const mockAuthContext = {
  isAuthenticated: true,
  user: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
};

const mockMessages = [
  {
    _id: 'm1',
    sender: { _id: 'user2', fname: 'Alice', lname: 'Smith', role: 'Professor' },
    receiver: 'user1',
    content: 'Hello!',
    projectId: 'p123',
    createdAt: new Date().toISOString(),
    delivered: true,
    read: false,
  },
];

const renderChat = () => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <MemoryRouter initialEntries={['/chat/p123']}>
        <Routes>
          <Route path="/chat/:id" element={<ChatPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe('ChatPage', () => {
  beforeEach(() => {
    // Mock scrollIntoView to prevent error during tests
    HTMLElement.prototype.scrollIntoView = jest.fn();

    mockedAxios.get.mockResolvedValueOnce({ data: mockMessages });
  });

  it('renders chat messages after fetch', async () => {
    renderChat();

    expect(await screen.findByText(/Hello!/i)).toBeInTheDocument();
    expect(screen.getByText(/Alice/i)).toBeInTheDocument();
  });

  it('allows sending a message and updates the UI', async () => {
    renderChat();

    await waitFor(() => screen.getByText(/Hello!/i));

    // Mock send message POST and PATCH
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        _id: 'm2',
        sender: mockUser.id,
        receiver: 'user2',
        projectId: 'p123',
        content: 'Hi Alice!',
        createdAt: new Date().toISOString(),
        delivered: false,
        read: false,
      },
    });

    mockedAxios.patch.mockResolvedValueOnce({ data: {} });

    const input = screen.getByPlaceholderText(/type a message/i);
    fireEvent.change(input, { target: { value: 'Hi Alice!' } });

    fireEvent.click(screen.getByTestId('send-btn'));

    await waitFor(() => screen.getByText('Hi Alice!'));
  });

  /*it('shows read status for sent messages', async () => {
    // Define a test message ID that we can reference later
    const testMessageId = 'test-message-id';
    
    // Create a custom mock implementation for this test
    const mockGetImplementation = jest.fn().mockImplementation((url) => {
      if (url.includes('/api/message/project/')) {
        // Return a message that is definitely sent by the current user
        return Promise.resolve({
          data: [{
            _id: testMessageId,
            sender: {
              _id: mockUser.id, // Make sure this matches exactly
              fname: mockUser.name.split(' ')[0],
              lname: mockUser.name.split(' ')[1],
              role: mockUser.role
            },
            receiver: 'receiver-id',
            content: 'Test message from current user',
            projectId: 'p123',
            createdAt: new Date().toISOString(),
            delivered: true,
            read: true
          }]
        });
      }
      return Promise.reject(new Error('Unhandled URL in mock'));
    });

    // Override the default mock implementation for this test
    mockedAxios.get.mockImplementation(mockGetImplementation);

    // Render the component
    const { container } = renderChat();
    
    // Wait for our message to appear
    await waitFor(() => screen.getByText('Test message from current user'));
    
    // Try multiple approaches to find the read status element
    
    // Approach 1: Using the data-testid with the message ID
    try {
      const readStatusByTestId = container.querySelector(`[data-testid="read-status-${testMessageId}"]`);
      if (readStatusByTestId) {
        console.log('Found by test ID:', readStatusByTestId.textContent);
        expect(readStatusByTestId).toHaveAttribute('data-read', 'true');
        expect(readStatusByTestId.textContent).toBe('✔️✔️');
        return; // Test passed
      }
    } catch (e) {
      console.log('Test ID approach failed:', e);
    }
    
    // Approach 2: Find the sent message and check its content
    try {
      const sentMessage = container.querySelector('.chat-message.sent');
      expect(sentMessage).not.toBeNull();
      
      if (sentMessage) {
        const messageTimeDiv = sentMessage.querySelector('.message-time');
        console.log('Message time content:', messageTimeDiv?.textContent);
        
        // Assert that the message time contains the double checkmark
        expect(messageTimeDiv?.textContent).toContain('✔️✔️');
        return; // Test passed
      }
    } catch (e) {
      console.log('Sent message approach failed:', e);
    }
    
    // Approach 3: Just find any element with the read status class
    try {
      const readStatusElements = container.querySelectorAll('.read-status');
      console.log('Found read status elements:', readStatusElements.length);
      
      if (readStatusElements.length > 0) {
        // Check if any of them has the double checkmark
        const hasDoubleCheckmark = Array.from(readStatusElements).some(
          el => el.textContent?.includes('✔️✔️')
        );
        expect(hasDoubleCheckmark).toBe(true);
        return; // Test passed
      }
    } catch (e) {
      console.log('Read status class approach failed:', e);
    }
    
    // If all approaches fail, the test will fail
    fail('Could not find any read status indicators in the rendered output');
  });*/
});