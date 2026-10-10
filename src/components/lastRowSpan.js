export function lastRowSpan(index, count, columns) {
  if (index !== count - 1) return 1;
  return columns - ((count - 1) % columns);
}
