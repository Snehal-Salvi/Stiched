import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import TailorCard from './TailorCard';
import type { Tailor } from '../../types';

const navigateMock = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

const buildTailor = (overrides: Partial<Tailor> = {}): Tailor => ({
  _id: 't-1',
  user: { _id: 'u-1', name: 'Priya', email: 'p@x.com', role: 'tailor', avatar: '', isVerified: true },
  shopName: 'Priya Tailors',
  description: '',
  experience: 5,
  services: [
    { _id: 's1', name: 'Blouse', category: 'Women', price: 500, turnaroundDays: 5, description: '' },
    { _id: 's2', name: 'Lehenga', category: 'Women', price: 3000, turnaroundDays: 14, description: '' },
  ],
  location: { city: 'Mumbai', state: 'MH', pincode: '' },
  socialLinks: {},
  shopPhotos: [{ _id: 'p1', image: 'https://example.com/shop.jpg', caption: '' }],
  workSamples: [],
  rating: 4.2,
  totalReviews: 17,
  isAvailable: true,
  createdAt: '2026-01-01',
  ...overrides,
});

beforeEach(() => {
  navigateMock.mockClear();
});

describe('TailorCard identity', () => {
  test('shows the shop name as the primary title', () => {
    render(<TailorCard tailor={buildTailor({ shopName: 'My Shop' })} />);
    expect(screen.getByText('My Shop')).toBeInTheDocument();
  });

  test('falls back to the user name when shopName is empty', () => {
    render(
      <TailorCard
        tailor={buildTailor({
          shopName: '',
          user: { _id: 'u', name: 'Solo', email: 's@x.com', role: 'tailor', avatar: '', isVerified: true },
        })}
      />
    );
    expect(screen.getByText('Solo')).toBeInTheDocument();
  });

  test('falls back to "Tailor" when neither shop nor user name is present', () => {
    render(
      <TailorCard
        tailor={buildTailor({
          shopName: '',
          user: { _id: 'u', name: '', email: '', role: 'tailor', avatar: '', isVerified: true },
        })}
      />
    );
    expect(screen.getByText('Tailor')).toBeInTheDocument();
  });

  test('shows a "by <user name>" subtitle when both shop and user names exist', () => {
    render(<TailorCard tailor={buildTailor({ shopName: 'Shop', user: { _id: 'u', name: 'Priya', email: '', role: 'tailor', avatar: '', isVerified: true } })} />);
    expect(screen.getByText(/by priya/i)).toBeInTheDocument();
  });
});

describe('TailorCard availability and location', () => {
  test('shows the Available badge when isAvailable=true', () => {
    render(<TailorCard tailor={buildTailor({ isAvailable: true })} />);
    expect(screen.getByText(/available/i)).toBeInTheDocument();
  });

  test('hides the Available badge when isAvailable=false', () => {
    render(<TailorCard tailor={buildTailor({ isAvailable: false })} />);
    expect(screen.queryByText(/available/i)).not.toBeInTheDocument();
  });

  test('renders city + state when both present', () => {
    render(<TailorCard tailor={buildTailor({ location: { city: 'Mumbai', state: 'MH', pincode: '' } })} />);
    expect(screen.getByText('Mumbai, MH')).toBeInTheDocument();
  });

  test('renders city only when state is empty', () => {
    render(<TailorCard tailor={buildTailor({ location: { city: 'Delhi', state: '', pincode: '' } })} />);
    expect(screen.getByText('Delhi')).toBeInTheDocument();
  });

  test('hides location when city is empty', () => {
    const { container } = render(
      <TailorCard tailor={buildTailor({ location: { city: '', state: 'MH', pincode: '' } })} />
    );
    // No location text rendered
    expect(container.textContent).not.toContain('MH');
  });
});

