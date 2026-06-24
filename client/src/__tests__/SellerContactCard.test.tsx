import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SellerContactCard from '../components/marketplace/SellerContactCard';

describe('SellerContactCard', () => {
  const origClipboard = (global as any).navigator.clipboard;

  beforeEach(() => {
    (global as any).navigator.clipboard = { writeText: jest.fn().mockResolvedValue(undefined) };
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    (global as any).navigator.clipboard = origClipboard;
    jest.resetAllMocks();
  });

  test('renders call and copy when phone is provided', () => {
    render(<SellerContactCard sellerPhone="+85512345678" />);
    expect(screen.getByRole('link', { name: /Call/i })).toHaveAttribute('href', 'tel:+85512345678');
    expect(screen.getByRole('button', { name: /Copy/i })).toBeInTheDocument();
  });

  test('copy button writes to clipboard and shows Copied state', async () => {
    render(<SellerContactCard sellerPhone="+85512345678" />);
    const copyBtn = screen.getByRole('button', { name: /Copy/i });
    fireEvent.click(copyBtn);
    expect((navigator as any).clipboard.writeText).toHaveBeenCalledWith('+85512345678');
    // text changes to Copied!
    expect(await screen.findByText(/Copied!/i)).toBeInTheDocument();
    // advance timeout to clear
    jest.advanceTimersByTime(2000);
  });

  test('renders email, whatsapp and telegram links when provided', () => {
    render(<SellerContactCard sellerPhone="+85512345678" sellerEmail="a@b.com" telegramHandle="@me" />);
    expect(screen.getByRole('link', { name: /Email/i })).toHaveAttribute('href', 'mailto:a@b.com');
    expect(screen.getByRole('link', { name: /WhatsApp/i })).toHaveAttribute('href', 'https://wa.me/85512345678');
    expect(screen.getByRole('link', { name: /Telegram/i })).toHaveAttribute('href', 'https://t.me/me');
  });

  test('does not render phone/email/whatsapp/telegram when missing', () => {
    render(<SellerContactCard />);
    // header should exist
    expect(screen.getByText(/Contact seller/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Call/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Copy/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Email/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /WhatsApp/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Telegram/i })).not.toBeInTheDocument();
  });
});
