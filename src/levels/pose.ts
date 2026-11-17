export function itemPose(index: number, x: number, y: number, baseSize: number, sceneWidth: number, sceneHeight: number) {
  const size = baseSize + (((index * 17) % 13) - 6) * 4;
  const angle = (((index * 11) % 15) - 7) * 5;
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

export function scatter(index: number, x: number, y: number, spreadX: number, spreadY: number) {
  const random = (salt: number) => {
    let value = Math.imul(index + 1 + salt, 0x9e3779b1);
    value ^= value >>> 16;
    value = Math.imul(value, 0x85ebca6b);
    return ((value ^ (value >>> 13)) >>> 0) / 0xffffffff;
  };
  return {
    x: x + Math.round((random(17) - .5) * spreadX),
    y: y + Math.round((random(41) - .5) * spreadY),
  };
}
