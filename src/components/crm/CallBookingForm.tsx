// 07.09 Landing 3 — website call-booking form. DARK: not routed, and
// the booking_page_live flag ships off; publishing this page on
// integrityrealtystl.com is a Jen-gated act. The agenda gate lives in
// the booking path (crmCalls.submitBooking) — this form mirrors it so
// a visitor hears "we need your agenda" before anything is confirmed.
import { useState } from "react";

export interface BookingFormValues {
  topic: string;
  agenda: string;
  questions: string;
  requestedAt: string;
}

export function CallBookingForm({
  onSubmit,
}: {
  onSubmit: (values: BookingFormValues) => { status: string; reason?: string };
}) {
  const [values, setValues] = useState<BookingFormValues>({ topic: "", agenda: "", questions: "", requestedAt: "" });
  const [notice, setNotice] = useState<string | null>(null);

  const set = (key: keyof BookingFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const result = onSubmit(values);
        setNotice(
          result.status === "confirmed"
            ? "Your call is booked. We will call you at the time you picked."
            : "To book a call, tell us what it is about: a specific agenda and your questions. No agenda, no call — it keeps the call short and useful for you.",
        );
      }}
    >
      <label>
        What is the call about?
        <input value={values.topic} onChange={set("topic")} required />
      </label>
      <label>
        Your agenda for the call
        <textarea value={values.agenda} onChange={set("agenda")} required />
      </label>
      <label>
        Your questions, written out
        <textarea value={values.questions} onChange={set("questions")} required />
      </label>
      <label>
        Preferred time
        <input type="datetime-local" value={values.requestedAt} onChange={set("requestedAt")} required />
      </label>
      <button type="submit">Request my call</button>
      {notice ? <p role="status">{notice}</p> : null}
    </form>
  );
}
