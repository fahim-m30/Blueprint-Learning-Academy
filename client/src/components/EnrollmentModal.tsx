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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-[#101c2e] border-2 border-[#2e4666] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-[#0b1624] border-b border-[#2e4666] p-5 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-[#7fb8ea] uppercase tracking-wider">
              Course Enrollment • Step {step} of 3
            </span>
            <h3 className="text-lg font-bold text-white truncate max-w-sm">{course.title}</h3>
          </div>
          <button
            onClick={resetAndClose}
            className="p-2 text-[#bccadb] hover:text-white rounded-lg bg-[#1a2c42]/50 hover:bg-[#1a2c42] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-950/60 border border-red-500 rounded-lg text-red-200 text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Student Information */}
          {step === 1 && (
            <form onSubmit={handleNextToPayment} className="space-y-4">
              <div className="bg-[#08111d] border border-[#2e4666] p-3.5 rounded-xl flex items-center justify-between text-sm">
                <div>
                  <span className="text-xs text-[#bccadb]">Payable Amount</span>
                  <p className="text-xl font-extrabold text-[#ffb531]">৳{course.price.toLocaleString()}</p>
                </div>
                <div className="text-right text-xs text-[#bccadb]">
                  <p>Duration: <span className="text-white font-semibold">{course.durationDays} Days</span></p>
                  <p>Classes: <span className="text-white font-semibold">{course.totalClasses} Live/Recorded</span></p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#bccadb] mb-1">
                  Full Name (আপনার পূর্ণ নাম) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Engr. Tanvir Ahmed"
                  className="w-full bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#728296] outline-none transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#bccadb] mb-1">
                    Mobile Number (মোবাইল নম্বর) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#728296] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#bccadb] mb-1">
                    Email Address (ইমেইল ঠিকানা) *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#728296] outline-none transition"
                  />
                  <span className="text-[10px] text-[#7fb8ea]">
                    * Your login password will be emailed to this address.
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#bccadb] mb-1">
                  Present Address / University (বর্তমান ঠিকানা বা বিশ্ববিদ্যালয়)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Dhaka, Bangladesh"
                  className="w-full bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#728296] outline-none transition"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#ffb531] hover:bg-[#ffb531]/90 text-[#1a1100] font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow-md transition"
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
                <label className="block text-xs font-semibold text-[#bccadb] mb-2">
                  Select Payment Method (পেমেন্ট মাধ্যম বেছে নিন):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['bKash', 'Nagad', 'Rocket'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        paymentMethod === m
                          ? 'border-[#ffb531] bg-[#ffb531]/15 text-[#ffb531]'
                          : 'border-[#2e4666] bg-[#08111d] text-[#bccadb] hover:border-[#3a7bb8]'
                      }`}
                    >
                      {m === 'bKash' ? '📱 bKash' : m === 'Nagad' ? '💳 Nagad' : '🚀 Rocket'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Number and Amount display card */}
              <div className="bg-[#08111d] border-2 border-[#3a7bb8] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#bccadb]">Account Type</span>
                  <span className="text-xs font-bold text-white bg-[#3a7bb8]/30 px-2 py-0.5 rounded border border-[#3a7bb8]">
                    {paymentMethod} {activeType}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-[#101c2e] p-3 rounded-lg border border-[#2e4666]">
                  <div>
                    <span className="text-[11px] text-[#bccadb] block">Send Money to this number:</span>
                    <span className="text-lg font-mono font-bold text-[#ffb531] tracking-wider">{activeNumber}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeNumber, 'num')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#3a7bb8]/30 hover:bg-[#3a7bb8]/50 border border-[#3a7bb8] text-xs font-semibold text-white transition"
                  >
                    {copiedField === 'num' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'num' ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="flex items-center justify-between bg-[#101c2e] p-3 rounded-lg border border-[#2e4666]">
                  <div>
                    <span className="text-[11px] text-[#bccadb] block">Exact Amount to Send:</span>
                    <span className="text-xl font-bold text-white">৳{course.price.toLocaleString()}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(String(course.price), 'amt')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-[#3a7bb8]/30 hover:bg-[#3a7bb8]/50 border border-[#3a7bb8] text-xs font-semibold text-white transition"
                  >
                    {copiedField === 'amt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'amt' ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <p className="text-[11px] text-[#7fb8ea] leading-tight">
                  ℹ️ বিকাশ/নগদে <strong>Send Money</strong> অপশন ব্যবহার করুন। রেফারেন্সে আপনার নাম লিখুন এবং সফল পেমেন্টের পর প্রাপ্ত Transaction ID নিচে প্রদান করুন।
                </p>
              </div>

              {/* Payment Proof Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#bccadb] mb-1">
                    Your {paymentMethod} Number (যে নম্বর থেকে টাকা পাঠিয়েছেন) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#728296] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#bccadb] mb-1">
                    Transaction ID / TrxID (ট্রানজেকশন আইডি) *
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value.toUpperCase())}
                    placeholder="e.g. 9K4A7B2C1D"
                    className="w-full bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3.5 py-2.5 text-sm text-white font-mono uppercase tracking-wider placeholder-[#728296] outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#bccadb] mb-1">
                  Additional Note (ঐচ্ছিক মন্তব্য)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional reference note"
                  className="w-full bg-[#08111d] border border-[#2e4666] focus:border-[#ffb531] rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-[#728296] outline-none transition"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 border border-[#2e4666] text-[#bccadb] hover:text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#ffb531] hover:bg-[#ffb531]/90 text-[#1a1100] font-bold rounded-lg text-sm flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Enrollment & TrxID'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Submission Success */}
          {step === 3 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-white">Enrollment Submitted!</h3>
                <p className="text-sm text-[#bccadb] mt-1">
                  Thank you, <strong className="text-white">{name}</strong>. We have received your payment proof for <strong>{course.title}</strong>.
                </p>
              </div>

              <div className="bg-[#08111d] border border-[#2e4666] rounded-xl p-4 text-left text-xs space-y-2 text-[#bccadb]">
                <p className="text-[#ffb531] font-semibold text-sm">What happens next?</p>
                <p>1. Our admin will match and verify your Transaction ID (<strong className="font-mono text-white">{transactionId}</strong>).</p>
                <p>2. Upon approval, the system will automatically generate your student credentials and email them to <strong className="text-white">{email}</strong>.</p>
                <p>3. You can then login directly at <span className="text-[#7fb8ea]">/login</span> to access all lectures, live class links, tasks, and WhatsApp batch group.</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
                    `Hello, I just submitted enrollment for "${course.title}". My TrxID: ${transactionId}, Mobile: ${phone}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 bg-[#25d366] hover:bg-[#25d366]/90 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle className="w-4 h-4" /> Message on WhatsApp
                </a>
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#1a2c42] hover:bg-[#1a2c42]/80 text-white font-semibold rounded-lg text-sm transition"
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
