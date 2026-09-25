import { Phone } from "lucide-react";

export default function Helpline() {
  return <a href="tel:+919840819991" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-800">
    <Phone size={18} aria-hidden="true" />
    <span>Helpline: 9840819991</span>
  </a>;
}
