'use strict';
class MusicQueue {
  constructor(length) {
    if (!Number.isInteger(length) || length < 0) throw new RangeError('playlist length');
    this.length = length; this.index = length ? 0 : null; this.repeat = 'all'; this.shuffle = false;
    this.order = Array.from({length}, (_, i) => i); this.position = 0;
  }
  select(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.length) throw new RangeError('track index');
    this.index = index;
    this.setShuffle(this.shuffle);
    return index;
  }
  setShuffle(enabled) {
    this.shuffle = enabled;
    this.order = Array.from({length:this.length}, (_, i) => i);
    if (enabled && this.length) {
      const others = this.order.filter(i => i !== this.index);
      for (let i = others.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [others[i], others[j]] = [others[j], others[i]];
      }
      this.order = [this.index, ...others];
    }
    this.position = Math.max(0, this.order.indexOf(this.index));
  }
  next(automatic = false) {
    if (!this.length) return null;
    if (automatic && this.repeat === 'one') return this.index;
    if (this.position + 1 === this.length) {
      if (automatic && this.repeat === 'off') return null;
      if (this.shuffle && this.length > 1) { this.setShuffle(true); this.position = 1; }
      else this.position = 0;
    } else this.position++;
    return (this.index = this.order[this.position]);
  }
  previous() {
    if (!this.length) return null;
    this.position = (this.position + this.length - 1) % this.length;
    return (this.index = this.order[this.position]);
  }
}
