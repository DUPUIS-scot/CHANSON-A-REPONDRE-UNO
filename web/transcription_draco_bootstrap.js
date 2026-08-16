import { GLTFLoader } from './vendor/GLTFLoader.js';
import { DRACOLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/DRACOLoader.js';

const TRANSCRIPTION_MODEL = 'transcription_jester.glb';
const DRACO_DECODER_PATH =
  'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/';
const PATCH_MARKER = Symbol.for('chanson.transcriptionDracoLoaderPatched');

// The intended transcription_jester.glb is a glTF-Transform asset that requires
// KHR_draco_mesh_compression. GLTFLoader does not decode that extension unless a
// DRACOLoader has been attached first. Patch only loads of this one model so the
// existing uncompressed Play/Search GLBs keep their current behavior.
if (!GLTFLoader.prototype[PATCH_MARKER]) {
  const originalLoad = GLTFLoader.prototype.load;

  GLTFLoader.prototype.load = function loadWithTranscriptionDraco(
    url,
    onLoad,
    onProgress,
    onError,
  ) {
    if (!String(url).includes(TRANSCRIPTION_MODEL)) {
      return originalLoad.call(this, url, onLoad, onProgress, onError);
    }

    const dracoLoader = new DRACOLoader(this.manager);
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
    dracoLoader.setWorkerLimit(2);
    this.setDRACOLoader(dracoLoader);

    const disposeDecoder = () => {
      queueMicrotask(() => dracoLoader.dispose());
    };

    return originalLoad.call(
      this,
      url,
      (gltf) => {
        disposeDecoder();
        onLoad?.(gltf);
      },
      onProgress,
      (error) => {
        disposeDecoder();
        onError?.(error);
      },
    );
  };

  Object.defineProperty(GLTFLoader.prototype, PATCH_MARKER, {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false,
  });
}
