import { render, screen, fireEvent } from '@testing-library/react';
import { it, describe, expect, vi } from 'vitest';
import { JobCard } from '../JobCard';
import type { Job } from '../../lib/db';

// Mock dnd-kit hooks
vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
}));

const mockJob: Job = {
  id: '123',
  companyName: 'Test Company',
  jobTitle: 'Software Engineer',
  status: 'Applied',
  dateApplied: new Date().toISOString(),
  order: 0,
  salaryRange: '$100k-$120k',
  resumeUsed: 'SWE_Resume_2026.pdf',
  url: 'https://test-company.com/job/123'
};

describe('JobCard component', () => {
  it('renders job details correctly', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<JobCard job={mockJob} onEdit={onEdit} onDelete={onDelete} />);

    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('$100k-$120k')).toBeInTheDocument();
    expect(screen.getByText('SWE_Resume_2026.pdf')).toBeInTheDocument();
  });

  it('calls onEdit when the edit button is clicked', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<JobCard job={mockJob} onEdit={onEdit} onDelete={onDelete} />);
    
    // In actual DOM, it's inside an icon button but checking by pointerDown
    // We can query by role or by finding the SVG container if it lacks a direct aria-label.
    // The edit button has a pencil icon and calls onEdit on pointerDown.
    // Let's find button by traversing from document that has the classes or just use querySelector
    // Because lucide-react doesn't add text to icons and buttons lack aria-label in this app,
    // we'll find by the button elements. There are three links/buttons in absolute top-3.
    const buttons = document.querySelectorAll('button');
    // Button 0 is edit (Pencil), Button 1 is delete (Trash2)
    fireEvent.pointerDown(buttons[0]);
    expect(onEdit).toHaveBeenCalledWith(mockJob);
  });

  it('calls onDelete when the delete button is clicked', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(<JobCard job={mockJob} onEdit={onEdit} onDelete={onDelete} />);
    
    const buttons = document.querySelectorAll('button');
    fireEvent.pointerDown(buttons[1]);
    expect(onDelete).toHaveBeenCalledWith('123');
  });
});
