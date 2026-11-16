export function itemPose(index: number, x: number, y: number, baseSize: number, sceneWidth: number, sceneHeight: number) {
  const size = baseSize + (((index * 7) % 9) - 4) * 3;
  const angle = (((index * 5) % 11) - 5) * 5;
  const radians = angle * Math.PI / 180;
  const margin = Math.ceil((Math.abs(Math.cos(radians)) + Math.abs(Math.sin(radians)) - 1) * size / 2);
  return {
    x: Math.max(margin, Math.min(x, sceneWidth - size - margin)),
    y: Math.max(margin, Math.min(y, sceneHeight - size - margin)),
    width: size,
    height: size,
    angle,
  };
}
