import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CollaboratorDashboard from '../components/dashboard/CollaboratorDashboard';
import { BrowserRouter } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockUser = {
  id: '123',
  name: 'John Doe',
  email: 'john.doe@test.com',
  institution: 'Test University',
  avatar: undefined,
  role: 'Researcher'
};
const mockAuthContext = {
  user: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: true,
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        {ui}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

test('displays loading state initially', () => {
  renderWithProviders(<CollaboratorDashboard />);
  expect(screen.getByText(/Loading your collaborator dashboard/i)).toBeInTheDocument();
});

test('shows error message if API call fails', async () => {
  mockedAxios.get.mockRejectedValueOnce(new Error('Server error'));
  renderWithProviders(<CollaboratorDashboard />);
  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/Error connecting to server/i);
  });
});

test('renders welcome message and user name', async () => {
  mockedAxios.get.mockImplementation((url) => {
    if (url.includes('/creator/')) {
      return Promise.resolve({ data: [] }); // both dashboard and opportunities
    }
    if (url.includes('/notifications')) {
      return Promise.resolve({ data: [] });
    }
    if (url.includes('/projects')) {
      return Promise.resolve({ data: [] });
    }
    return Promise.resolve({ data: [] });
  });

  renderWithProviders(<CollaboratorDashboard />);

  await waitFor(() => {
    expect(screen.getByText(/Welcome back, John/i)).toBeInTheDocument();
    expect(screen.getByText(/Researcher Dashboard/i)).toBeInTheDocument();
  });
});



test('switches to "Find Opportunities" tab when clicked', async () => {
  mockedAxios.get.mockResolvedValue({ data: [] });

  renderWithProviders(<CollaboratorDashboard />);

  await waitFor(() => expect(screen.getByText(/Welcome back/i)).toBeInTheDocument());

  const tabs = screen.getAllByText(/Find Opportunities/i);
  const sidebarTab = tabs.find(el => el.tagName.toLowerCase() === 'a');
  expect(sidebarTab).toBeTruthy();
  fireEvent.click(sidebarTab!);

  expect(await screen.findByText(/Opportunities Found/i)).toBeInTheDocument();
});


test('calls logout when logout button is clicked', async () => {
  const logoutMock = jest.fn();
  const contextWithMockLogout = {
    ...mockAuthContext,
    logout: logoutMock, // ✅ use the real mock
  };

  render(
    <BrowserRouter>
      <AuthContext.Provider value={contextWithMockLogout}>
        <CollaboratorDashboard />
      </AuthContext.Provider>
    </BrowserRouter>
  );

  await waitFor(() => expect(screen.getByTestId('logout-btn')).toBeInTheDocument());
  fireEvent.click(screen.getByTestId('logout-btn'));
  expect(logoutMock).toHaveBeenCalled(); // ✅ will now pass
});


test('displays a project card with download link', async () => {
  mockedAxios.get.mockImplementation((url) => {
    if (url.includes('/creator/')) {
      return Promise.resolve({
        data: [
          {
            _id: 1,
            title: 'AI Research',
            description: 'A project about AI.',
            research_goals: 'Improve ML models',
            research_area: 'Artificial Intelligence',
            start_date: '2024-01-01',
            end_date: '2024-12-31',
            funding_available: true,
            funding_amount: '10000',
            collaborators_needed: true,
            collaborator_roles: 'Researcher',
            institution: 'Tech University',
            contact_email: 'test@example.com',
            created_at: '',
            file: {
              data: 'abc',
              contentType: 'application/pdf',
              originalName: 'proposal.pdf',
            },
            creator: { _id: 'user-1', fname: '', lname: '', role: '' }, // logged-in user
            status: 'Active',
            role: 'Researcher',
          },
        ],
      });
    }

    if (url.includes('/notifications')) return Promise.resolve({ data: [] });
    if (url.includes('/projects')) return Promise.resolve({ data: [] });

    return Promise.resolve({ data: [] });
  });

  renderWithProviders(<CollaboratorDashboard />);

  // Wait for the user profile to confirm dashboard has loaded
  await waitFor(() => {
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
  });

  // Switch to "My Projects" tab explicitly
  const myProjectsTab = screen.getAllByText(/My Projects/i).find(
    (el) => el.tagName.toLowerCase() === 'a'
  );
  
  expect(myProjectsTab).toBeTruthy();
  fireEvent.click(myProjectsTab!);

  // Assert project details are visible
  expect(await screen.findByText(/AI Research/i)).toBeInTheDocument();
});

