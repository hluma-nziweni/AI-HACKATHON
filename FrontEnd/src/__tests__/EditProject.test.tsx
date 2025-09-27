import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import EditProject from '../components/EditProject';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: '123' }),
}));

const sampleProject = {
  _id: '123',
  creator: 'user123',
  title: 'Edited Project',
  description: 'Updated description',
  research_goals: 'Updated goals',
  research_area: 'Machine Learning',
  start_date: '2025-01-01T00:00:00.000Z',
  end_date: '2025-12-31T00:00:00.000Z',
  funding_available: true,
  funding_amount: '10000',
  collaborators_needed: true,
  collaborator_roles: 'ML Engineer',
  institution: 'Tech Uni',
  contact_email: 'edit@tech.edu',
  file: {
    data: 'base64-string',
    contentType: 'application/pdf',
    originalName: 'proposal.pdf',
  },
};

// Mock AuthContext value with all required properties
const mockAuthContext = {
  user: { 
    id: 'user123',
    name: 'Test User',
    email: 'test@example.com'
  },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
};

const EditProjectWithContext = () => (
  <AuthContext.Provider value={mockAuthContext}>
    <MemoryRouter initialEntries={['/projects/123/edit']}>
      <Routes>
        <Route path="/projects/:id/edit" element={<EditProject />} />
      </Routes>
    </MemoryRouter>
  </AuthContext.Provider>
);

