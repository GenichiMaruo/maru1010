/** 文字列から git の短縮ハッシュ風の 7 桁の16進数を作る（FNV-1a）。見た目用で、一意性は保証しない。 */
export function shortHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0").slice(0, 7);
}