test('filters external opportunities based on search input', async () => {
  mockedAxios.get.mockImplementation((url) => {
    if (url.includes('/creator/')) return Promise.resolve({ data: [] });
    if (url.includes('/notifications')) return Promise.resolve({ data: [] });
    if (url.includes('/projects')) {
      return Promise.resolve({
        data: [
          {
            _id: 2,
            title: 'Quantum Physics',
            research_area: 'Physics',
            end_date: '2025-01-01',
            start_date: '2024-01-01',
            institution: 'Quantum Lab',
            collaborator_roles: 'Quantum Mechanics, Research',
            collaborators_needed: true,
            file: {
              data: 'base64',
              contentType: 'application/pdf',
              originalName: 'quantum.pdf',
            },
            creator: { _id: 'someone-else' },
            contact_email: 'x@y.com',
            created_at: '',
            funding_available: false,
            funding_amount: null,
          },
        ],
      });
    }
    return Promise.resolve({ data: [] });
  });

  renderWithProviders(<CollaboratorDashboard />);

  await waitFor(() => {
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
  });

  // ✅ Click sidebar link to switch tab (avoid ambiguity)
  const sidebarTab = screen.getAllByText(/Find Opportunities/i).find(
    (el) => el.tagName.toLowerCase() === 'a'
  );
  expect(sidebarTab).toBeTruthy();
  fireEvent.click(sidebarTab!);

  // ✅ Filter opportunities
  fireEvent.change(screen.getByPlaceholderText(/Search by name/i), {
    target: { value: 'quantum' },
  });

  // ✅ Expect opportunity to appear
  expect(await screen.findByText(/Quantum Physics/i)).toBeInTheDocument();
  expect(screen.getByText(/Download quantum.pdf/i)).toBeInTheDocument();
});

test('navigates to collaborator invite page', async () => {
  mockedAxios.get.mockImplementation((url) => {
    if (url.includes('/creator/')) {
      return Promise.resolve({ data: [
        {
          _id: 3,
          title: 'Genomics Study',
          research_area: 'Biology',
          end_date: '2025-02-01',
          start_date: '2024-01-01',
          description: 'DNA and gene expression research.',
          collaborators_needed: true,
          collaborator_roles: 'Biologist',
          institution: 'Genome Lab',
          file: {
            data: 'base64',
            contentType: 'application/pdf',
            originalName: 'genomics.pdf'
          },
          creator: { _id: 'user-1', fname: '', lname: '', role: '' }, // Matches current user
          contact_email: 'x@y.com',
          created_at: '',
          funding_available: false,
          funding_amount: null,
          status: 'Active',
          role: 'Researcher'
        }
      ]});
    }

    if (url.includes('/notifications')) {
      return Promise.resolve({ data: [] });
    }

    if (url.includes('/projects')) {
      return Promise.resolve({ data: [] }); // External
    }

    return Promise.resolve({ data: [] });
  });

  renderWithProviders(<CollaboratorDashboard />);

  // Wait for button in the overview
  const btn = await screen.findByTestId('invite-collaborators-btn');
  fireEvent.click(btn);

  expect(mockNavigate).toHaveBeenCalledWith('/collaborators/3');
});

test('shows empty state when no data is present', async () => {
  mockedAxios.get.mockResolvedValue({ data: [] }); // All responses

  renderWithProviders(<CollaboratorDashboard />);
  await waitFor(() => {
    expect(screen.getByText(/No Active Projects/i)).toBeInTheDocument();
    expect(screen.getByText(/No Matching Opportunities/i)).toBeInTheDocument();
    expect(screen.getByText(/No notifications yet/i)).toBeInTheDocument();
  });
});

test('renders Calendar and switches back to Projects', async () => {
  mockedAxios.get.mockResolvedValue({ data: [] });

  renderWithProviders(<CollaboratorDashboard />);
  await waitFor(() => screen.getByText(/Welcome back/i));

  fireEvent.click(screen.getByText(/Calendar/i));
  expect(await screen.findByText(/Collaborator Project Calendar/i)).toBeInTheDocument();

  fireEvent.click(screen.getByText(/My Projects/i));
  expect(await screen.findByText(/My Research Projects/i)).toBeInTheDocument();
});
