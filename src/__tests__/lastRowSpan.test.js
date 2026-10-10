import { describe, it, expect } from 'vitest';
import { lastRowSpan } from '../components/lastRowSpan';

describe('lastRowSpan', () => {
  it('keeps every card except the last at one column', () => {
    expect(lastRowSpan(0, 5, 3)).toBe(1);
    expect(lastRowSpan(3, 5, 3)).toBe(1);
  });

  it('stretches the last card across the empty columns of a partly filled row', () => {
    expect(lastRowSpan(4, 5, 3)).toBe(2);
    expect(lastRowSpan(4, 5, 2)).toBe(2);
    expect(lastRowSpan(3, 4, 3)).toBe(3);
  });

  it('leaves the last card alone when the final row is already full', () => {
    expect(lastRowSpan(5, 6, 3)).toBe(1);
    expect(lastRowSpan(5, 6, 2)).toBe(1);
  });
});
