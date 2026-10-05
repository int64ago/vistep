import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CpuGpuNpu from './CpuGpuNpu';

const film = vi.hoisted(() => ({ watch: true, playing: false, chapter: 0, chapterProgress: 0 }));
vi.mock('../lab/Showcase', () => ({ useShowcase: () => film }));
const trees: ReactTestRenderer[] = [];
afterEach(async () => {
  for (const tree of trees.splice(0)) await act(() => tree.unmount());
  vi.unstubAllGlobals();
  film.watch = true;
  film.chapter = 0;
  film.chapterProgress = 0;
});

describe('CPU/GPU/NPU presentation follows the model director', () => {
  it('keeps data identities visible during the GPU masked paths on direct seeks', () => {
    film.chapter = 3;
    film.chapterProgress = 0.5;
    const keep = renderToStaticMarkup(<CpuGpuNpu />);
    expect(keep.match(/data-masked="true"/g)).toHaveLength(1);
    expect(keep).toContain('Y13');
    expect(keep).toContain('sum ≥ 0 → Y = sum');
    film.chapterProgress = 0.9;
    const zero = renderToStaticMarkup(<CpuGpuNpu />);
    expect(zero.match(/data-masked="true"/g)).toHaveLength(3);
    expect(zero).toContain('sum &lt; 0 → Y = 0');
  });
  it('mounts every chapter without starting its own clocks, including final result proof', () => {
    for (let chapter = 0; chapter < 7; chapter++) {
      film.chapter = chapter;
      film.chapterProgress = 0.5;
      const markup = renderToStaticMarkup(<CpuGpuNpu />);
      expect(markup).not.toContain('cgn-explore');
      expect(markup).not.toContain('type="range"');
    }
    film.chapter = 6;
    const proof = renderToStaticMarkup(<CpuGpuNpu />);
    expect(proof.match(/class="cgn-matrix"/g)).toHaveLength(3);
    expect(proof).toContain('CPU Y = GPU Y = NPU Y');
  });
  it('changes actual shared input and resets progress before another scheduler uses it', async () => {
    film.watch = false;
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    let tree!: ReactTestRenderer;
    await act(() => {
      tree = create(<CpuGpuNpu />);
      trees.push(tree);
    });
    const button = (label: string) =>
      tree.root.findAllByType('button').find((b) => b.children.join('') === label)!;
    await act(() => button('全零输入').props.onClick());
    const range = () => tree.root.findByType('input');
    expect(range().props.value).toBe(0);
    await act(() => range().props.onChange({ target: { value: '11' } }));
    expect(
      tree.root.findByProps({ className: 'cgn-pe-receipt' }).findByType('span').children,
    ).toEqual(['max(0, 0) = 0']);
    await act(() => button('GPU').props.onClick());
    expect(range().props.value).toBe(0);
    expect(range().props.max).toBe(20); // No negative branch remains for all-zero data.
    await act(() => range().props.onChange({ target: { value: '20' } }));
    const output = tree.root.findAllByProps({ className: 'cgn-matrix' })[0];
    expect(output.findAllByType('span').every((cell) => cell.children.join('') === '0')).toBe(true);
  });
});
