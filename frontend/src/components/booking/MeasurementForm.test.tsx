import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import MeasurementForm from './MeasurementForm';
import type { GarmentType, MeasurementType } from '../../types';

const renderForm = (
  overrides: Partial<{
    garmentType: GarmentType;
    measurementType: MeasurementType;
    measurements: Record<string, string>;
  }> = {}
) => {
  const onTypeChange = vi.fn();
  const onMeasurementsChange = vi.fn();
  render(
    <MeasurementForm
      garmentType={overrides.garmentType ?? 'blouse'}
      measurementType={overrides.measurementType ?? 'custom'}
      measurements={overrides.measurements ?? {}}
      onTypeChange={onTypeChange}
      onMeasurementsChange={onMeasurementsChange}
    />
  );
  return { onTypeChange, onMeasurementsChange };
};

describe('MeasurementForm toggle', () => {
  test('renders both measurement-type options', () => {
    renderForm();

    expect(screen.getByRole('button', { name: /enter measurements/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send sample garment/i })).toBeInTheDocument();
  });

  test('clicking "Send Sample Garment" calls onTypeChange("send_sample")', async () => {
    const user = userEvent.setup();
    const { onTypeChange } = renderForm({ measurementType: 'custom' });

    await user.click(screen.getByRole('button', { name: /send sample garment/i }));

    expect(onTypeChange).toHaveBeenCalledWith('send_sample');
  });

  test('clicking the already-selected toggle does not fire onTypeChange', async () => {
    const user = userEvent.setup();
    const { onTypeChange } = renderForm({ measurementType: 'custom' });

    await user.click(screen.getByRole('button', { name: /enter measurements/i }));

    expect(onTypeChange).not.toHaveBeenCalled();
  });
});

describe('MeasurementForm conditional UI', () => {
  test('shows the send-sample info alert when measurementType is send_sample', () => {
    renderForm({ measurementType: 'send_sample' });
    expect(screen.getByText(/well-fitting garment/i)).toBeInTheDocument();
  });

  test('shows the alteration-specific alert when garment is "alteration"', () => {
    renderForm({ garmentType: 'alteration', measurementType: 'custom' });

    expect(screen.getByText(/describe the changes needed/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/bust/i)).not.toBeInTheDocument();
  });

  test('renders the configured fields for the selected garment (blouse)', () => {
    renderForm({ garmentType: 'blouse', measurementType: 'custom' });

    expect(screen.getByLabelText(/^bust/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^waist/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/blouse length/i)).toBeInTheDocument();
  });

  test('renders no fields when send_sample is selected', () => {
    renderForm({ garmentType: 'blouse', measurementType: 'send_sample' });

    expect(screen.queryByLabelText(/bust/i)).not.toBeInTheDocument();
  });
});

describe('MeasurementForm size chart', () => {
  test('size chart is hidden by default and toggle button says "View"', () => {
    renderForm({ garmentType: 'blouse' });

    expect(screen.getByRole('button', { name: /view size chart/i })).toBeInTheDocument();
    expect(screen.queryByText(/XS \(32\)/)).not.toBeVisible();
  });

  test('clicking the toggle reveals the chart and flips the button label', async () => {
    const user = userEvent.setup();
    renderForm({ garmentType: 'blouse' });

    await user.click(screen.getByRole('button', { name: /view size chart/i }));

    expect(screen.getByText(/XS \(32\)/)).toBeVisible();
    expect(screen.getByRole('button', { name: /hide size chart/i })).toBeInTheDocument();
  });

  test('shows the women\'s chart for women\'s garments', async () => {
    const user = userEvent.setup();
    renderForm({ garmentType: 'blouse' });

    await user.click(screen.getByRole('button', { name: /view size chart/i }));

    expect(screen.getByText('Bust')).toBeInTheDocument();
    expect(screen.queryByText('Chest')).not.toBeInTheDocument();
  });

  test('shows the men\'s chart for men\'s garments (kurta counts as mens)', async () => {
    const user = userEvent.setup();
    renderForm({ garmentType: 'kurta' });

    await user.click(screen.getByRole('button', { name: /view size chart/i }));

    expect(screen.getByText('Chest')).toBeInTheDocument();
    expect(screen.queryByText('Bust')).not.toBeInTheDocument();
  });
});

describe('MeasurementForm fields', () => {
  test('field values reflect props.measurements', () => {
    renderForm({
      garmentType: 'blouse',
      measurementType: 'custom',
      measurements: { bust: '36', waist: '28' },
    });

    expect(screen.getByLabelText(/^bust/i)).toHaveValue(36);
    expect(screen.getByLabelText(/^waist/i)).toHaveValue(28);
  });

  test('typing in a field calls onMeasurementsChange with merged measurements', async () => {
    const user = userEvent.setup();
    const { onMeasurementsChange } = renderForm({
      garmentType: 'blouse',
      measurementType: 'custom',
      measurements: { waist: '28' },
    });

    const bust = screen.getByLabelText(/^bust/i);
    await user.type(bust, '3');

    // userEvent.type fires onChange per keystroke; we just need the last call to merge
    const lastCall = onMeasurementsChange.mock.calls.at(-1)?.[0];
    expect(lastCall).toEqual({ waist: '28', bust: '3' });
  });
});
