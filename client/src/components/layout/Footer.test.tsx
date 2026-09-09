import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Footer from './Footer';

describe('Footer', () => {
  it('keeps SMS-CAM content without legacy marketplace contact or categories', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>
    );

    expect(screen.getByAltText('SMS-CAM')).toBeInTheDocument();
    expect(screen.getByText(/សេវាកម្មគ្រប់គ្រងសាលារៀន/)).toBeInTheDocument();
    expect(screen.getByText('អំពី SMS-CAM')).toBeInTheDocument();
    expect(screen.queryByText('support@konpuk.com')).not.toBeInTheDocument();
    expect(screen.queryByText('អេឡិចត្រូនិក')).not.toBeInTheDocument();
    expect(screen.queryByText('យានយន្ត')).not.toBeInTheDocument();
    expect(screen.queryByText('អចលនទ្រព្យ')).not.toBeInTheDocument();
    expect(screen.queryByText('ម៉ូត')).not.toBeInTheDocument();
  });
});