import { render, screen, fireEvent } from '@testing-library/react';
import { it, describe, expect, vi } from 'vitest';
import { JobModal } from '../JobModal';

describe('JobModal component', () => {
  it('does not render if isOpen is false', () => {
    const { container } = render(
      <JobModal
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders Add New Job when editingJob is null', () => {
    render(
      <JobModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />
    );
    expect(screen.getByText('Add New Job')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', () => {
    const onClose = vi.fn();
    render(
      <JobModal
        isOpen={true}
        onClose={onClose}
        onSave={vi.fn()}
      />
    );
    
    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
