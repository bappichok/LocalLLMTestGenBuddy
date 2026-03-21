import { render, screen, fireEvent } from '@testing-library/react';
import { it, describe, expect, vi } from 'vitest';
import { Header } from '../Header';

describe('Header component', () => {
  it('renders correctly', () => {
    const setSearchQuery = vi.fn();
    const toggleTheme = vi.fn();
    const onAddJob = vi.fn();
    const onExport = vi.fn();
    const onImport = vi.fn();

    render(
      <Header
        searchQuery=""
        setSearchQuery={setSearchQuery}
        isDark={false}
        toggleTheme={toggleTheme}
        onAddJob={onAddJob}
        onExport={onExport}
        onImport={onImport}
      />
    );

    // Expect the title
    expect(screen.getByText('JobFilterAI')).toBeInTheDocument();
    
    // Expect the input field
    const input = screen.getByPlaceholderText('Search by company or role...');
    expect(input).toBeInTheDocument();
  });

  it('triggers onAddJob when Add Job button is clicked', () => {
    const setSearchQuery = vi.fn();
    const toggleTheme = vi.fn();
    const onAddJob = vi.fn();
    const onExport = vi.fn();
    const onImport = vi.fn();

    render(
      <Header
        searchQuery=""
        setSearchQuery={setSearchQuery}
        isDark={false}
        toggleTheme={toggleTheme}
        onAddJob={onAddJob}
        onExport={onExport}
        onImport={onImport}
      />
    );

    const btn = screen.getByText('Add Job');
    fireEvent.click(btn);
    expect(onAddJob).toHaveBeenCalledOnce();
  });
});
