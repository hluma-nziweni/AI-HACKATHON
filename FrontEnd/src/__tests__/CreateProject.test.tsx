import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateProject from '../components/CreateProject';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext'; // Import the AuthContext

// Mock navigate and axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock user context
const mockUser = {
  id: 'user123',
  name: 'John Doe',
  email: 'john@example.com',
  fname: 'John',
  lname: 'Doe',
  academicRole: 'Researcher',
  department: 'Computer Science',
  researchExperience: 'Intermediate',
  researcharea: 'AI',
};
const mockAuthContext = {
  user: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: true,
};

const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <BrowserRouter>{ui}</BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('CreateProject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(HTMLFormElement.prototype, 'checkValidity').mockImplementation(() => true);
  });

  test('renders form fields', () => {
    renderWithRouter(<CreateProject />);

    expect(screen.getByLabelText(/Project Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Research Goals/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Research Area/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/End Date/i)).toBeInTheDocument();
  });

  test('shows additional fields when funding/collaborators checked', () => {
    renderWithRouter(<CreateProject />);

    const fundingCheckbox = screen.getByLabelText(/Funding Available/i);
    fireEvent.click(fundingCheckbox);
    expect(screen.getByLabelText(/Funding Amount/i)).toBeInTheDocument();

    const collabCheckbox = screen.getByLabelText(/Seeking Collaborators/i);
    fireEvent.click(collabCheckbox);
    expect(screen.getByLabelText(/Collaborator Roles Needed/i)).toBeInTheDocument();
  });

  test('submits form successfully and navigates', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { success: true } });

    renderWithRouter(<CreateProject />);

    fireEvent.change(screen.getByLabelText(/Project Title/i), { target: { value: 'AI Research' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Exploring models' } });
    fireEvent.change(screen.getByLabelText(/Research Goals/i), { target: { value: 'Better ML methods' } });
    fireEvent.change(screen.getByLabelText(/Research Area/i), { target: { value: 'Artificial Intelligence' } });
    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2025-01-01' } });
    fireEvent.change(screen.getByLabelText(/End Date/i), { target: { value: '2025-12-31' } });
    fireEvent.change(screen.getByLabelText(/Institution/i), { target: { value: 'Tech University' } });
    fireEvent.change(screen.getByLabelText(/Contact Email/i), { target: { value: 'contact@techuni.edu' } });

    // Add a mock file
    const mockFile = new File(['dummy content'], 'example.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/Upload Project Image\/File/i);
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    fireEvent.click(screen.getByRole('button', { name: /Create Project/i }));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/collaboratordashboard');
    });
  }, 30000);

  test('displays error message if submission fails', async () => {
  mockedAxios.post.mockResolvedValueOnce({
    data: { success: false, message: 'Invalid data' },
  });

  renderWithRouter(<CreateProject />);

  fireEvent.change(screen.getByLabelText(/Project Title/i), { target: { value: 'Fail Case' } });
  fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'desc' } });
  fireEvent.change(screen.getByLabelText(/Research Goals/i), { target: { value: 'goals' } });
  fireEvent.change(screen.getByLabelText(/Research Area/i), { target: { value: 'Artificial Intelligence' } });
  fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2025-01-01' } });
  fireEvent.change(screen.getByLabelText(/End Date/i), { target: { value: '2025-12-31' } });
  fireEvent.change(screen.getByLabelText(/Contact Email/i), { target: { value: 'fail@example.com' } });

  // Add mock file and simulate input
  const fileInput = screen.getByLabelText(/Upload Project Image\/File/i);
  const mockFile = new File(['dummy content'], 'example.pdf', { type: 'application/pdf' });
  const changeEvent = {
    target: {
      files: [mockFile],
    },
  };
  fireEvent.change(fileInput, changeEvent);

  fireEvent.click(screen.getByRole('button', { name: /Create Project/i }));

  await waitFor(() => {
    expect(mockedAxios.post).toHaveBeenCalled();
  });

  const alert = await screen.findByTestId('form-error');
  expect(alert).toHaveTextContent(/Invalid data/i);
});


  test('displays validation error for end date earlier than start date', async () => {
    renderWithRouter(<CreateProject />);
  
    fireEvent.change(screen.getByLabelText(/Project Title/i), { target: { value: 'AI Research' } });
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'Exploring models' } });
    fireEvent.change(screen.getByLabelText(/Research Goals/i), { target: { value: 'Better ML methods' } });
    fireEvent.select(screen.getByLabelText(/Research Area/i), { target: { value: 'Artificial Intelligence' } });
    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2025-12-31' } });
    fireEvent.change(screen.getByLabelText(/End Date/i), { target: { value: '2025-01-01' } });
    fireEvent.change(screen.getByLabelText(/Contact Email/i), { target: { value: 'test@example.com' } });
  
    fireEvent.click(screen.getByRole('button', { name: /Create Project/i }));
  
    await waitFor(() => {
      const errorElement = screen.getByTestId('form-error');
      expect(errorElement).toHaveTextContent(/End date cannot be earlier than start date/i);
    });
  }, 10000);
  

  test('displays error for missing required fields when submitting', async () => {
    renderWithRouter(<CreateProject />);

    fireEvent.click(screen.getByRole('button', { name: /Create Project/i }));

    await waitFor(() => {
      expect(screen.getByText(/Please provide a project title/i)).toBeInTheDocument();
      expect(screen.getByText(/Please provide a project description/i)).toBeInTheDocument();
      expect(screen.getByText(/Please provide research goals/i)).toBeInTheDocument();
      expect(screen.getByText(/Please select a research area/i)).toBeInTheDocument();
    });
  });
});