import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#f5f8fb] px-5 text-[#15233b]">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e7f8f0] text-[#148c68]">
          <Compass className="h-7 w-7" />
        </div>
        <p className="mt-7 font-mono text-xs font-bold uppercase tracking-[.18em] text-[#19a77e]">PV / 404</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-[-.06em]">This room is empty.</h1>
        <p className="mt-4 text-sm leading-6 text-[#718097]">That address does not point to a Primevora view. Let’s get you back to solid ground.</p>
        <Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#17253d] px-4 py-3 text-sm font-bold text-white hover:-translate-y-0.5" data-testid="link-not-found-home">
          <ArrowLeft className="h-4 w-4" /> Back to Primevora
        </Link>
      </div>
    </div>
  );
}
