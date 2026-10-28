'use client';

import React, { useState } from 'react';
import { Course, SiteSettings } from '@/lib/types';
import { apiRequest } from '@/lib/api';
import { X, Copy, Check, ArrowRight, ArrowLeft, ShieldAlert, CheckCircle, MessageCircle } from 'lucide-react';

interface EnrollmentModalProps {
  course: Course | null;
  settings?: SiteSettings | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function EnrollmentModal({ course, settings, isOpen, onClose }: EnrollmentModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !course) return null;

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleNextToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !email.trim()) {
      setErrorMessage('Please fill in your name, mobile number, and email.');
      return;
    }
    setErrorMessage('');
    setStep(2);
  };

  const handleSubmitEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderNumber.trim() || !transactionId.trim()) {
      setErrorMessage('Please enter both your sender number and Transaction ID (TrxID).');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    const res = await apiRequest('/public/enroll', {
      method: 'POST',
      body: JSON.stringify({
        studentName: name,
        studentEmail: email,
        studentPhone: phone,
        studentAddress: address,
        courseId: course._id,
        paymentMethod,
        senderNumber,
        transactionId,
        notes,
      }),
    });

    setSubmitting(false);

    if (res.success) {
      setStep(3);
    } else {
      setErrorMessage(res.message || 'Submission failed. Please check information or contact WhatsApp.');
    }
  };

  const resetAndClose = () => {
    setStep(1);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setSenderNumber('');
    setTransactionId('');
    setNotes('');
    setErrorMessage('');
    onClose();
  };

  const activeNumber =
    paymentMethod === 'bKash'
      ? settings?.bkashNumber || '01313893838'
      : paymentMethod === 'Nagad'
      ? settings?.nagadNumber || '01313893838'
      : settings?.rocketNumber || '01313893838-5';

  const activeType =
    paymentMethod === 'bKash'
      ? settings?.bkashType || 'Personal (Send Money)'
      : paymentMethod === 'Nagad'
      ? settings?.nagadType || 'Personal (Send Money)'
      : 'Personal';

  const whatsappNumber = settings?.whatsappNumber || '8801313893838';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative bg-[#0f172a] border border-slate-700/80 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-[#0b1222] border-b border-slate-800 p-5 sm:p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-sky-400 uppercase tracking-widest block mb-1">
              Course Enrollment • Step {step} of 3
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-white truncate max-w-sm sm:max-w-md">{course.title}</h3>
          </div>
          <button
            onClick={resetAndClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-5 p-3.5 bg-red-950/70 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Student Information */}
          {step === 1 && (
            <form onSubmit={handleNextToPayment} className="space-y-4">
              <div className="bg-gradient-to-r from-[#131f38] to-[#0d1628] border border-slate-700/80 p-4 rounded-2xl flex items-center justify-between text-sm shadow-md">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Payable Amount</span>
                  <p className="text-2xl font-black text-amber-400 mt-0.5">৳{course.price.toLocaleString()}</p>
                </div>
                <div className="text-right text-xs text-slate-300">
                  <p>Duration: <span className="text-white font-bold">{course.durationDays} Days</span></p>
                  <p>Classes: <span className="text-white font-bold">{course.totalClasses} Master Classes</span></p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name (আপনার পূর্ণ নাম) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Engr. Tanvir Ahmed"
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Mobile Number (মোবাইল নম্বর) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-slate-900 border border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address (ইমেইল ঠিকানা) *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full bg-slate-900 border border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                  <span className="text-[10px] text-sky-400 mt-1 block">
                    * Your login credentials will be emailed to this address.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Present Address / University (বর্তমান ঠিকানা বা বিশ্ববিদ্যালয়)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Dhaka, Bangladesh"
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-7 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition"
                >
                  Proceed to Payment <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Payment & Transaction ID Entry */}
          {step === 2 && (
            <form onSubmit={handleSubmitEnrollment} className="space-y-4">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Payment Method (পেমেন্ট মাধ্যম বেছে নিন):
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(['bKash', 'Nagad', 'Rocket'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        paymentMethod === m
                          ? m === 'bKash'
                            ? 'border-pink-500 bg-pink-500/20 text-pink-300 shadow-md'
                            : 'border-orange-500 bg-orange-500/20 text-orange-300 shadow-md'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {m === 'bKash' ? '📱 bKash' : m === 'Nagad' ? '💳 Nagad' : '🚀 Rocket'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number and Amount display card */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4.5 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Account Type</span>
                  <span className="text-xs font-bold text-white bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
                    {paymentMethod} {activeType}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Send Money to this number:</span>
                    <span className="text-lg font-mono font-black text-amber-400 tracking-wider">{activeNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeNumber, 'num')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white transition"
                  >
                    {copiedField === 'num' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'num' ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Exact Amount to Send:</span>
                    <span className="text-xl font-black text-white">৳{course.price.toLocaleString()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(course.price), 'amt')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-white transition"
                  >
                    {copiedField === 'amt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'amt' ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <p className="text-[11px] text-sky-400 leading-relaxed font-medium">
                  ℹ️ বিকাশ/নগদে <strong>Send Money</strong> অপশন ব্যবহার করুন। রেফারেন্সে আপনার নাম লিখুন এবং সফল পেমেন্টের পর প্রাপ্ত Transaction ID নিচে প্রদান করুন।
                </p>
              </div>

              {/* Payment Proof Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Your {paymentMethod} Number (যে নম্বর থেকে টাকা পাঠিয়েছেন) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-slate-900 border border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Transaction ID / TrxID (ট্রানজেকশন আইডি) *
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                    placeholder="e.g. 9K4A7B2C1D"
                    className="w-full bg-slate-900 border border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-4 py-2.5 text-sm text-white font-mono uppercase tracking-wider placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Additional Note (ঐচ্ছিক মন্তব্য)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional reference note"
                  className="w-full bg-slate-900 border border-slate-700/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <div className="pt-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-7 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Enrollment & TrxID'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Submission Success */}
          {step === 3 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white">Enrollment Submitted!</h3>
                <p className="text-sm text-slate-300 mt-1">
                  Thank you, <strong className="text-white">{name}</strong>. We have received your payment proof for <strong>{course.title}</strong>.
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4.5 text-left text-xs space-y-2.5 text-slate-300 shadow-md">
                <p className="text-amber-400 font-bold text-sm">What happens next?</p>
                <p>1. Our admin will match and verify your Transaction ID (<strong className="font-mono text-white">{transactionId}</strong>).</p>
                <p>2. Upon approval, the system will automatically generate your student credentials and email them to <strong className="text-white">{email}</strong>.</p>
                <p>3. You can then login directly at <span className="text-sky-400 font-bold">/login</span> to access all lectures, live class links, tasks, and WhatsApp batch group.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                    `Hello, I just submitted enrollment for "${course.title}". My TrxID: ${transactionId}, Mobile: ${phone}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/20"
                >
                  <MessageCircle className="w-4 h-4" /> Message on WhatsApp
                </a>
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition"
                >
                  Close Window
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
