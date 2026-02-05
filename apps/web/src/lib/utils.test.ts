import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('merges classnames', () => {
    expect(cn('a', false, 'b')).toContain('a');
    expect(cn('a', false, 'b')).toContain('b');
  });
});
