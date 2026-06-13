export function stepDeckIndex(currentIndex, direction, itemCount) {
  if (!itemCount) return 0;
  return (currentIndex + Math.sign(direction || 0) + itemCount) % itemCount;
}

export function deckPosition(index, activeIndex, itemCount) {
  if (!itemCount || index === activeIndex) return "active";
  const forward = (index - activeIndex + itemCount) % itemCount;
  const backward = (activeIndex - index + itemCount) % itemCount;
  if (backward === 1) return "previous";
  if (forward === 1) return "next";
  return backward < forward ? "far-previous" : "far-next";
}
