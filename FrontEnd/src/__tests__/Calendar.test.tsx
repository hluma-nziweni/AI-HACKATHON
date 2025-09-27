import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Calendar from '../components/dashboard/Calendar';
import '@testing-library/jest-dom';

const mockProjects = [
  {
    _id: 1,
    title: 'AI Research',
    description: 'Exploring AI algorithms',
    research_area: 'Artificial Intelligence',
    start_date: '2025-05-10',
    end_date: '2025-05-20',
    institution: 'OpenAI'
  },
  {
    _id: 2,
    title: 'Quantum Study',
    description: 'Quantum entanglement',
    research_area: 'Quantum Physics',
    start_date: '2025-05-15',
    end_date: '2025-05-25',
    institution: 'MIT'
  }
];

describe('Calendar Component', () => {
    const fixedDate = new Date('2023-11-15T12:00:00Z');  // any known date

  beforeAll(() => {
    // Mock Date globally
    jest.useFakeTimers().setSystemTime(fixedDate);
  });

  afterAll(() => {
    jest.useRealTimers(); // restore after test
  });

  test('renders calendar title with current month and year', () => {
    render(<Calendar projects={[]} />);
    const today = new Date();
    const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(today);
    expect(screen.getByText(monthYear)).toBeInTheDocument();
  });

  test('renders correct number of day elements', () => {
    render(<Calendar projects={mockProjects} />);
    const days = screen.getAllByText((text, node) => {
      if (!node) return false;
      return /^\d+$/.test(text) && node.classList.contains('date-number');
    });
    expect(days.length).toBeGreaterThanOrEqual(28); // depends on month
  });

  test('shows event indicators for project start and end dates', () => {
    render(<Calendar projects={mockProjects} />);
  
    expect(screen.getByText(/Project Start/i)).toBeInTheDocument();
    expect(screen.getByText(/Project End/i)).toBeInTheDocument();
  });
  
  test('navigates to previous and next month', () => {
    render(<Calendar projects={[]} />);
    const initialHeader = screen.getByRole('heading', { level: 4 }).textContent;
  
    const nextBtn = screen.getByRole('button', { name: 'Next month' });
    fireEvent.click(nextBtn);
  
    const nextHeader = screen.getByRole('heading', { level: 4 }).textContent;
    expect(nextHeader).not.toBe(initialHeader);
  
    const prevBtn = screen.getByRole('button', { name: 'Previous month' });
    fireEvent.click(prevBtn);
  
    const backToInitial = screen.getByRole('heading', { level: 4 }).textContent;
    expect(backToInitial).toBe(initialHeader);
  });
  

  test('highlights today\'s date', () => {
    render(<Calendar projects={[]} />);

    // Get the numeric day (15), and convert to string (no leading 0)
    const todayDay = fixedDate.getUTCDate().toString(); // -> "15"

    // Find all day numbers matching today
    const elements = screen.getAllByText(todayDay, { exact: true });

    // Look through matches and check if any has 'today' class
    const matched = elements.some(el => el.closest('.calendar-day')?.classList.contains('today'));

    expect(matched).toBe(true);
  });
});
