import { jest } from '@jest/globals';

const sendMailMock = jest.fn().mockResolvedValue({ messageId: 'fake-id' });

jest.unstable_mockModule('nodemailer', () => ({
  default: { createTransport: jest.fn(() => ({ sendMail: sendMailMock })) },
}));

const { sendOTPEmail } = await import('./sendEmail.js');

describe('sendOTPEmail', () => {
  beforeEach(() => {
    sendMailMock.mockClear();
  });

  test('sends an OTP email to the given recipient with the OTP in the body', async () => {
    await sendOTPEmail('user@example.com', '123456');

    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const arg = sendMailMock.mock.calls[0][0];
    expect(arg.from).toBe(process.env.EMAIL_FROM);
    expect(arg.to).toBe('user@example.com');
    expect(arg.subject).toMatch(/OTP/i);
    expect(arg.html).toContain('123456');
  });

  test('propagates errors from the mail transport', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('smtp down'));

    await expect(sendOTPEmail('user@example.com', '999999')).rejects.toThrow('smtp down');
  });
});
