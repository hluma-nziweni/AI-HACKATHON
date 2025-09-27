// Add this before your test cases
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Add this to your test setup
global.ResizeObserver = ResizeObserverMock;

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FundingVisualization, { FundingDetails, Expense } from '../components/dashboard/FundingVisualization';

// Extend Window interface to include html2canvas and jspdf
declare global {
  interface Window {
    html2canvas: any;
    jspdf: {
      jsPDF: any;
    };
  }
}

global.ResizeObserver = ResizeObserverMock;

// Mock data for testing
const mockFundingDetails: FundingDetails[] = [
  {
    projectId: 1,
    projectTitle: 'Project Alpha',
    funder: 'NIH',
    awarded: 100000,
    spent: 60000,
    remaining: 40000,
    endDate: '2023-12-31',
    fundstatus: 'Active'
  },
  {
    projectId: 2,
    projectTitle: 'Project Beta',
    funder: 'NSF',
    awarded: 80000,
    spent: 75000,
    remaining: 5000,
    endDate: '2023-06-30',
    fundstatus: 'Low Funds'
  }
];

const mockExpenses: Expense[] = [
  {
    id: '1',
    projectId: 1,
    description: 'Lab equipment',
    amount: 15000,
    date: '2023-01-15',
    category: 'Equipment'
  },
  {
    id: '2',
    projectId: 1,
    description: 'Salaries',
    amount: 30000,
    date: '2023-02-01',
    category: 'Personnel'
  },
  {
    id: '3',
    projectId: 2,
    description: 'Travel',
    amount: 5000,
    date: '2023-01-20',
    category: 'Travel'
  }
];

const mockFormatCurrency = (amount: number) => `$${amount.toLocaleString()}`;

describe('FundingVisualization Component', () => {
  beforeEach(() => {
    // Mock window objects needed for PDF export
    window.html2canvas = jest.fn().mockResolvedValue({
      toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mockData')
    });
    window.jspdf = {
      jsPDF: jest.fn().mockImplementation(() => ({
        getImageProperties: jest.fn().mockReturnValue({ width: 100, height: 100 }),
        internal: {
          pageSize: { getWidth: jest.fn().mockReturnValue(210) }
        },
        addImage: jest.fn(),
        save: jest.fn()
      }))
    };
  });

  test('renders funding summary metrics correctly', () => {
  render(
    <FundingVisualization
      fundingDetails={mockFundingDetails}
      expenses={mockExpenses}
      selectedProject={null}
      formatCurrency={mockFormatCurrency}
    />
  );

  // Check dollar amounts
  expect(screen.getByText('$180,000')).toBeInTheDocument();
  expect(screen.getByText('$135,000')).toBeInTheDocument();
  expect(screen.getByText('$45,000')).toBeInTheDocument();
  expect(screen.getByText('75.0%')).toBeInTheDocument();

  // Check project counts by finding the container
  const getProjectCountText = (label: string) => {
    const element = screen.getByText(label).closest('div');
    return element?.textContent?.trim();
  };

  expect(getProjectCountText('Active Projects')).toMatch(/1\s*Active Projects/);
  expect(getProjectCountText('Low Funds Projects')).toMatch(/1\s*Low Funds Projects/);
  expect(getProjectCountText('Expired Projects')).toMatch(/0\s*Expired Projects/);
});

  test('shows "select project" message when no project is selected', () => {
  render(
    <FundingVisualization
      fundingDetails={mockFundingDetails}
      expenses={mockExpenses}
      selectedProject={null}
      formatCurrency={mockFormatCurrency}
    />
  );

  const message = screen.getByTestId('no-project-message');
  expect(message).toBeInTheDocument();
  expect(message).toHaveTextContent('Select a project to view');
});

  test('renders allocation chart when a project is selected', () => {
  render(
    <FundingVisualization
      fundingDetails={mockFundingDetails}
      expenses={mockExpenses}
      selectedProject={mockFundingDetails[0]}
      formatCurrency={mockFormatCurrency}
    />
  );

  // Verify the chart title is visible
  expect(
    screen.getByRole('heading', { name: 'Budget Allocation' })
  ).toBeInTheDocument();
  
  // Verify the chart container is rendered
  const chartContainer = document.querySelector('.recharts-responsive-container');
  expect(chartContainer).toBeInTheDocument();
});

  test('switches between chart types', () => {
  render(
    <FundingVisualization
      fundingDetails={mockFundingDetails}
      expenses={mockExpenses}
      selectedProject={mockFundingDetails[0]}
      formatCurrency={mockFormatCurrency}
    />
  );

  // Click on Expense Categories button
  const expenseCategoriesButton = screen.getByRole('button', { name: 'Expense Categories' });
  fireEvent.click(expenseCategoriesButton);
  
  // Verify the chart title is visible
  expect(screen.getByRole('heading', { name: 'Expense Categories' })).toBeInTheDocument();

  // Click on Spending Timeline button
  const spendingTimelineButton = screen.getByRole('button', { name: 'Spending Timeline' });
  fireEvent.click(spendingTimelineButton);
  expect(screen.getByRole('heading', { name: 'Spending Timeline' })).toBeInTheDocument();

  // Click on Project Comparison button
  const projectComparisonButton = screen.getByRole('button', { name: 'Project Comparison' });
  fireEvent.click(projectComparisonButton);
  expect(screen.getByRole('heading', { name: 'Project Comparison' })).toBeInTheDocument();
});

  test('changes time frame for timeline chart', () => {
    render(
      <FundingVisualization
        fundingDetails={mockFundingDetails}
        expenses={mockExpenses}
        selectedProject={mockFundingDetails[0]}
        formatCurrency={mockFormatCurrency}
      />
    );

    // Switch to timeline view
    fireEvent.click(screen.getByText('Spending Timeline'));
    
    // Change time frame to quarterly
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'quarterly' } });
    expect(select).toHaveValue('quarterly');
  });

  test('handles PDF export', async () => {
    render(
      <FundingVisualization
        fundingDetails={mockFundingDetails}
        expenses={mockExpenses}
        selectedProject={mockFundingDetails[0]}
        formatCurrency={mockFormatCurrency}
      />
    );

    const exportButton = screen.getByText('Export as PDF');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(exportButton).toHaveTextContent('Exporting...');
    });

    await waitFor(() => {
      expect(window.html2canvas).toHaveBeenCalled();
      expect(window.jspdf.jsPDF).toHaveBeenCalled();
    });
  });
});