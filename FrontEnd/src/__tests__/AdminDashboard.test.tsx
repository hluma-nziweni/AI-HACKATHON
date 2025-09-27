import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// At the top of AdminDashboard.test.tsx
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => jest.fn(),
  };
});


const mockUser = {
  id: 'admin1',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'Admin',
  institution: 'Research Institute',
  avatar: undefined,
};

const renderWithAuthContext = (ui: React.ReactNode) => {
  return render(
    <AuthContext.Provider
      value={{
        isAuthenticated: true,
        user: mockUser,
        login: jest.fn(),
        logout: jest.fn(),
      }}
    >
      <BrowserRouter>{ui}</BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('AdminDashboard', () => {
  const mockUsers = [
    {
      _id: '1',
      fname: 'John',
      email: 'john@example.com',
      role: 'Researcher',
      contact: '12345',
      department: 'Science',
      createdAt: '2023-01-01T00:00:00.000Z',
    },
  ];

  const mockProposals = [
    {
      _id: 'p1',
      title: 'AI Research',
      description: 'AI in education',
      research_goals: 'Improve learning',
      research_area: 'AI',
      creator_email: 'creator@example.com',
      creator: { _id: 'u1', fname: 'Jane', lname: 'Doe', role: 'Researcher' },
      institution: 'Tech Uni',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      status: 'Under Review',
      created_at: '2024-01-01',
      assigned_reviewers: [],
      file: {
        data: 'base64',
        contentType: 'application/pdf',
        originalName: 'proposal.pdf',
      },
    },
  ];

  const mockReviewers = [
    {
      _id: 'r1',
      fname: 'Alice',
      lname: 'Smith',
      expertise: ['AI'],
      department: 'Engineering',
    },
  ];

  beforeEach(() => {
    mockedAxios.get.mockImplementation(url => {
      if (url.includes('/api/users/reviewer')) return Promise.resolve({ data: mockReviewers });
      if (url.includes('/api/users')) return Promise.resolve({ data: mockUsers });
      if (url.includes('/api/createproject/projects')) return Promise.resolve({ data: mockProposals });
      return Promise.resolve({ data: [] });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders user info and dashboard', async () => {
  renderWithAuthContext(<AdminDashboard />);

  expect(screen.getByText(/Loading admin dashboard/i)).toBeInTheDocument();

  await waitFor(() => {
    // Assert section heading rather than sidebar
    expect(screen.getByRole('heading', { name: /User Management/i })).toBeInTheDocument();
    expect(screen.getByText(/John/)).toBeInTheDocument();
  });
});


  test('switches to proposals tab and shows data', async () => {
    renderWithAuthContext(<AdminDashboard />);

    const proposalsTab = await screen.findByRole('button', { name: /Proposals/i });
    userEvent.click(proposalsTab);

    await waitFor(() => {
      expect(screen.getByText(/Research Proposals/i)).toBeInTheDocument();
      expect(screen.getByText(/AI Research/i)).toBeInTheDocument();
    });
  });

  test('clicking "Assign Reviewers" opens reviewer modal', async () => {
    renderWithAuthContext(<AdminDashboard />);

    const proposalsTab = await screen.findByRole('button', { name: /Proposals/i });
    userEvent.click(proposalsTab);

    const assignBtn = await screen.findByRole('button', { name: /Assign Reviewers/i });
    userEvent.click(assignBtn);

    await waitFor(() => {
      expect(screen.getByText(/Assign reviewers to/i)).toBeInTheDocument();
      expect(screen.getByText(/Alice Smith/i)).toBeInTheDocument();
    });
  });

  test('logs out when logout button is clicked', async () => {
  const mockLogout = jest.fn();

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthContext.Provider
      value={{
        isAuthenticated: true,
        user: mockUser,
        login: jest.fn(),
        logout: mockLogout,
      }}
    >
      <BrowserRouter>{children}</BrowserRouter>
    </AuthContext.Provider>
  );

  render(<AdminDashboard />, { wrapper: Wrapper });

  const logoutBtn = await screen.findByRole('button', { name: /Logout/i });
  userEvent.click(logoutBtn);

  await waitFor(() => {
    expect(mockLogout).toHaveBeenCalled();
  });
});

  test('opens and submits the role change modal', async () => {
  mockedAxios.put.mockResolvedValueOnce({}); // simulate PUT success

  renderWithAuthContext(<AdminDashboard />);

  await screen.findByText(/John/); // Wait for user table

  const editBtn = screen.getByRole('button', { name: /Edit Role/i });
  userEvent.click(editBtn);

  // Modal content appears
  expect(await screen.findByText(/Change role for/i)).toBeInTheDocument();

  const select = screen.getByRole('combobox');
  userEvent.selectOptions(select, 'Reviewer');

  const confirmBtn = screen.getByRole('button', { name: /Confirm Change/i });
  userEvent.click(confirmBtn);

  await waitFor(() => {
    expect(mockedAxios.put).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/1'),
      { role: 'Reviewer' },
      expect.any(Object)
    );
    expect(screen.getByText(/role updated to Reviewer/i)).toBeInTheDocument();
  });
});

  test('submits assigned reviewers from modal', async () => {
  mockedAxios.post.mockResolvedValue({}); // mock both review + notification creation

  renderWithAuthContext(<AdminDashboard />);

  userEvent.click(await screen.findByRole('button', { name: /Proposals/i }));

  const assignBtn = await screen.findByRole('button', { name: /Assign Reviewers/i });
  userEvent.click(assignBtn);

  const reviewerCheckbox = await screen.findByLabelText(/Alice Smith/);
  userEvent.click(reviewerCheckbox);

  const submitBtn = screen.getByRole('button', { name: /Assign Selected Reviewers/i });
  userEvent.click(submitBtn);

  await waitFor(() => {
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/review'),
      expect.objectContaining({ reviewer: 'r1' }),
      expect.any(Object)
    );
    expect(mockedAxios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/notifications'),
      expect.objectContaining({ message: expect.stringMatching(/assigned to review/i) }),
      expect.any(Object)
    );
    expect(screen.getByText(/Reviewers assigned to proposal/i)).toBeInTheDocument();
  });
});

  test('displays error when fetch fails', async () => {
  mockedAxios.get.mockRejectedValueOnce(new Error('Server error'));

  renderWithAuthContext(<AdminDashboard />);

  await waitFor(() => {
    expect(screen.getByText(/Error connecting to server/i)).toBeInTheDocument();
  });
});

});
