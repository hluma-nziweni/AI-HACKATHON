import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Signup from '../components/auth/SignUp';
import AuthContext from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

beforeEach(() => {
  // Reset window.location.search before each test
  (window as any).location.search = '?userId=12345';
});

beforeAll(() => {
  delete (window as any).location;
  (window as any).location = {
    search: '?userId=12345',
  };
});

const mockAuthContextValue = {
  user: { name: 'Test User', id: '1', email: 'test@example.com' },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <AuthContext.Provider value={mockAuthContextValue}>
      <BrowserRouter>{ui}</BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('Signup Component', () => {
  test('renders form with initial values', () => {
    renderWithProviders(<Signup />);
    // The component is using the first part of the name
    expect(screen.getByText(/Hello, Test!/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contact Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Department/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Academic Role/i)).toHaveValue('Student');
  });

  test('updates form fields on change', () => {
    renderWithProviders(<Signup />);
    const contactInput = screen.getByLabelText(/Contact Number/i);
    fireEvent.change(contactInput, { target: { value: '1234567890' } });
    expect(contactInput).toHaveValue('1234567890');
  });

  test('shows role-specific fields for Researcher', () => {
    renderWithProviders(<Signup />);
    // Use a more specific selector to avoid ambiguity with "Academic Role"
    const roleSelect = screen.getByLabelText(/^Role$/i);
    fireEvent.change(roleSelect, { target: { value: 'Researcher' } });
    expect(screen.getByLabelText(/Research Area/i)).toBeInTheDocument();
  });

  test('shows only Research Experience for Reviewer', () => {
    renderWithProviders(<Signup />);
    // Use a more specific selector to avoid ambiguity with "Academic Role"
    const roleSelect = screen.getByLabelText(/^Role$/i);
    fireEvent.change(roleSelect, { target: { value: 'Reviewer' } });
    expect(screen.queryByLabelText(/Research Area/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Research Experience/i)).toBeInTheDocument();
  });

  test('handles successful form submission', async () => {
    mockedAxios.put.mockResolvedValueOnce({ data: { success: true } });

    renderWithProviders(<Signup />);

    fireEvent.change(screen.getByLabelText(/Contact Number/i), {
      target: { value: '1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/Department/i), {
      target: { value: 'Computer Science' },
    });
    fireEvent.change(screen.getByLabelText(/Research Area/i), {
      target: { value: 'AI' },
    });
    fireEvent.change(screen.getByLabelText(/Research Experience/i), {
      target: { value: 'Masters' },
    });

    const button = screen.getByRole('button', { name: /Register/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/12345'),
        expect.objectContaining({ contact: '1234567890' })
      );
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  test('displays API error message', async () => {
    mockedAxios.put.mockRejectedValueOnce({
      response: {
        data: { message: 'Update failed due to server error' },
      },
    });

    renderWithProviders(<Signup />);

    fireEvent.change(screen.getByLabelText(/Contact Number/i), {
      target: { value: '1234567890' },
    });
    fireEvent.change(screen.getByLabelText(/Department/i), {
      target: { value: 'Science' },
    });
    fireEvent.change(screen.getByLabelText(/Research Area/i), {
      target: { value: 'Machine Learning' },
    });
    fireEvent.change(screen.getByLabelText(/Research Experience/i), {
      target: { value: 'PhD' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Register/i }));

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalled();
      expect(
        screen.getByText(/Update failed due to server error/i)
      ).toBeInTheDocument();
    });
  });
});