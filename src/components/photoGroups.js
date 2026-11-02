const STAGE_LABELS = { plan: 'Plan', 'in-progress': 'In progress', final: 'Final' };

function groupLabel(image) {
  return image.day ? `Day ${image.day}` : STAGE_LABELS[image.stage];
}

export function phaseOf(image) {
  const stage = STAGE_LABELS[image.stage];
  if (!stage) return null;
  return image.day ? `${stage} · Day ${image.day}` : stage;
}

export function groupPhotos(images) {
  const groups = [];
  images.forEach((image, index) => {
    const label = groupLabel(image);
    const last = groups.at(-1);
    if (last && last.label === label) last.items.push({ image, index });
    else groups.push({ label, items: [{ image, index }] });
  });
  if (groups.length > 1) return groups;
  return [{ label: null, items: images.map((image, index) => ({ image, index })) }];
}
