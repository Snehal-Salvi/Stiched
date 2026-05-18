import { getErrorMessage } from './errorMessage';

describe('getErrorMessage', () => {
  test('returns the server message from an axios-shaped error', () => {
    const err = { response: { data: { message: 'Email already registered' } } };

    expect(getErrorMessage(err)).toBe('Email already registered');
  });

  test('falls back to the default message when response is missing', () => {
    expect(getErrorMessage(new Error('network down'))).toBe('Something went wrong');
  });

  test('falls back when response.data is missing', () => {
    expect(getErrorMessage({ response: {} })).toBe('Something went wrong');
  });

  test('falls back when response.data.message is missing', () => {
    expect(getErrorMessage({ response: { data: {} } })).toBe('Something went wrong');
  });

  test('falls back when the error is a non-object value', () => {
    expect(getErrorMessage(null)).toBe('Something went wrong');
  });
});
