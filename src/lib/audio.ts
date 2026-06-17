// Web Audio 封装 —— 提示音 + 环境音（白噪音/雨声近似）
// 全部程序生成，不引入音频文件。AudioContext 延迟到用户手势内首次创建。

export type AmbientMode = 'none' | 'white' | 'rain';

export class AudioKit {
  private ctx: AudioContext | null = null;
  private ambientNodes: { source: AudioNode; gain: GainNode } | null = null;

  /** 在用户手势（如点击开始）内调用，创建 AudioContext */
  ensureContext(): void {
    if (this.ctx) return;
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
  }

  /** 计时结束提示音：两个短促升调 */
  playChime(): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = now + i * 0.15;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.26);
    });
  }

  /** 切换环境音；none 时停止 */
  setAmbient(mode: AmbientMode): void {
    if (!this.ctx) return;
    this.stopAmbient();
    if (mode === 'none') return;

    const ctx = this.ctx;
    // 白噪音缓冲：2 秒随机数据
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = mode === 'rain' ? 0.12 : 0.06;

    // 雨声：白噪音过低通滤波 + 略高频段，近似雨的质感
    let node: AudioNode = source;
    if (mode === 'rain') {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1200;
      node.connect(filter);
      node = filter;
    }

    node.connect(gain).connect(ctx.destination);
    source.start();
    this.ambientNodes = { source, gain };
  }

  private stopAmbient(): void {
    if (!this.ambientNodes) return;
    try {
      (this.ambientNodes.source as AudioBufferSourceNode).stop();
    } catch (e) {}
    this.ambientNodes = null;
  }

  dispose(): void {
    this.stopAmbient();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
