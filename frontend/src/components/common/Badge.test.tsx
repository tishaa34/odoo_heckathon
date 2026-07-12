import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './Badge';
import { VEHICLE_STATUS_META, TRIP_STATUS_META } from '@/constants';

describe('StatusBadge', () => {
  it('renders the human label for a vehicle status', () => {
    render(<StatusBadge status="IN_SHOP" meta={VEHICLE_STATUS_META} />);
    expect(screen.getByText('In Shop')).toBeInTheDocument();
  });

  it('maps trip statuses to their labels', () => {
    render(<StatusBadge status="IN_PROGRESS" meta={TRIP_STATUS_META} />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('falls back to the raw status when unknown', () => {
    render(<StatusBadge status="MYSTERY" meta={VEHICLE_STATUS_META} />);
    expect(screen.getByText('MYSTERY')).toBeInTheDocument();
  });
});