describe('TailorCard services and pricing', () => {
  test('shows the minimum price across services', () => {
    render(
      <TailorCard
        tailor={buildTailor({
          services: [
            { _id: 'a', name: 'Cheap', category: 'X', price: 200, turnaroundDays: 3, description: '' },
            { _id: 'b', name: 'Mid', category: 'X', price: 500, turnaroundDays: 5, description: '' },
            { _id: 'c', name: 'Pricey', category: 'X', price: 5000, turnaroundDays: 14, description: '' },
          ],
        })}
      />
    );
    expect(screen.getByText(/from ₹200/i)).toBeInTheDocument();
  });

  test('shows "May vary" when at least one service has priceMayVary', () => {
    render(
      <TailorCard
        tailor={buildTailor({
          services: [
            { _id: 'a', name: 'A', category: 'X', price: 100, turnaroundDays: 1, description: '', priceMayVary: false },
            { _id: 'b', name: 'B', category: 'X', price: 200, turnaroundDays: 1, description: '', priceMayVary: true },
          ],
        })}
      />
    );
    expect(screen.getByText(/may vary/i)).toBeInTheDocument();
  });

  test('shows "No services" when the services list is empty', () => {
    render(<TailorCard tailor={buildTailor({ services: [] })} />);
    expect(screen.getByText(/no services/i)).toBeInTheDocument();
    expect(screen.queryByText(/from ₹/i)).not.toBeInTheDocument();
  });

  test('deduplicates service categories and caps display at 2', () => {
    render(
      <TailorCard
        tailor={buildTailor({
          services: [
            { _id: 'a', name: 'A', category: 'Women', price: 100, turnaroundDays: 1, description: '' },
            { _id: 'b', name: 'B', category: 'Women', price: 200, turnaroundDays: 1, description: '' },
            { _id: 'c', name: 'C', category: 'Men', price: 300, turnaroundDays: 1, description: '' },
            { _id: 'd', name: 'D', category: 'Kids', price: 400, turnaroundDays: 1, description: '' },
          ],
        })}
      />
    );
    expect(screen.getAllByText('Women')).toHaveLength(1);
    expect(screen.getByText('Men')).toBeInTheDocument();
    expect(screen.queryByText('Kids')).not.toBeInTheDocument();
  });
});

describe('TailorCard image fallback', () => {
  test('renders the shop image when shopPhotos has at least one', () => {
    render(<TailorCard tailor={buildTailor()} />);
    expect(screen.getByRole('img', { name: /shop/i })).toHaveAttribute(
      'src',
      'https://example.com/shop.jpg'
    );
  });

  test('falls back to icon when shopPhotos is empty', () => {
    render(<TailorCard tailor={buildTailor({ shopPhotos: [] })} />);
    expect(screen.queryByRole('img', { name: /shop/i })).not.toBeInTheDocument();
  });

  test('falls back to icon when the image fails to load', () => {
    render(<TailorCard tailor={buildTailor()} />);
    const img = screen.getByRole('img', { name: /shop/i });
    fireEvent.error(img);
    expect(screen.queryByRole('img', { name: /shop/i })).not.toBeInTheDocument();
  });
});

describe('TailorCard navigation', () => {
  test('navigates to the tailor detail page when the card is clicked', async () => {
    const user = userEvent.setup();
    render(<TailorCard tailor={buildTailor({ _id: 't-99' })} />);

    await user.click(screen.getByText('Priya Tailors'));

    expect(navigateMock).toHaveBeenCalledWith('/tailors/t-99');
  });

  test('Book Now triggers a single navigation (stops propagation to the card)', async () => {
    const user = userEvent.setup();
    render(<TailorCard tailor={buildTailor({ _id: 't-42' })} />);

    await user.click(screen.getByRole('button', { name: /book now/i }));

    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/tailors/t-42');
  });

  test('clicking a social link does not navigate the card', async () => {
    const user = userEvent.setup();
    render(<TailorCard tailor={buildTailor()} />);

    const instagram = screen.getByRole('link', { name: /instagram/i });
    await user.click(instagram);

    expect(navigateMock).not.toHaveBeenCalled();
  });
});
