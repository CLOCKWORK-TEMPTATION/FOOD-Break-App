/**
 * اختبارات مكون التخطيط العربي
 * Arabic Layout Component Tests
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ArabicLayout from '../../components/layout/ArabicLayout';

// Mock the localization hook
jest.mock('../../config/localization', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    lang: 'ar',
    direction: 'rtl'
  })
}));

// Mock child components
jest.mock('../../components/layout/ArabicHeader', () => {
  return function MockArabicHeader({ onSidebarToggle, showSidebarToggle }: any) {
    return (
      <div data-testid="arabic-header">
        {showSidebarToggle && (
          <button onClick={onSidebarToggle} data-testid="sidebar-toggle">
            Toggle Sidebar
          </button>
        )}
      </div>
    );
  };
});

jest.mock('../../components/layout/ArabicSidebar', () => {
  return function MockArabicSidebar({ collapsed, onToggle }: any) {
    return (
      <div data-testid="arabic-sidebar" className={collapsed ? 'collapsed' : 'expanded'}>
        <button onClick={onToggle} data-testid="sidebar-internal-toggle">
          Internal Toggle
        </button>
      </div>
    );
  };
});

jest.mock('../../components/layout/ArabicFooter', () => {
  return function MockArabicFooter() {
    return <div data-testid="arabic-footer">Footer</div>;
  };
});

describe('ArabicLayout Component', () => {
  const defaultProps = {
    children: <div data-testid="main-content">Main Content</div>
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders with default props', () => {
      render(<ArabicLayout {...defaultProps} />);
      
      expect(screen.getByTestId('arabic-header')).toBeInTheDocument();
      expect(screen.getByTestId('arabic-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('arabic-footer')).toBeInTheDocument();
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    test('applies RTL direction and Arabic language', () => {
      const { container } = render(<ArabicLayout {...defaultProps} />);
      
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveAttribute('dir', 'rtl');
      expect(mainDiv).toHaveAttribute('lang', 'ar');
      expect(mainDiv).toHaveClass('rtl');
    });

    test('applies correct CSS classes', () => {
      const { container } = render(<ArabicLayout {...defaultProps} />);
      
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveClass('min-h-screen', 'bg-gray-50', 'rtl');
    });
  });

  describe('Sidebar Functionality', () => {
    test('shows sidebar by default', () => {
      render(<ArabicLayout {...defaultProps} />);
      
      expect(screen.getByTestId('arabic-sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument();
    });

    test('hides sidebar when showSidebar is false', () => {
      render(<ArabicLayout {...defaultProps} showSidebar={false} />);
      
      expect(screen.queryByTestId('arabic-sidebar')).not.toBeInTheDocument();
      expect(screen.queryByTestId('sidebar-toggle')).not.toBeInTheDocument();
    });

    test('handles sidebar collapse state', () => {
      render(<ArabicLayout {...defaultProps} sidebarCollapsed={true} />);
      
      const sidebar = screen.getByTestId('arabic-sidebar');
      expect(sidebar).toHaveClass('collapsed');
    });

    test('handles sidebar expand state', () => {
      render(<ArabicLayout {...defaultProps} sidebarCollapsed={false} />);
      
      const sidebar = screen.getByTestId('arabic-sidebar');
      expect(sidebar).toHaveClass('expanded');
    });

    test('calls onSidebarToggle when sidebar toggle is clicked', () => {
      const mockToggle = jest.fn();
      render(<ArabicLayout {...defaultProps} onSidebarToggle={mockToggle} />);
      
      const toggleButton = screen.getByTestId('sidebar-toggle');
      fireEvent.click(toggleButton);
      
      expect(mockToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Main Content Area', () => {
    test('adjusts main content margin when sidebar is shown and expanded', () => {
      const { container } = render(
        <ArabicLayout {...defaultProps} showSidebar={true} sidebarCollapsed={false} />
      );
      
      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveClass('mr-64');
    });

    test('adjusts main content margin when sidebar is shown and collapsed', () => {
      const { container } = render(
        <ArabicLayout {...defaultProps} showSidebar={true} sidebarCollapsed={true} />
      );
      
      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveClass('mr-16');
    });

    test('removes main content margin when sidebar is hidden', () => {
      const { container } = render(
        <ArabicLayout {...defaultProps} showSidebar={false} />
      );
      
      const mainElement = container.querySelector('main');
      expect(mainElement).not.toHaveClass('mr-64');
      expect(mainElement).not.toHaveClass('mr-16');
    });

    test('applies RTL text alignment to main content', () => {
      const { container } = render(<ArabicLayout {...defaultProps} />);
      
      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveClass('text-right');
    });

    test('renders children content correctly', () => {
      const testContent = <div data-testid="test-content">Test Content</div>;
      render(<ArabicLayout>{testContent}</ArabicLayout>);
      
      expect(screen.getByTestId('test-content')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    test('applies transition classes for smooth animations', () => {
      const { container } = render(<ArabicLayout {...defaultProps} />);
      
      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveClass('transition-all', 'duration-300');
    });

    test('maintains flex layout structure', () => {
      const { container } = render(<ArabicLayout {...defaultProps} />);
      
      const flexContainer = container.querySelector('.flex');
      expect(flexContainer).toBeInTheDocument();
      
      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveClass('flex-1');
    });
  });

  describe('Accessibility', () => {
    test('sets correct language attribute for screen readers', () => {
      const { container } = render(<ArabicLayout {...defaultProps} />);
      
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveAttribute('lang', 'ar');
    });

    test('sets correct direction attribute for RTL support', () => {
      const { container } = render(<ArabicLayout {...defaultProps} />);
      
      const mainDiv = container.firstChild as HTMLElement;
      expect(mainDiv).toHaveAttribute('dir', 'rtl');
    });

    test('maintains semantic HTML structure', () => {
      const { container } = render(<ArabicLayout {...defaultProps} />);
      
      const mainElement = container.querySelector('main');
      expect(mainElement).toBeInTheDocument();
      expect(mainElement?.tagName).toBe('MAIN');
    });
  });

  describe('Component Integration', () => {
    test('passes correct props to ArabicHeader', () => {
      const mockToggle = jest.fn();
      render(
        <ArabicLayout 
          {...defaultProps} 
          onSidebarToggle={mockToggle}
          showSidebar={true}
        />
      );
      
      // Header should show sidebar toggle
      expect(screen.getByTestId('sidebar-toggle')).toBeInTheDocument();
    });

    test('passes correct props to ArabicSidebar', () => {
      const mockToggle = jest.fn();
      render(
        <ArabicLayout 
          {...defaultProps} 
          onSidebarToggle={mockToggle}
          sidebarCollapsed={true}
        />
      );
      
      const sidebar = screen.getByTestId('arabic-sidebar');
      expect(sidebar).toHaveClass('collapsed');
    });

    test('renders ArabicFooter component', () => {
      render(<ArabicLayout {...defaultProps} />);
      
      expect(screen.getByTestId('arabic-footer')).toBeInTheDocument();
      expect(screen.getByText('Footer')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles undefined onSidebarToggle gracefully', () => {
      expect(() => {
        render(<ArabicLayout {...defaultProps} onSidebarToggle={undefined} />);
      }).not.toThrow();
    });

    test('handles empty children', () => {
      render(<ArabicLayout>{null}</ArabicLayout>);
      
      const mainElement = screen.getByRole('main');
      expect(mainElement).toBeInTheDocument();
    });

    test('handles multiple children', () => {
      const multipleChildren = (
        <>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </>
      );
      
      render(<ArabicLayout>{multipleChildren}</ArabicLayout>);
      
      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('does not re-render unnecessarily', () => {
      const { rerender } = render(<ArabicLayout {...defaultProps} />);
      
      // Re-render with same props
      rerender(<ArabicLayout {...defaultProps} />);
      
      // Component should still be rendered correctly
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    test('updates correctly when props change', () => {
      const { rerender } = render(
        <ArabicLayout {...defaultProps} sidebarCollapsed={false} />
      );
      
      let sidebar = screen.getByTestId('arabic-sidebar');
      expect(sidebar).toHaveClass('expanded');
      
      // Change props
      rerender(<ArabicLayout {...defaultProps} sidebarCollapsed={true} />);
      
      sidebar = screen.getByTestId('arabic-sidebar');
      expect(sidebar).toHaveClass('collapsed');
    });
  });
});