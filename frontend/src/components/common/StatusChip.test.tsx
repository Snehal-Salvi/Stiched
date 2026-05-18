import { render, screen } from '@testing-library/react';
import StatusChip from './StatusChip';
import type { Order } from '../../types';

describe('StatusChip', () => {
  test.each<[Order['status'], string]>([
    ['pending', 'Pending'],
    ['accepted', 'Accepted'],
    ['in_progress', 'In Progress'],
    ['completed', 'Completed'],
    ['cancelled', 'Cancelled'],
    ['rejected', 'Rejected'],
  ])('renders the human-readable label for status=%s', (status, label) => {
    render(<StatusChip status={status} />);

    expect(screen.getByText(label)).toBeInTheDocument();
  });
});
