export default function CalmOperations() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0c0f1a] font-body text-white">
      <div className="pointer-events-none absolute inset-0 opacity-45" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)', backgroundSize: '4vw 4vw' }} />
      <div className="absolute -right-[10vw] -top-[20vh] h-[48vw] w-[48vw] rounded-full bg-[#4f7fff]/[.06] blur-[8vw]" />
      <div className="absolute left-[5vw] top-[5vh] flex items-center gap-[1vw]"><div className="h-[2vw] w-[2vw] rounded-[.4vw] bg-[#4f7fff]" /><span className="text-[1.2vw] font-bold">primevora<span className="text-[#4f7fff]">.</span></span></div>
      <div className="absolute right-[5vw] top-[5vh] text-[1vw] text-white/45">02 / 06</div>
      <div className="relative z-10 flex h-full w-[90vw] max-w-[80vw] items-center gap-[6vw] mx-auto">
        <div className="flex flex-1 flex-col gap-[3vh]">
          <div className="w-fit rounded-[2vw] border border-[#4f7fff]/40 bg-[#4f7fff]/15 px-[1vw] py-[.55vh] text-[.9vw] font-semibold uppercase tracking-[.1em] text-[#8eacff]">Product thesis</div>
          <h2 className="font-display text-[4vw] font-extrabold leading-[1.08] tracking-[-.05em]">Make digital asset operations feel calm</h2>
          <div className="mt-[1vh] flex flex-col gap-[1.8vh] text-[1.15vw] leading-[1.4] text-white/70">
            <div className="flex gap-[1vw]"><span className="mt-[.55vh] text-[#7c6bf0]">01</span><span>One clear home for USDT balances and activity</span></div>
            <div className="flex gap-[1vw]"><span className="mt-[.55vh] text-[#7c6bf0]">02</span><span>Transparent request states from deposit to withdrawal</span></div>
            <div className="flex gap-[1vw]"><span className="mt-[.55vh] text-[#7c6bf0]">03</span><span>Live crypto market context without unnecessary noise</span></div>
            <div className="flex gap-[1vw]"><span className="mt-[.55vh] text-[#7c6bf0]">04</span><span>Customer support that keeps the full conversation attached</span></div>
          </div>
        </div>
        <div className="relative flex-1">
          <div className="rounded-[1vw] border border-white/10 bg-[#131726] shadow-2xl">
            <div className="flex items-center gap-[.5vw] border-b border-white/[.06] px-[1.5vw] py-[1.3vw]"><span className="h-[.75vw] w-[.75vw] rounded-full bg-[#ff6b63]" /><span className="h-[.75vw] w-[.75vw] rounded-full bg-[#f5bd44]" /><span className="h-[.75vw] w-[.75vw] rounded-full bg-[#34d399]" /><span className="ml-auto text-[.8vw] text-white/35">portal / overview</span></div>
            <div className="p-[2vw]">
              <div className="flex items-end justify-between"><div><p className="text-[.9vw] text-white/45">Available balance</p><p className="mt-[.7vh] font-mono text-[2.5vw] tracking-[-.06em]">$24,680<span className="text-[1.3vw] text-white/45">.42</span></p></div><div className="rounded-[.6vw] bg-[#4f7fff] px-[.8vw] py-[.7vh] text-[.85vw] font-bold text-white">USDT</div></div>
              <div className="mt-[3vh] h-[17vh] rounded-[.7vw] border border-white/[.06] bg-white/[.02] p-[1vw]"><svg viewBox="0 0 500 130" className="h-full w-full"><path d="M0 105 C40 96 60 110 92 78 S140 88 170 69 S220 78 257 50 S300 65 334 45 S390 60 420 24 S465 37 500 8" fill="none" stroke="#4f7fff" strokeWidth="3" /><path d="M0 105 C40 96 60 110 92 78 S140 88 170 69 S220 78 257 50 S300 65 334 45 S390 60 420 24 S465 37 500 8 V130 H0Z" fill="#4f7fff" opacity=".14" /></svg></div>
              <div className="mt-[2vh] grid grid-cols-2 gap-[1vw]"><div className="rounded-[.7vw] border border-white/[.07] bg-white/[.03] p-[1vw]"><p className="text-[.75vw] uppercase tracking-[.1em] text-white/40">Pending</p><p className="mt-[.8vh] font-mono text-[1.15vw]">$1,240.00</p></div><div className="rounded-[.7vw] border border-[#7c6bf0]/30 bg-[#7c6bf0]/10 p-[1vw]"><p className="text-[.75vw] uppercase tracking-[.1em] text-white/40">Status</p><p className="mt-[.8vh] text-[1.15vw] font-semibold text-[#b5acff]">Clear</p></div></div>
            </div>
          </div>
          <div className="absolute -bottom-[3vh] -left-[2vw] rounded-[.8vw] border border-[#4f7fff]/30 bg-[#101626] px-[1.2vw] py-[1.2vh] text-[.9vw] text-white/75 shadow-xl"><span className="mr-[.5vw] text-[#4f7fff]">✓</span> One clear home for USDT</div>
        </div>
      </div>
      <div className="absolute bottom-[5vh] left-[5vw] text-[.9vw] tracking-[.05em] text-white/35">PRIMEVORA / PRODUCT THESIS</div>
    </div>
  );
}