// ApprovalBadge Component Tests - Social Content Agent
// Story 4.6: Quality Gate e Threshold

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  ApprovalBadge,
  ApprovalIndicator,
  ScoreBadge,
  PostApprovalStatus,
} from '../components/posts/ApprovalBadge';

describe('ApprovalBadge', () => {
  describe('Status rendering', () => {
    it('should render approved status with correct label', () => {
      render(<ApprovalBadge status={PostApprovalStatus.APPROVED} />);

      expect(screen.getByText('Aprovado')).toBeInTheDocument();
    });

    it('should render needs_review status with correct label', () => {
      render(<ApprovalBadge status={PostApprovalStatus.NEEDS_REVIEW} />);

      expect(screen.getByText('Revisao Necessaria')).toBeInTheDocument();
    });

    it('should render pending status with correct label', () => {
      render(<ApprovalBadge status={PostApprovalStatus.PENDING} />);

      expect(screen.getByText('Pendente')).toBeInTheDocument();
    });

    it('should render rejected status with correct label', () => {
      render(<ApprovalBadge status={PostApprovalStatus.REJECTED} />);

      expect(screen.getByText('Rejeitado')).toBeInTheDocument();
    });
  });

  describe('Color styling', () => {
    it('should render approved status with green styling', () => {
      render(<ApprovalBadge status={PostApprovalStatus.APPROVED} />);

      const badge = screen.getByText('Aprovado').parentElement;
      expect(badge).toHaveClass('text-green-400');
    });

    it('should render needs_review status with yellow styling', () => {
      render(<ApprovalBadge status={PostApprovalStatus.NEEDS_REVIEW} />);

      const badge = screen.getByText('Revisao Necessaria').parentElement;
      expect(badge).toHaveClass('text-yellow-400');
    });

    it('should render pending status with gray styling', () => {
      render(<ApprovalBadge status={PostApprovalStatus.PENDING} />);

      const badge = screen.getByText('Pendente').parentElement;
      expect(badge).toHaveClass('text-gray-400');
    });

    it('should render rejected status with red styling', () => {
      render(<ApprovalBadge status={PostApprovalStatus.REJECTED} />);

      const badge = screen.getByText('Rejeitado').parentElement;
      expect(badge).toHaveClass('text-red-400');
    });
  });

  describe('Score display', () => {
    it('should display score when showScore is true', () => {
      render(
        <ApprovalBadge
          status={PostApprovalStatus.APPROVED}
          score={7.5}
          showScore
        />
      );

      expect(screen.getByText('7.5')).toBeInTheDocument();
      // The badge text should be the score, not "Aprovado"
      const badge = screen.getByText('7.5').closest('div');
      expect(badge).not.toHaveTextContent(/^Aprovado$/);
    });

    it('should display label instead of score when showScore is false', () => {
      render(
        <ApprovalBadge
          status={PostApprovalStatus.APPROVED}
          score={7.5}
          showScore={false}
        />
      );

      // Should find label in the badge (not tooltip)
      const labels = screen.getAllByText('Aprovado');
      expect(labels.length).toBeGreaterThan(0);
      expect(screen.queryByText('7.5')).not.toBeInTheDocument();
    });

    it('should format score with one decimal place', () => {
      render(
        <ApprovalBadge
          status={PostApprovalStatus.APPROVED}
          score={7}
          showScore
        />
      );

      expect(screen.getByText('7.0')).toBeInTheDocument();
    });
  });

  describe('Tooltip', () => {
    it('should show tooltip container when score is provided', () => {
      const { container } = render(
        <ApprovalBadge
          status={PostApprovalStatus.APPROVED}
          score={7.5}
          threshold={6.0}
        />
      );

      // Look for tooltip wrapper with group class
      expect(container.querySelector('.group')).toBeInTheDocument();

      // Should contain score and threshold info in tooltip
      expect(screen.getByText(/7\.5\/10/)).toBeInTheDocument();
      expect(screen.getByText(/6\.0/)).toBeInTheDocument();
    });

    it('should not show tooltip when score is not provided', () => {
      const { container } = render(
        <ApprovalBadge status={PostApprovalStatus.APPROVED} />
      );

      // Should not have tooltip wrapper
      expect(container.querySelector('.group')).not.toBeInTheDocument();
    });
  });

  describe('Size variants', () => {
    it('should render small size correctly', () => {
      render(
        <ApprovalBadge status={PostApprovalStatus.APPROVED} size="sm" />
      );

      const badge = screen.getByText('Aprovado').parentElement;
      expect(badge).toHaveClass('text-xs');
    });

    it('should render medium size correctly (default)', () => {
      render(<ApprovalBadge status={PostApprovalStatus.APPROVED} />);

      const badge = screen.getByText('Aprovado').parentElement;
      expect(badge).toHaveClass('text-sm');
    });

    it('should render large size correctly', () => {
      render(
        <ApprovalBadge status={PostApprovalStatus.APPROVED} size="lg" />
      );

      const badge = screen.getByText('Aprovado').parentElement;
      expect(badge).toHaveClass('text-base');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(
        <ApprovalBadge
          status={PostApprovalStatus.APPROVED}
          className="custom-class"
        />
      );

      const badge = screen.getByText('Aprovado').parentElement;
      expect(badge).toHaveClass('custom-class');
    });
  });
});

describe('ApprovalIndicator', () => {
  it('should render icon-only indicator', () => {
    const { container } = render(
      <ApprovalIndicator status={PostApprovalStatus.APPROVED} />
    );

    // Should only render icon, not text
    expect(screen.queryByText('Aprovado')).not.toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('should have title attribute for accessibility', () => {
    render(<ApprovalIndicator status={PostApprovalStatus.APPROVED} />);

    expect(screen.getByTitle('Aprovado')).toBeInTheDocument();
  });

  it('should apply correct color class', () => {
    const { container } = render(
      <ApprovalIndicator status={PostApprovalStatus.APPROVED} />
    );

    const indicator = container.querySelector('span');
    expect(indicator).toHaveClass('text-green-400');
  });
});

describe('ScoreBadge', () => {
  it('should render score with approved styling when score >= threshold', () => {
    render(<ScoreBadge score={7.5} threshold={6.0} />);

    expect(screen.getByText('7.5')).toBeInTheDocument();
    const badge = screen.getByText('7.5').parentElement;
    expect(badge).toHaveClass('text-green-400');
  });

  it('should render score with needs_review styling when score < threshold', () => {
    render(<ScoreBadge score={5.5} threshold={6.0} />);

    expect(screen.getByText('5.5')).toBeInTheDocument();
    const badge = screen.getByText('5.5').parentElement;
    expect(badge).toHaveClass('text-yellow-400');
  });

  it('should use default threshold of 6.0', () => {
    render(<ScoreBadge score={6.0} />);

    // Badge shows score as text, tooltip also has threshold
    const scoreElements = screen.getAllByText('6.0');
    expect(scoreElements.length).toBeGreaterThanOrEqual(1);

    // The badge itself should have green styling for score=threshold
    const badge = scoreElements[0]?.closest('div[class*="rounded-full"]');
    expect(badge).toHaveClass('text-green-400');
  });

  it('should respect size prop', () => {
    render(<ScoreBadge score={7.5} size="lg" />);

    const badge = screen.getByText('7.5').parentElement;
    expect(badge).toHaveClass('text-base');
  });
});
