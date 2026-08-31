import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IconLibrary, { IconLibraryProps } from '../IconLibrary';
import { MdiCategories } from '../../utils/mdiIcons';

describe('IconLibrary Component', () => {
  const MDI_OFFLINE_MOCK: MdiCategories = {
    general: [
      { name: 'star', set: 'mdi', path: 'M12 2L15 8L22 9L17 14L18 21L12 17L6 21L7 14L2 9L9 8L12 2Z' },
      { name: 'home', set: 'mdi', path: 'M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z' }
    ]
  };

  const defaultProps: IconLibraryProps = {
    iconSearch: '',
    setIconSearch: vi.fn(),
    selectedSet: 'all',
    setSelectedSet: vi.fn(),
    iconResults: [],
    isSearchingIcons: false,
    addIconElement: vi.fn(),
    handleSelectWebIcon: vi.fn(),
    collapsedIcons: false,
    setCollapsedIcons: vi.fn(),
    MDI_OFFLINE: MDI_OFFLINE_MOCK
  };

  it('renders section header and toggles collapse state', () => {
    const setCollapsedIcons = vi.fn();
    render(<IconLibrary {...defaultProps} setCollapsedIcons={setCollapsedIcons} />);

    const headerBtn = screen.getByRole('button', { name: /Icons Library/i });
    fireEvent.click(headerBtn);
    expect(setCollapsedIcons).toHaveBeenCalledWith(true);
  });

  it('renders default offline icons when search query is empty and handles selection', () => {
    const addIconElement = vi.fn();
    render(<IconLibrary {...defaultProps} iconSearch="" addIconElement={addIconElement} />);

    const starBtn = screen.getByTitle(/star/i);
    const homeBtn = screen.getByTitle(/home/i);

    expect(starBtn).toBeDefined();
    expect(homeBtn).toBeDefined();

    fireEvent.click(starBtn);
    expect(addIconElement).toHaveBeenCalledWith('star', MDI_OFFLINE_MOCK.general[0].path, 'mdi', '0 0 24 24');
  });

  it('updates search input value on typing', () => {
    const setIconSearch = vi.fn();
    render(<IconLibrary {...defaultProps} iconSearch="" setIconSearch={setIconSearch} />);

    const input = screen.getByPlaceholderText(/Search icons/i);
    fireEvent.change(input, { target: { value: 'heart' } });

    expect(setIconSearch).toHaveBeenCalledWith('heart');
  });

  it('renders search results (both offline and online) and triggers correct callbacks', () => {
    const addIconElement = vi.fn();
    const handleSelectWebIcon = vi.fn();

    const searchResults = [
      { name: 'star', set: 'mdi' as const, path: 'M12 2...', source: 'offline' as const },
      { name: 'heart', set: 'mdi' as const, source: 'online' as const }
    ];

    render(
      <IconLibrary
        {...defaultProps}
        iconSearch="star"
        iconResults={searchResults}
        addIconElement={addIconElement}
        handleSelectWebIcon={handleSelectWebIcon}
      />
    );

    const offlineItem = screen.getByTitle(/star/i);
    fireEvent.click(offlineItem);
    expect(addIconElement).toHaveBeenCalledWith('star', 'M12 2...', 'mdi', '0 0 24 24');

    const onlineItem = screen.getByTitle(/heart/i);
    fireEvent.click(onlineItem);
    expect(handleSelectWebIcon).toHaveBeenCalledWith('heart', 'mdi');
  });

  it('renders loading spinner when searching icons', () => {
    render(
      <IconLibrary
        {...defaultProps}
        iconSearch="searching"
        iconResults={[]}
        isSearchingIcons={true}
      />
    );

    const input = screen.getByPlaceholderText(/Search icons/i);
    expect(input).toBeDefined();
  });

  it('renders "No matching icons found" message when search yields no results', () => {
    render(
      <IconLibrary
        {...defaultProps}
        iconSearch="nonexistent123"
        iconResults={[]}
        isSearchingIcons={false}
      />
    );

    expect(screen.getByText('No matching icons found')).toBeDefined();
  });

  it('allows switching icon set filter tabs', () => {
    const setSelectedSet = vi.fn();
    render(<IconLibrary {...defaultProps} setSelectedSet={setSelectedSet} />);

    const lucideTab = screen.getByRole('button', { name: 'Lucide' });
    fireEvent.click(lucideTab);
    expect(setSelectedSet).toHaveBeenCalledWith('lucide');

    const faTab = screen.getByRole('button', { name: 'Font Awesome' });
    fireEvent.click(faTab);
    expect(setSelectedSet).toHaveBeenCalledWith('fa6-solid');
  });
});
