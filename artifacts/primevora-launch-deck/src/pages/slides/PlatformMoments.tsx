export default function PlatformMoments() {
  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#0c0f1a] font-body text-white">
      <div className="pointer-events-none absolute inset-0 opacity-45" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)', backgroundSize: '4vw 4vw' }} />
      <div className="absolute left-[20vw] top-[10vh] h-[40vw] w-[40vw] rounded-full bg-[#7c6bf0]/[.06] blur-[12vw]" />
      <div className="absolute left-[5vw] top-[5vh] flex items-center gap-[1vw]"><div className="h-[2vw] w-[2vw] rounded-[.4vw] bg-[#4f7fff]" /><span className="text-[1.2vw] font-bold">primevora<span className="text-[#4f7fff]">.</span></span></div>
      <div className="absolute right-[5vw] top-[5vh] text-[1vw] text-white/45">03 / 06</div>
      <div className="relative z-10 mx-auto flex h-full w-[80vw] flex-col justify-center">
        <div className="max-w-[67vw]"><div className="mb-[2vh] w-fit rounded-[2vw] border border-[#7c6bf0]/40 bg-[#7c6bf0]/15 px-[1vw] py-[.55vh] text-[.9vw] font-semibold uppercase tracking-[.1em] text-[#a89cff]">Platform surface</div><h2 className="font-display text-[4vw] font-extrabold leading-[1.08] tracking-[-.05em]">One platform. The moments that matter.</h2></div>
        <div className="mt-[6vh] grid grid-cols-3 gap-[1.4vw]">
          <div className="col-span-2 rounded-[1vw] border border-white/10 bg-[#131726] p-[1.8vw]"><div className="flex items-center justify-between"><p className="text-[.85vw] uppercase tracking-[.12em] text-white/45">Primevora workspace</p><span className="rounded-full bg-[#4f7fff]/15 px-[.8vw] py-[.45vh] text-[.75vw] text-[#9db5ff]">TRC20</span></div><div className="mt-[3vh] grid grid-cols-2 gap-[1vw]"><div className="rounded-[.7vw] bg-[#4f7fff]/10 p-[1.1vw]"><p className="text-[.75vw] uppercase text-white/45">Balance</p><p className="mt-[1vh] font-mono text-[1.6vw]">$24,680.42</p></div><div className="rounded-[.7vw] bg-[#7c6bf0]/10 p-[1.1vw]"><p className="text-[.75vw] uppercase text-white/45">Rewards</p><p className="mt-[1vh] font-mono text-[1.6vw] text-[#b5acff]">+186.50</p></div></div><div className="mt-[2vh] flex items-center justify-between border-t border-white/[.07] pt-[1.5vh] text-[.85vw] text-white/55"><span>Deposit request</span><span className="text-[#85a1ff]">Pending review</span></div></div>
          <div className="rounded-[1vw] border border-[#7c6bf0]/35 bg-[#7c6bf0]/10 p-[1.8vw]"><p className="text-[.85vw] uppercase tracking-[.12em] text-[#b5acff]">Referral rewards</p><p className="mt-[2vh] font-display text-[3.5vw] font-extrabold tracking-[-.06em]">5%</p><p className="mt-[1vh] text-[.95vw] leading-[1.45] text-white/65">qualifying-action rate</p><div className="mt-[4vh] h-[.35vw] w-full rounded-full bg-white/10"><div className="h-full w-[64%] rounded-full bg-[#7c6bf0]" /></div><p className="mt-[1vh] text-[.78vw] text-white/40">One eligible reward per referred account</p></div>
        </div>
        <div className="mt-[4vh] grid grid-cols-2 gap-x-[3vw] gap-y-[1.4vh] text-[1.05vw] leading-[1.35] text-white/72">
          <div className="flex gap-[.9vw]"><span className="text-[#4f7fff]">01</span><span>Balance dashboard with available and pending funds</span></div>
          <div className="flex gap-[.9vw]"><span className="text-[#4f7fff]">02</span><span>Deposits and withdrawals on the TRC20 network</span></div>
          <div className="flex gap-[.9vw]"><span className="text-[#4f7fff]">03</span><span>Transaction history for deposits, withdrawals, rewards, and adjustments</span></div>
          <div className="flex gap-[.9vw]"><span className="text-[#4f7fff]">04</span><span>Copy trading presented as DEMO / SIMULATED performance</span></div>
        </div>
      </div>
      <div className="absolute bottom-[5vh] left-[5vw] text-[.9vw] tracking-[.05em] text-white/35">PRIMEVORA / PLATFORM SURFACE</div>
    </div>
  );
}