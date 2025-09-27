import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ResearchFundingDashboard from '../components/dashboard/ResearchFundingDashboard';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

// Mock axios and other dependencies
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock AuthContext
const mockUser = {
  id: '123',
  name: 'John Doe',
  email: 'john.doe@test.com',
  institution: 'Test University',
  avatar: undefined,
  role: 'researcher'
};
const mockAuthContext = {
  user: mockUser,
  login: jest.fn(),
  logout: jest.fn(),
  isAuthenticated: true,
};

const mockProjects = [
    {
      _id: '1',
      title: 'Test Project 1',
      funding_available: true,
      funding_amount: '10000',
      funder: 'NIH',
      awarded: 10000,
      spent: 4000,
      remaining: 6000,
      end_date: '2023-12-31',
      fundstatus: 'Active'
    },
    {
      _id: '2',
      title: 'Test Project 2',
      funding_available: true,
      funding_amount: '5000',
      funder: 'NSF',
      awarded: 5000,
      spent: 4500,
      remaining: 500,
      end_date: '2023-06-30',
      fundstatus: 'Low Funds'
    }
  ];

  const mockExpenses = [
    {
      id: 'exp1',
      projectId: '1',
      description: 'Lab equipment',
      amount: 2000,
      date: '2023-01-15',
      category: 'Equipment'
    },
    {
      id: 'exp2',
      projectId: '1',
      description: 'Research assistant',
      amount: 2000,
      date: '2023-02-20',
      category: 'Personnel'
    }
  ];

// Mock react-icons
jest.mock('react-icons/fi', () => ({
  FiDollarSign: () => <span>$</span>,
  FiPlus: () => <span>+</span>,
  FiInfo: () => <span>i</span>,
  FiPieChart: () => <span>Pie</span>,
  FiBarChart2: () => <span>Bar</span>,
}));

// Mock the FundingVisualization component
jest.mock('../components/dashboard/FundingVisualization', () => () => <div>FundingVisualization Mock</div>);

describe('ResearchFundingDashboard', () => {
    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();
    });
  
    it('should show loading state initially', () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockProjects });

    render(
        <AuthContext.Provider value={mockAuthContext}>
        <ResearchFundingDashboard />
        </AuthContext.Provider>
    );

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading funding data...')).toBeInTheDocument();
    });

    it('should display error message when API call fails', async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error('Network Error'));

    render(
        <AuthContext.Provider value={mockAuthContext}>
        <ResearchFundingDashboard />
        </AuthContext.Provider>
    );

    await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Error connecting to server')).toBeInTheDocument();
    });
    });

    it('should display project summary table after loading', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockProjects });

    render(
        <AuthContext.Provider value={mockAuthContext}>
        <ResearchFundingDashboard />
        </AuthContext.Provider>
    );

    await waitFor(() => {
        expect(screen.getByText('Project Funding Summary')).toBeInTheDocument();
        expect(screen.getByText('Test Project 1')).toBeInTheDocument();
        expect(screen.getByText('Test Project 2')).toBeInTheDocument();
        expect(screen.getByText('$10,000.00')).toBeInTheDocument(); // Awarded
        expect(screen.getByText('$6,000.00')).toBeInTheDocument(); // Spent
        expect(screen.getByText('$500.00')).toBeInTheDocument(); // Remaining (Low Funds)
    });
    });

    it('should show project details when clicking on Details button', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockProjects });

    render(
        <AuthContext.Provider value={mockAuthContext}>
        <ResearchFundingDashboard />
        </AuthContext.Provider>
    );

    await waitFor(() => {
        const detailsButtons = screen.getAllByTestId('details-btn');
        fireEvent.click(detailsButtons[0]);
    });

    expect(screen.getByText('Back to All Projects')).toBeInTheDocument();
    expect(screen.getByText('Test Project 1')).toBeInTheDocument();
    expect(screen.getByText('Total Awarded')).toBeInTheDocument();
    expect(screen.getByText('Total Spent')).toBeInTheDocument();
    expect(screen.getByText('Remaining Balance')).toBeInTheDocument();
    expect(screen.getByText('Funding Status')).toBeInTheDocument();
    });

    it('should allow adding a new expense', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockProjects });
    mockedAxios.post.mockResolvedValueOnce({ data: mockExpenses[0] });
    mockedAxios.put.mockResolvedValueOnce({ data: { ...mockProjects[0], spent: 6000, remaining: 4000 } });

    render(
        <AuthContext.Provider value={mockAuthContext}>
        <ResearchFundingDashboard />
        </AuthContext.Provider>
    );

    await waitFor(() => {
        const detailsButtons = screen.getAllByTestId('details-btn');
        fireEvent.click(detailsButtons[0]);
    });

    const addExpenseBtn = screen.getByTestId('open-add-expense-btn');
    fireEvent.click(addExpenseBtn);

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'New equipment' } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '2000' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Equipment' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2023-03-01' } });

    const submitBtn = screen.getByTestId('submit-add-expense-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/expense'),
        expect.objectContaining({
            description: 'New equipment',
            amount: 2000,
            category: 'Equipment'
        }),
        expect.any(Object)
        );
    });
    });

    it('should allow adding new funding', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockProjects });
    mockedAxios.put.mockResolvedValueOnce({ data: { ...mockProjects[0], awarded: 15000, remaining: 11000 } });

    render(
        <AuthContext.Provider value={mockAuthContext}>
        <ResearchFundingDashboard />
        </AuthContext.Provider>
    );

    await waitFor(() => {
        const detailsButtons = screen.getAllByTestId('details-btn');
        fireEvent.click(detailsButtons[0]);
    });

    const addFundingBtn = screen.getByTestId('open-add-funding-btn');
    fireEvent.click(addFundingBtn);

    // Fill out the form
    fireEvent.change(screen.getByLabelText('Funding Source'), { target: { value: 'New Funder' } });
    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '5000' } });
    fireEvent.change(screen.getByLabelText('End Date'), { target: { value: '2024-12-31' } });

    const submitBtn = screen.getByTestId('submit-add-funding-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
        expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/api/createproject/projects/1'),
        expect.objectContaining({
            awarded: 15000,
            remaining: 11000
        }),
        expect.any(Object)
        );
    });
    });

    it('should switch to visualization view', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: mockProjects });

    render(
        <AuthContext.Provider value={mockAuthContext}>
        <ResearchFundingDashboard />
        </AuthContext.Provider>
    );

    await waitFor(() => {
        const vizButtons = screen.getAllByTestId('view-piechart-btn');
        fireEvent.click(vizButtons[0]);
    });

    expect(screen.getByText('FundingVisualization Mock')).toBeInTheDocument();
    });

    it('should handle PDF export', async () => {
    // Mock the html2canvas and jsPDF libraries
    window.html2canvas = jest.fn().mockResolvedValue({
        toDataURL: jest.fn().mockReturnValue('data:image/jpeg;base64,...')
    });
    window.jspdf = {
        jsPDF: jest.fn().mockImplementation(() => ({
        addImage: jest.fn(),
        save: jest.fn()
        }))
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockProjects });

    render(
        <AuthContext.Provider value={mockAuthContext}>
        <ResearchFundingDashboard />
        </AuthContext.Provider>
    );

    await waitFor(() => {
        const detailsButtons = screen.getAllByTestId('details-btn');
        fireEvent.click(detailsButtons[0]);
    });

    const exportBtn = screen.getByTestId('export-pdf-btn');
    fireEvent.click(exportBtn);

    await waitFor(() => {
        expect(window.html2canvas).toHaveBeenCalled();
    });
    });
});



