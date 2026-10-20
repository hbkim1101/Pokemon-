/** Shared render bridge. game.js calls bindRenderApi(...) once at boot. */
let api = null;
export function bindRenderApi(next){ api = next; }
export function R(){
  if(!api) throw new Error('render-api not bound');
  return api;
}
