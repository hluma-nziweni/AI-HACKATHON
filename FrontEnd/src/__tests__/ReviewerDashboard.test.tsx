import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ReviewerDashboard from '../components/dashboard/ReviewerDashboard';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { MemoryRouter } from 'react-router-dom';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock react-icons
jest.mock('react-icons/fi', () => ({
  FiFileText: () => <div>FiFileText</div>,
  FiLogOut: () => <div>FiLogOut</div>,
  FiEye: () => <div>FiEye</div>,
  FiCheckCircle: () => <div>FiCheckCircle</div>,
  FiMessageSquare: () => <div>FiMessageSquare</div>,
}));

jest.mock('react-icons/ai', () => ({
  AiFillNotification: () => <div>AiFillNotification</div>,
}));

// Mock AuthContext values
const mockUser = {
  id: '123',
  name: 'John Doe',
  email: 'john.doe@test.com',
  institution: 'Test University',
  avatar: undefined,
  role: 'reviewer'
};

const mockLogin = jest.fn();
const mockLogout = jest.fn();

const mockAuthContext = {
  isAuthenticated: true,
  user: mockUser,
  login: mockLogin,
  logout: mockLogout,
};

// Mock proposals data
const mockProposals = [
  {
    _id: '1',
    projectId: 'p1',
    project_title: 'Test Proposal 1',
    description: 'This is a test proposal',
    research_goals: 'Research goals text',
    research_area: 'Computer Science',
    creator_email: 'creator@test.com',
    creator: { _id: 'c1', fname: 'Creator', lname: 'One', role: 'researcher' },
    institution: 'Creator University',
    createdAt: '2023-01-01T00:00:00Z',
    start_date: '2023-02-01',
    end_date: '2023-12-31',
    status: 'Pending',
    feedback: '',
    file: {
      data: "base64-string",
      contentType: "application/pdf",
      originalName: "proposal.pdf"
    }
  },
  {
    _id: '2',
    projectId: 'p2',
    project_title: 'Test Proposal 2',
    description: 'Another test proposal',
    research_goals: 'More research goals',
    research_area: 'Biology',
    creator_email: 'creator2@test.com',
    creator: { _id: 'c2', fname: 'Creator', lname: 'Two', role: 'researcher' },
    institution: 'Another University',
    createdAt: '2023-01-15T00:00:00Z',
    start_date: '2023-03-01',
    end_date: '2023-11-30',
    status: 'Pending',
    feedback: '',
    file: {
      data: "base64-string",
      contentType: "application/pdf",
      originalName: "proposal2.pdf"
    }
  }
];

const mockEvaluatedProposal = {
  ...mockProposals[0],
  status: 'Approved',
  feedback: 'Approved'
};

