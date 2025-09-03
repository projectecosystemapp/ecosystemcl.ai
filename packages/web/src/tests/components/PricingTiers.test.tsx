import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PricingTiers from '@/components/PricingTiers';

describe('PricingTiers Component', () => {
  it('renders all three pricing tiers', () => {
    render(<PricingTiers />);
    
    expect(screen.getByText('Standard')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByText('Enterprise')).toBeInTheDocument();
  });

  it('displays correct pricing for each tier', () => {
    render(<PricingTiers />);
    
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('$40')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('shows RECOMMENDED badge on Premium tier', () => {
    render(<PricingTiers />);
    
    expect(screen.getByText('RECOMMENDED')).toBeInTheDocument();
  });

  it('displays correct features for Standard tier', () => {
    render(<PricingTiers />);
    
    expect(screen.getByText(/Unlimited BYOK/)).toBeInTheDocument();
    expect(screen.getByText(/500K monthly ECOSYSTEMCL.AI Credits/)).toBeInTheDocument();
    expect(screen.getByText(/Access to open-source models/)).toBeInTheDocument();
  });

  it('displays correct features for Premium tier', () => {
    render(<PricingTiers />);
    
    expect(screen.getByText(/10M monthly ECOSYSTEMCL.AI Credits/)).toBeInTheDocument();
    expect(screen.getByText(/Codebase embeddings/)).toBeInTheDocument();
    expect(screen.getByText(/Deep analysis agents/)).toBeInTheDocument();
    expect(screen.getByText(/Human-in-the-loop approvals/)).toBeInTheDocument();
  });

  it('shows limitations for Standard tier', () => {
    render(<PricingTiers />);
    
    expect(screen.getByText(/Sequential step execution only/)).toBeInTheDocument();
    expect(screen.getByText(/No codebase embeddings/)).toBeInTheDocument();
  });

  it('renders CTA buttons with correct text', () => {
    render(<PricingTiers />);
    
    expect(screen.getByText('Start Free')).toBeInTheDocument();
    expect(screen.getByText('Start Premium Trial')).toBeInTheDocument();
    expect(screen.getByText('Contact Sales')).toBeInTheDocument();
  });

  it('displays ECOSYSTEMCL.AI Credits explanation section', () => {
    render(<PricingTiers />);
    
    expect(screen.getByText('What are ECOSYSTEMCL.AI Credits?')).toBeInTheDocument();
    expect(screen.getByText(/1 credit ≈ 1 token/)).toBeInTheDocument();
    expect(screen.getByText('Standard Models')).toBeInTheDocument();
    expect(screen.getByText('BYOK Support')).toBeInTheDocument();
    expect(screen.getByText('Premium Agents')).toBeInTheDocument();
  });
});
