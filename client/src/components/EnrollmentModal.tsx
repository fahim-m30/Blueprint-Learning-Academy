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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4">
      <div className="relative bg-[#0f172a] border border-slate-700/80 rounded-2xl sm:rounded-3xl w-full max-w-xl max-h-[94vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-[#0b1222]/95 backdrop-blur-md border-b border-slate-800 p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-[11px] sm:text-xs font-bold text-sky-400 uppercase tracking-widest block mb-0.5">
              Course Enrollment • Step {step} of 3
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-white truncate">{course.title}</h3>
          </div>
          <button
            onClick={resetAndClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6">
          {errorMessage && (
            <div className="mb-4 sm:mb-5 p-3 sm:p-3.5 bg-red-950/70 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Student Information */}
          {step === 1 && (
            <form onSubmit={handleNextToPayment} className="space-y-3.5 sm:space-y-4">
              <div className="bg-gradient-to-r from-[#131f38] to-[#0d1628] border border-slate-700/80 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm shadow-md">
                <div>
                  <span className="text-[11px] sm:text-xs text-slate-400 font-medium">Payable Amount</span>
                  <p className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5">৳{course.price.toLocaleString()}</p>
                </div>
                <div className="text-right text-[11px] sm:text-xs text-slate-300">
                  <p>Duration: <span className="text-white font-bold">{course.durationDays} Days</span></p>
                  <p>Classes: <span className="text-white font-bold">{course.totalClasses} Classes</span></p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name (আপনার পূর্ণ নাম) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Engineer Rahim Chowdhury"
                  className="w-full bg-[#080d1a] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Mobile Number (মোবাইল নম্বর) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full bg-[#080d1a] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email (লগইন ইমেইল ঠিকানা) *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rahim@gmail.com"
                    className="w-full bg-[#080d1a] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Current City / Address (ঠিকানা বা শহর)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Dhanmondi, Dhaka"
                  className="w-full bg-[#080d1a] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 sm:py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition"
                >
                  Proceed to Payment Details <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Payment and Transaction Verification */}
          {step === 2 && (
            <form onSubmit={handleSubmitEnrollment} className="space-y-4">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Payment Method (পেমেন্ট মাধ্যম বেছে নিন):
                </label>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bKash')}
                    className={`p-3 rounded-xl border text-center transition ${
                      paymentMethod === 'bKash'
                        ? 'border-pink-500 bg-pink-950/30 text-white font-black'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block text-sm sm:text-base font-extrabold text-pink-400">bKash</span>
                    <span className="text-[10px] text-slate-400">Send Money</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Nagad')}
                    className={`p-3 rounded-xl border text-center transition ${
                      paymentMethod === 'Nagad'
                        ? 'border-orange-500 bg-orange-950/30 text-white font-black'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="block text-sm sm:text-base font-extrabold text-orange-400">Nagad</span>
                    <span className="text-[10px] text-slate-400">Send Money</span>
                  </button>
                </div>
              </div>

              {/* Number Card */}
              <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Send exact amount via {paymentMethod}:</span>
                    <span className="text-xl sm:text-2xl font-black text-amber-400">৳{course.price.toLocaleString()}</span>
                  </div>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 font-semibold">
                    {activeType}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-[#080d1a] border border-slate-700 rounded-xl p-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Official {paymentMethod} Number</span>
                    <span className="text-base sm:text-lg font-mono font-bold text-white tracking-wider">{activeNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeNumber, 'number')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    {copiedField === 'number' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'number' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Transaction Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your {paymentMethod} Sender Number (যে নম্বর থেকে টাকা পাঠিয়েছেন) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full bg-[#080d1a] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Transaction ID / TrxID (বিকাশ বা নগদ ট্রানজেকশন আইডি) *
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                    placeholder="e.g. BL9X4Q8M2Z"
                    className="w-full bg-[#080d1a] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-mono uppercase placeholder-slate-500 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reference / Notes (ঐচ্ছিক নোট)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reference note or questions"
                    className="w-full bg-[#080d1a] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-3 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" /> Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting Application...' : 'Confirm & Submit Application'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-400 text-emerald-400 flex items-center justify-center mx-auto text-2xl sm:text-3xl">
                <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-black text-white">Enrollment Application Received!</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-sm mx-auto leading-relaxed">
                  Thank you, <span className="text-amber-400 font-bold">{name}</span>. Your application and TrxID (<span className="font-mono text-sky-400">{transactionId}</span>) have been queued for administrative approval.
                </p>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-left text-xs text-slate-300 space-y-2">
                <p className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  What happens next?
                </p>
                <p>1. Our admin team will verify your {paymentMethod} transaction within 15–30 minutes.</p>
                <p>2. An auto-generated student login password will be emailed to <strong className="text-amber-400">{email}</strong>.</p>
                <p>3. You will gain immediate access to the course videos, resources, and live Google Meet batch link.</p>
              </div>

              <div className="pt-2 space-y-2.5">
                <a
                  href={`https://wa.me/${whatsappNumber}?text=Hello!%20I%20just%20submitted%20my%20enrollment%20for%20${encodeURIComponent(course.title)}.%20TrxID:%20${transactionId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" /> Notify Admin on WhatsApp for Quick Approval
                </a>
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition"
                >
                  Back to Website
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
