import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ProjectCollaboratorsList from '../components/ViewCollaborators';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderComponent = (props = {}) => {
  return render(
    <BrowserRouter>
      <ProjectCollaboratorsList projectId={1} projectName="AI Research" {...props} />
    </BrowserRouter>
  );
};

describe('ProjectCollaboratorsList', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('displays loading spinner initially', async () => {
    mockedAxios.get.mockReturnValueOnce(new Promise(() => {})); // Never resolves

    renderComponent();
    expect(screen.getByText(/Loading collaborators/i)).toBeInTheDocument();
  });

  test('displays error message on API failure', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('API error'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch collaborators/i)).toBeInTheDocument();
    });
  });

  test('displays message when no collaborators are found', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/No collaborators found/i)).toBeInTheDocument();
    });
  });

  test('renders collaborators when data is returned', async () => {
  mockedAxios.get.mockResolvedValueOnce({
    data: [
      {
        _id: '1',
        fname: 'Alice',
        lname: 'Smith',
        academicRole: 'Researcher',
        department: 'CS',
        researchExperience: '5 years',
        researcharea: 'AI',
        avatar: '',
      },
    ],
  });

  renderComponent();

  expect(await screen.findByText(/Alice Smith/)).toBeInTheDocument();

  expect(screen.getByText((_, node) =>
    node?.textContent === 'Department: CS'
  )).toBeInTheDocument();

  expect(screen.getByText((_, node) =>
    node?.textContent === 'Experience: 5 years'
  )).toBeInTheDocument();

  expect(screen.getAllByText('AI').length).toBeGreaterThan(0);
});


  test('navigates to group chat when button clicked', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        {
          _id: '2',
          fname: 'Bob',
          lname: 'Jones',
          academicRole: 'Analyst',
          department: 'Physics',
          researchExperience: '2 years',
          researcharea: 'Quantum Mechanics',
          avatar: undefined,
        },
      ],
    });

    renderComponent();

    const chatButton = await screen.findByRole('button', { name: /Enter Group Chat/i });
    fireEvent.click(chatButton);

    expect(mockNavigate).toHaveBeenCalledWith('/chat/1');
  });
});
