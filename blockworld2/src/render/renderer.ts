import * as T from 'three';
export function createRenderer(canvas:HTMLCanvasElement) {
  const renderer = new T.WebGLRenderer({canvas, antialias:false, powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
  renderer.outputColorSpace=T.SRGBColorSpace;
  const scene=new T.Scene(); scene.background=new T.Color('#badbdc'); scene.fog=new T.Fog('#badbdc',70,155);
  scene.add(new T.HemisphereLight(0xfff5dc,0x668c70,2.2));
  const sun=new T.DirectionalLight(0xffe6b8,1.8); sun.position.set(-30,50,20); scene.add(sun);
  const camera=new T.PerspectiveCamera(67,1,0.06,180); camera.rotation.order='YXZ';
  function resize(){renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}
  resize(); addEventListener('resize',resize);
  return {renderer,scene,camera,dispose(){removeEventListener('resize',resize); renderer.dispose();}};
}
