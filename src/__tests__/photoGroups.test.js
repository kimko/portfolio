import { describe, it, expect } from 'vitest';
import { groupPhotos, phaseOf } from '../components/photoGroups';

const photo = (alt, stage, day) => ({ alt, stage, day });
const labels = (groups) => groups.map((group) => [group.label, group.items.map(({ image }) => image.alt)]);

describe('grouping photos by phase', () => {
  it('groups neighbouring photos of the same stage under one label', () => {
    const groups = groupPhotos([photo('Render', 'plan'), photo('Model', 'plan'), photo('Glue-up', 'in-progress'), photo('Done', 'final')]);
    expect(labels(groups)).toEqual([
      ['Plan', ['Render', 'Model']],
      ['In progress', ['Glue-up']],
      ['Final', ['Done']],
    ]);
  });

  it('splits in-progress photos by day', () => {
    const groups = groupPhotos([photo('Render', 'plan'), photo('Glue-up', 'in-progress', 1), photo('Rails', 'in-progress', 2), photo('Reveal', 'in-progress', 2)]);
    expect(labels(groups)).toEqual([
      ['Plan', ['Render']],
      ['Day 1', ['Glue-up']],
      ['Day 2', ['Rails', 'Reveal']],
    ]);
  });

  it('keeps each photo position in the whole list, so links and arrow keys still line up', () => {
    const groups = groupPhotos([photo('Render', 'plan'), photo('Glue-up', 'in-progress'), photo('Done', 'final')]);
    expect(groups.map((group) => group.items.map(({ index }) => index))).toEqual([[0], [1], [2]]);
  });

  it('shows one unlabelled row for projects without stages, as before', () => {
    expect(labels(groupPhotos([photo('Bench'), photo('Joint')]))).toEqual([[null, ['Bench', 'Joint']]]);
  });

  it('shows one unlabelled row when every photo is in the same stage', () => {
    expect(labels(groupPhotos([photo('Table', 'final'), photo('Leg', 'final')]))).toEqual([[null, ['Table', 'Leg']]]);
  });
});

describe('naming the phase of one photo', () => {
  it('names the stage, and the day when there is one', () => {
    expect(phaseOf(photo('Render', 'plan'))).toBe('Plan');
    expect(phaseOf(photo('Rails', 'in-progress', 2))).toBe('In progress · Day 2');
    expect(phaseOf(photo('Bench'))).toBeNull();
  });
});