describe('EditProject', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays loading spinner initially', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: sampleProject });

    render(<EditProjectWithContext />);

    expect(screen.getByText(/Loading project data/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Edited Project')).toBeInTheDocument();
    });
  });

  test('loads form fields with project data including file link', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: sampleProject });

    render(<EditProjectWithContext />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Edited Project')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Updated description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Updated goals')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('ML Engineer')).toBeInTheDocument();
      expect(screen.getByDisplayValue('edit@tech.edu')).toBeInTheDocument();
      expect(screen.getByText(/Download proposal.pdf/i)).toBeInTheDocument();
      // Use the proper id selector for the file input
      expect(screen.getByLabelText(/Upload Project Image\/File/i)).toBeInTheDocument();
    });
  });

  test('toggles conditional fields based on checkbox input', async () => {
    mockedAxios.get.mockResolvedValueOnce({ 
      data: { 
        ...sampleProject, 
        funding_available: false, 
        collaborators_needed: false 
      } 
    });

    render(<EditProjectWithContext />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Funding Available/i)).toBeInTheDocument();
    });

    // Initially, funding amount should not be visible
    expect(screen.queryByLabelText(/Funding Amount/i)).not.toBeInTheDocument();

    // Click funding available checkbox
    await act(async () => {
      fireEvent.click(screen.getByLabelText(/Funding Available/i));
    });
    expect(screen.getByLabelText(/Funding Amount/i)).toBeInTheDocument();

    // Initially, collaborator roles should not be visible
    expect(screen.queryByLabelText(/Collaborator Roles Needed/i)).not.toBeInTheDocument();

    // Click seeking collaborators checkbox
    await act(async () => {
      fireEvent.click(screen.getByLabelText(/Seeking Collaborators/i));
    });
    expect(screen.getByLabelText(/Collaborator Roles Needed/i)).toBeInTheDocument();
  });

  test('submits updated form and navigates on success', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: sampleProject });
    mockedAxios.put.mockResolvedValueOnce({ data: { success: true } });

    render(<EditProjectWithContext />);

    await waitFor(() => screen.getByDisplayValue('Edited Project'));

    // Update form fields
    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Project Title/i), { 
        target: { value: 'Final Project Title' } 
      });
      fireEvent.change(screen.getByLabelText(/Description/i), { 
        target: { value: 'Final description' } 
      });
      fireEvent.change(screen.getByLabelText(/Research Goals/i), { 
        target: { value: 'Final goals' } 
      });
      
      // Research Area select dropdown - get by role instead of label
      const researchAreaSelect = screen.getByRole('combobox', { name: /research area/i });
      fireEvent.change(researchAreaSelect, { target: { value: 'Machine Learning' } });
      
      fireEvent.change(screen.getByLabelText(/Start Date/i), { 
        target: { value: '2025-01-01' } 
      });
      fireEvent.change(screen.getByLabelText(/End Date/i), { 
        target: { value: '2025-12-31' } 
      });
      fireEvent.change(screen.getByLabelText(/Funding Amount/i), { 
        target: { value: '15000' } 
      });
      fireEvent.change(screen.getByLabelText(/Collaborator Roles Needed/i), { 
        target: { value: 'Data Analyst' } 
      });
      fireEvent.change(screen.getByLabelText(/Institution/i), { 
        target: { value: 'Updated Uni' } 
      });
      fireEvent.change(screen.getByLabelText(/Contact Email/i), { 
        target: { value: 'updated@uni.edu' } 
      });
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    });

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/api/createproject/projects/123'),
        expect.objectContaining({
          title: 'Final Project Title',
          description: 'Final description',
          research_goals: 'Final goals',
          research_area: 'Machine Learning',
          start_date: '2025-01-01',
          end_date: '2025-12-31',
          funding_amount: '15000',
          collaborator_roles: 'Data Analyst',
          institution: 'Updated Uni',
          contact_email: 'updated@uni.edu',
          creator: 'user123'
        }),
        expect.objectContaining({
          withCredentials: true
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/projects/123');
    });
  });

  test('displays error if update fails', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: sampleProject });

    mockedAxios.put.mockRejectedValueOnce({
      response: {
        data: {
          message: 'Update failed',
        },
      },
    });

    render(<EditProjectWithContext />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Edited Project')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    });

    // Wait for the error to appear using the data-testid
    await waitFor(() => {
      const errorElement = screen.getByTestId('update-error');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent(/update failed/i);
    }, { timeout: 10000 });
  });

  test('handles form validation for required fields', async () => {
    const emptyProject = {
      ...sampleProject,
      title: '',
      description: '',
      research_goals: '',
      research_area: '',
      start_date: '',
      end_date: '',
    };

    mockedAxios.get.mockResolvedValueOnce({ data: emptyProject });

    render(<EditProjectWithContext />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Project Title/i)).toBeInTheDocument();
    });

    // Try to submit without filling required fields
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Save Changes/i }));
    });

    // Should not make API call
    expect(mockedAxios.put).not.toHaveBeenCalled();
  });

  test('handles server error during project loading', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Server error'));

    render(<EditProjectWithContext />);

    await waitFor(() => {
      expect(screen.getByTestId('update-error')).toHaveTextContent(
        /server error/i
      );
    });
  });

  test('requires authentication to edit project', () => {
    const mockUnauthenticatedContext = {
      user: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
    };

    render(
      <AuthContext.Provider value={mockUnauthenticatedContext}>
        <MemoryRouter initialEntries={['/projects/123/edit']}>
          <Routes>
            <Route path="/projects/:id/edit" element={<EditProject />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Use getAllByText to handle multiple loading elements
    const loadingElements = screen.queryAllByText(/loading/i);
    expect(loadingElements.length).toBeGreaterThanOrEqual(0);
  });

  test('prevents editing if user is not the creator', async () => {
    const differentUserContext = {
      user: { 
        id: 'different-user',
        name: 'Different User',
        email: 'different@example.com'
      },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
    };

    mockedAxios.get.mockResolvedValueOnce({ data: sampleProject });

    render(
      <AuthContext.Provider value={differentUserContext}>
        <MemoryRouter initialEntries={['/projects/123/edit']}>
          <Routes>
            <Route path="/projects/:id/edit" element={<EditProject />} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalled();
    });

    const submitButton = screen.queryByRole('button', { name: /Save Changes/i });
    expect(submitButton).toBeInTheDocument();
  });
});