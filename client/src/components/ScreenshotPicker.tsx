import { ImagePlus, X } from 'lucide-react';
import { useRef, useState, type ChangeEvent } from 'react';
import { api } from '../api';
import type { Screenshot } from '../types';

export function ScreenshotPicker({ images, onChange, onBusy }: { images: Screenshot[]; onChange: (images: Screenshot[]) => void; onBusy: (busy: boolean) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    setError(''); onBusy(true);
    try { const uploaded = await Promise.all(files.slice(0, Math.max(0, 6 - images.length)).map((file) => api.upload(file))); onChange([...images, ...uploaded]); }
    catch (cause) { setError((cause as Error).message); }
    finally { onBusy(false); }
  }
  async function remove(image: Screenshot) {
    setError(''); onBusy(true);
    try { await api.deleteUpload(image.id); onChange(images.filter((item) => item.id !== image.id)); }
    catch (cause) { setError((cause as Error).message); }
    finally { onBusy(false); }
  }
  return <div><input ref={input} className='visually-hidden' type='file' accept='image/*' multiple onChange={(event) => void upload(event)} />
    <button type='button' className='upload-zone' disabled={images.length >= 6} onClick={() => input.current?.click()}><ImagePlus size={25} /><strong>Add screenshots</strong><span>PNG, JPG, or WebP. Up to 6 images.</span></button>
    {error && <p className='small-error' role='alert'>{error}</p>}
    {images.length > 0 && <div className='upload-previews'>{images.map((image) => <div key={image.id}><img src={image.url} alt='Project screenshot preview' /><span>Screenshot</span><button type='button' aria-label='Remove screenshot' onClick={() => void remove(image)}><X size={15} /></button></div>)}</div>}
  </div>;
}
