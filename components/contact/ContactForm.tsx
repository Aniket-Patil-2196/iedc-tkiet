"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FormState {
  fullName: string;
  email: string;
  category: string;
  subject: string;
  message: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormState>({
    fullName: "",
    email: "",
    category: "incubation",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const validate = (): FormErrors => {
    const errs: FormErrors = {};

    if (!formData.fullName.trim()) {
      errs.fullName = "Please enter your full name.";
    } else if (formData.fullName.trim().length < 2) {
      errs.fullName = "Name must be at least 2 characters.";
    }

    if (!formData.email.trim()) {
      errs.email = "Please provide an email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = "Please enter a valid email address.";
    }

    if (!formData.subject.trim()) {
      errs.subject = "Please specify a subject for your inquiry.";
    }

    if (!formData.message.trim()) {
      errs.message = "Please write a message.";
    } else if (formData.message.trim().length < 15) {
      errs.message = "Please provide a bit more detail (at least 15 characters).";
    }

    return errs;
  };

  const handleBlur = (field: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate());
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setTouched({
      fullName: true,
      email: true,
      subject: true,
      message: true,
    });

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setServerError(data.error || "Failed to submit inquiry. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch {
      setServerError("Network error. Please check your connection and try again.");
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      fullName: "",
      email: "",
      category: "incubation",
      subject: "",
      message: "",
    });
    setTouched({});
    setErrors({});
    setServerError(null);
    setIsSubmitted(false);
  };

  if (isSubmitted) {
    return (
      <div className="p-8 sm:p-10 rounded-2xl bg-foundation-dark border border-brand-blue/60 shadow-[0_10px_40px_rgba(37,99,235,0.15)] space-y-6 text-center animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-foundation-slate/60 border border-brand-cyan/40 flex items-center justify-center mx-auto text-brand-cyan">
          <CheckCircle2 className="w-8 h-8 text-brand-cyan" />
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-2xl font-bold text-typo-white">
            Inquiry Registered Successfully
          </h3>
          <p className="font-sans text-sm text-typo-gray max-w-md mx-auto leading-relaxed">
            Thank you, <span className="text-typo-white font-medium">{formData.fullName}</span>. Your inquiry regarding &quot;{formData.subject}&quot; has been logged into the cell desk.
          </p>
        </div>

        {/* Database & Institutional Notice */}
        <div className="p-4 rounded-xl bg-foundation-slate/40 border border-foundation-slate text-left text-xs font-sans text-typo-gray space-y-2">
          <div className="flex items-center gap-1.5 text-brand-cyan font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Institutional Response Standard</span>
          </div>
          <p className="leading-relaxed">
            Your inquiry has been stored securely in the IEDC central database and queued for coordinator review. Expect response within 48–72 academic hours.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="md"
          onClick={handleReset}
          className="mx-auto"
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <div className="p-8 sm:p-10 rounded-2xl bg-foundation-dark border border-foundation-slate space-y-6">
      <div className="space-y-1">
        <h3 className="font-display text-xl sm:text-2xl font-bold text-typo-white">
          Send an Inquiry
        </h3>
        <p className="text-xs font-sans text-typo-gray">
          Fill out the form below to route your inquiry to the relevant cell coordinator.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* Name & Email Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label
              htmlFor="fullName"
              className="text-xs font-sans font-semibold uppercase tracking-wider text-typo-gray flex items-center justify-between"
            >
              <span>Full Name *</span>
              {touched.fullName && errors.fullName && (
                <span className="text-[11px] text-red-400 normal-case font-normal">
                  {errors.fullName}
                </span>
              )}
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={() => handleBlur("fullName")}
              placeholder="e.g. Aryan Kulkarni"
              className={`w-full px-4 py-3 rounded-lg bg-foundation-slate/50 border text-typo-white placeholder:text-typo-gray/50 text-sm focus:outline-none transition-colors ${
                touched.fullName && errors.fullName
                  ? "border-red-500/70 focus:border-red-400"
                  : "border-foundation-slate focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
              }`}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-xs font-sans font-semibold uppercase tracking-wider text-typo-gray flex items-center justify-between"
            >
              <span>Email Address *</span>
              {touched.email && errors.email && (
                <span className="text-[11px] text-red-400 normal-case font-normal">
                  {errors.email}
                </span>
              )}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={() => handleBlur("email")}
              placeholder="aryan.kulkarni@tkiet.ac.in"
              className={`w-full px-4 py-3 rounded-lg bg-foundation-slate/50 border text-typo-white placeholder:text-typo-gray/50 text-sm focus:outline-none transition-colors ${
                touched.email && errors.email
                  ? "border-red-500/70 focus:border-red-400"
                  : "border-foundation-slate focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
              }`}
            />
          </div>
        </div>

        {/* Inquiry Category & Subject Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label
              htmlFor="category"
              className="text-xs font-sans font-semibold uppercase tracking-wider text-typo-gray"
            >
              Inquiry Domain
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-foundation-slate/50 border border-foundation-slate text-typo-white text-sm focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-colors"
            >
              <option value="incubation">Student Startup / Idea Pitch</option>
              <option value="prototyping">Prototyping &amp; Lab Access</option>
              <option value="hackathon">Hackathon / Event Inquiries</option>
              <option value="mentorship">Mentorship &amp; Industry Partnership</option>
              <option value="patent">Patent &amp; IP Disclosure</option>
              <option value="general">General Administrative Query</option>
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="subject"
              className="text-xs font-sans font-semibold uppercase tracking-wider text-typo-gray flex items-center justify-between"
            >
              <span>Subject *</span>
              {touched.subject && errors.subject && (
                <span className="text-[11px] text-red-400 normal-case font-normal">
                  {errors.subject}
                </span>
              )}
            </label>
            <input
              id="subject"
              name="subject"
              type="text"
              value={formData.subject}
              onChange={handleChange}
              onBlur={() => handleBlur("subject")}
              placeholder="e.g. Seeking hardware lab bench space"
              className={`w-full px-4 py-3 rounded-lg bg-foundation-slate/50 border text-typo-white placeholder:text-typo-gray/50 text-sm focus:outline-none transition-colors ${
                touched.subject && errors.subject
                  ? "border-red-500/70 focus:border-red-400"
                  : "border-foundation-slate focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
              }`}
            />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <label
            htmlFor="message"
            className="text-xs font-sans font-semibold uppercase tracking-wider text-typo-gray flex items-center justify-between"
          >
            <span>Message *</span>
            {touched.message && errors.message && (
              <span className="text-[11px] text-red-400 normal-case font-normal">
                {errors.message}
              </span>
            )}
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            value={formData.message}
            onChange={handleChange}
            onBlur={() => handleBlur("message")}
            placeholder="Outline your project, proposed collaboration, or specific question for the cell..."
            className={`w-full px-4 py-3 rounded-lg bg-foundation-slate/50 border text-typo-white placeholder:text-typo-gray/50 text-sm focus:outline-none transition-colors ${
              touched.message && errors.message
                ? "border-red-500/70 focus:border-red-400"
                : "border-foundation-slate focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
            }`}
          />
        </div>

        {serverError && (
          <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-500/50 flex items-center gap-2.5 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying &amp; Logging Inquiry...</span>
            </>
          ) : (
            <>
              <span>Submit Inquiry</span>
              <Send className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
