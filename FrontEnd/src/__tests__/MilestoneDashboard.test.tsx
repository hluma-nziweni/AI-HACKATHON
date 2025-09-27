import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AuthContext from '../context/AuthContext';
import MilestoneDashboard from '../components/dashboard/MilestoneDashboard';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock ResizeObserver globally for recharts
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

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

const mockProjects = [
  { _id: 'proj1', title: 'Project 1' },
];

const mockMilestones = [
  {
    _id: 'mile1',
    projectId: 'proj1',
    title: 'Milestone 1',
    description: 'Description 1',
    dueDate: '2025-12-31',
    status: 'not started',
    assignedTo: 'user123',
  },
];

const mockCollaborators = [mockUser];

function renderWithContext() {
  return render(
    <AuthContext.Provider
      value={{
        isAuthenticated: true,
        user: mockUser,
        login: jest.fn(),
        logout: jest.fn(),
      }}
    >
      <MilestoneDashboard />
    </AuthContext.Provider>
  );
}

describe('MilestoneDashboard', () => {
  beforeEach(() => {
    mockedAxios.get.mockReset();
    mockedAxios.post.mockReset();
    mockedAxios.put.mockReset();
    mockedAxios.delete.mockReset();
  });

  test('renders and fetches data', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: mockProjects })       // fetchProjects
      .mockResolvedValueOnce({ data: mockMilestones })     // fetchMilestones
      .mockResolvedValueOnce({ data: mockCollaborators }); // fetchCollaborators

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Milestone 1')).toBeInTheDocument();
    });

    expect(screen.getByText(/Project Milestones/i)).toBeInTheDocument();
    expect(screen.getByText(/Milestone Timeline/i)).toBeInTheDocument();
  });

  test('opens and closes create milestone modal', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: mockProjects })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: mockCollaborators });

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/New Milestone/i));

    expect(screen.getByText(/Create New Milestone/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Cancel/i));
    await waitFor(() => {
      expect(screen.queryByText(/Create New Milestone/i)).not.toBeInTheDocument();
    });
  });

  test('edits an existing milestone', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: mockProjects })
      .mockResolvedValueOnce({ data: mockMilestones })
      .mockResolvedValueOnce({ data: mockCollaborators });

    mockedAxios.put.mockResolvedValueOnce({
      data: { ...mockMilestones[0], title: 'Updated Title' },
    });

    renderWithContext();

    await waitFor(() => screen.getByText('Milestone 1'));

    const editButton = screen.getAllByRole('button', { name: '' })[0];
    fireEvent.click(editButton);

    const titleInput = screen.getByLabelText(/Title/i);
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

    fireEvent.click(screen.getByText(/Update Milestone/i));

    await waitFor(() =>
      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/api/milestone/mile1'),
        expect.objectContaining({ title: 'Updated Title' }),
        expect.any(Object)
      )
    );
  });

  test('deletes a milestone', async () => {
    mockedAxios.get
      .mockResolvedValueOnce({ data: mockProjects })
      .mockResolvedValueOnce({ data: mockMilestones })
      .mockResolvedValueOnce({ data: mockCollaborators });

    mockedAxios.delete.mockResolvedValueOnce({});

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Milestone 1')).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText(/delete milestone/i);
    fireEvent.click(deleteButton);

    await waitFor(() =>
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        expect.stringContaining('/api/milestone/mile1'),
        expect.any(Object)
      )
    );
  });

  test('handles project fetch error gracefully', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText(/Error fetching projects/i)).toBeInTheDocument();
    });
  });
});
