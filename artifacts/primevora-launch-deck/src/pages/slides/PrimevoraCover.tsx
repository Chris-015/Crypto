import logo from '@assets/file_00000000765c81f4ba4e2e70a545226c_1787979659841.png';

export default function PrimevoraCover() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0c0f1a] font-body text-white">
      <div className="pointer-events-none absolute inset-0 opacity-50" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)', backgroundSize: '4vw 4vw' }} />
      <div className="absolute -right-[12vw] -top-[18vh] h-[52vw] w-[52vw] rounded-full bg-[#4f7fff]/[.07] blur-[8vw]" />
      <div className="absolute -bottom-[32vh] -left-[15vw] h-[60vw] w-[60vw] rounded-full bg-[#7c6bf0]/[.06] blur-[10vw]" />
      <div className="absolute left-[5vw] top-[5vh] flex items-center gap-[1vw]">
        <img src={logo} crossOrigin="anonymous" alt="Primevora logo" className="h-[2.6vw] w-[2.6vw] rounded-[.5vw] object-cover" />
        <span className="text-[1.25vw] font-bold tracking-[-.03em]">primevora<span className="text-[#4f7fff]">.</span></span>
      </div>
      <div className="absolute right-[5vw] top-[5vh] text-[1vw] text-white/45">2026</div>
      <div className="relative z-10 flex h-full flex-col items-center justify-center pb-[4vh] text-center">
        <img src={logo} crossOrigin="anonymous" alt="Primevora" className="mb-[2.5vh] h-[5vw] w-[5vw] rounded-[1vw] object-cover shadow-[0_0_4vw_rgba(79,127,255,.22)]" />
        <div className="mb-[4vh] inline-flex items-center rounded-[2vw] border border-[#7c6bf0]/40 bg-[#7c6bf0]/15 px-[1.2vw] py-[.65vh] text-[1vw] font-medium tracking-[.05em] text-[#a89cff]">
          PRODUCT LAUNCH
        </div>
        <h1 className="font-display text-[7vw] font-extrabold leading-[1.02] tracking-[-.065em]">Primevora</h1>
        <p className="mt-[2.2vh] max-w-[58vw] text-[1.8vw] font-light leading-[1.45] text-white/70">A steadier way to hold value.</p>
        <p className="mt-[1.8vh] max-w-[55vw] text-[1.15vw] leading-[1.5] text-white/48">Premium USDT operations for users who want clarity, control, and confidence.</p>
        <div className="mt-[6vh] flex items-center gap-[1.2vw]">
          <div className="flex items-center gap-[.6vw] rounded-[.5vw] border border-white/10 bg-white/[.05] px-[1.5vw] py-[1vh] text-[1vw] text-white/78"><span className="h-[.55vw] w-[.55vw] rounded-full bg-[#4f7fff]" /> USDT operations</div>
          <div className="flex items-center gap-[.6vw] rounded-[.5vw] border border-white/10 bg-white/[.05] px-[1.5vw] py-[1vh] text-[1vw] text-white/78"><span className="h-[.55vw] w-[.55vw] rounded-full bg-[#7c6bf0]" /> Clear status</div>
          <div className="flex items-center gap-[.6vw] rounded-[.5vw] border border-white/10 bg-white/[.05] px-[1.5vw] py-[1vh] text-[1vw] text-white/78"><span className="h-[.55vw] w-[.55vw] rounded-full bg-[#4f7fff]" /> Built for trust</div>
        </div>
      </div>
      <div className="absolute bottom-[9vh] right-[-4vw] h-[15vh] w-[25vw] rotate-[-5deg] rounded-[1vw] border border-white/10 bg-[#131726] p-[2vw] opacity-85 shadow-2xl">
        <div className="flex items-center gap-[1vw]"><img src={logo} crossOrigin="anonymous" alt="" className="h-[2vw] w-[2vw] rounded-full object-cover" /><div className="h-[.8vw] w-[10vw] rounded-[.2vw] bg-white/10" /></div>
        <div className="mt-[1.4vh] h-[.8vw] w-[15vw] rounded-[.2vw] bg-white/[.06]" />
        <div className="mt-[1vh] h-[.8vw] w-[12vw] rounded-[.2vw] bg-white/[.06]" />
      </div>
      <div className="absolute bottom-[5vh] left-[5vw] text-[.9vw] tracking-[.05em] text-white/35">PRIMEVORA DIGITAL ASSET PLATFORM</div>
      <div className="absolute bottom-[5vh] right-[5vw] text-[.9vw] text-white/35">01 / 06</div>
    </div>
  );
}