describe('ReviewerDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValueOnce({
      data: mockProposals,
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <AuthContext.Provider value={mockAuthContext}>
          <ReviewerDashboard />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  it('renders loading state initially', async () => {
    renderComponent();
    
    expect(screen.getByText('Loading reviewer dashboard...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading reviewer dashboard...')).not.toBeInTheDocument();
    });
  });

  it('renders the dashboard with user information', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Test University')).toBeInTheDocument();
      expect(screen.getByText('Reviewer')).toBeInTheDocument();
    });
  });

  it('fetches and displays assigned proposals', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining(`/api/review/reviews/${mockUser.id}`),
        { withCredentials: true }
      );
      
      expect(screen.getByText('Test Proposal 1')).toBeInTheDocument();
      expect(screen.getByText('Test Proposal 2')).toBeInTheDocument();
      expect(screen.getByText('Computer Science')).toBeInTheDocument();
      expect(screen.getByText('Biology')).toBeInTheDocument();
    });
  });

  it('shows empty state when no proposals are assigned', async () => {
    mockedAxios.get.mockReset().mockResolvedValueOnce({ data: [] });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText("You don't have any proposals assigned for review yet.")).toBeInTheDocument();
    });
  });

  it('displays proposal details when a proposal is clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Proposal 1')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Test Proposal 1').closest('.proposal-card')!);
    
    await waitFor(() => {
      expect(screen.getByText('Proposal Details')).toBeInTheDocument();
      expect(screen.getByText('This is a test proposal')).toBeInTheDocument();
      expect(screen.getByText('Research goals text')).toBeInTheDocument();
      expect(screen.getByText('Creator University')).toBeInTheDocument();
      expect(screen.getByText('Creator One')).toBeInTheDocument();
    });
  });

  it('shows evaluation form when "Evaluate Proposal" is clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Proposal 1')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Test Proposal 1').closest('.proposal-card')!);
    
    await waitFor(() => {
      expect(screen.getByText('Evaluate Proposal')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Evaluate Proposal'));
    
    expect(screen.getByText('Evaluate: Test Proposal 1')).toBeInTheDocument();
    expect(screen.getByText('Scientific Merit')).toBeInTheDocument();
    expect(screen.getByText('Methodology')).toBeInTheDocument();
    expect(screen.getByText('Feasibility')).toBeInTheDocument();
    expect(screen.getByText('Potential Impact')).toBeInTheDocument();
    expect(screen.getByText('Comments and Feedback')).toBeInTheDocument();
    expect(screen.getByText('Recommendation')).toBeInTheDocument();
  });

  it('allows changing evaluation scores and submitting', async () => {
  mockedAxios.put.mockResolvedValueOnce({});
  
  renderComponent();
  
  await waitFor(() => {
    expect(screen.getByText('Test Proposal 1')).toBeInTheDocument();
  });
  
  fireEvent.click(screen.getByText('Test Proposal 1').closest('.proposal-card')!);
  fireEvent.click(screen.getByText('Evaluate Proposal'));
  
  // Find all range inputs (scientific merit is the first one)
  const rangeInputs = screen.getAllByRole('slider');
  const scientificMeritSlider = rangeInputs[0] as HTMLInputElement;
  
  // Verify initial value
  expect(scientificMeritSlider.value).toBe('3');
  
  // Change the value
  fireEvent.change(scientificMeritSlider, { target: { value: '4' } });
  
  // Verify the value updated
  expect(scientificMeritSlider.value).toBe('4');
  
  // Test other form fields
  const commentsTextarea = screen.getByPlaceholderText('Provide detailed feedback for the researchers...');
  fireEvent.change(commentsTextarea, { target: { value: 'This is a test comment' } });
  
  const recommendationSelect = screen.getByLabelText('Recommendation');
  fireEvent.change(recommendationSelect, { target: { value: 'Approve' } });
  
  fireEvent.click(screen.getByText('Submit Evaluation'));
  
  await waitFor(() => {
    expect(mockedAxios.put).toHaveBeenCalled();
    expect(screen.getByText('Evaluation submitted successfully')).toBeInTheDocument();
  });
});

  it('handles API errors when fetching proposals', async () => {
    mockedAxios.get.mockReset().mockRejectedValueOnce(new Error('Network error'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Error connecting to server')).toBeInTheDocument();
    });
  });

  it('handles logout correctly', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Proposal 1')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Logout'));
    
    expect(mockLogout).toHaveBeenCalled();
  });

  it('displays error message when evaluation submission fails', async () => {
    mockedAxios.put.mockRejectedValueOnce(new Error('Submission failed'));
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Proposal 1')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Test Proposal 1').closest('.proposal-card')!);
    fireEvent.click(screen.getByText('Evaluate Proposal'));
    fireEvent.click(screen.getByText('Submit Evaluation'));
    
    await waitFor(() => {
      expect(screen.getByText('Failed to submit evaluation')).toBeInTheDocument();
    });
  });

  it('disables evaluate button for already evaluated proposals', async () => {
    mockedAxios.get.mockReset().mockResolvedValueOnce({
      data: [mockEvaluatedProposal],
    });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Proposal 1')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Test Proposal 1').closest('.proposal-card')!);
    
    await waitFor(() => {
      const evaluateButton = screen.getByText('Evaluate Proposal').closest('button');
      expect(evaluateButton).toBeDisabled();
      expect(screen.getByText('This proposal has already been evaluated.')).toBeInTheDocument();
    });
  });

  it('displays notification and message links in sidebar', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Notification')).toBeInTheDocument();
      expect(screen.getByText('Message Users')).toBeInTheDocument();
    });
  });

  it('formats dates correctly', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Test Proposal 1')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Test Proposal 1').closest('.proposal-card')!);
    
    await waitFor(() => {
      // Check if date is formatted as "Month Day, Year"
      expect(screen.getByText(/January 1, 2023/)).toBeInTheDocument();
      expect(screen.getByText(/February 1, 2023/)).toBeInTheDocument();
      expect(screen.getByText(/December 31, 2023/)).toBeInTheDocument();
    });
  });
});