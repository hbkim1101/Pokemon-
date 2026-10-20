/** Walk / move bob — same pixel grid as sprites. */
export function moveMods(t){
  return {
    dy: -Math.abs(Math.sin(t*12))*2.8,
    sx: 1+.01*Math.sin(t*12),
    sy: 1-.02*Math.sin(t*12),
    dx: 0,
    tilt: 0,
  };
}
