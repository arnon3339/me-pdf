'use client'
import React, { useState } from 'react'
import {
  ArrowRight,
  Shield,
  Lock,
  Unlock,
  DollarSign,
  Eye,
  GitBranch,
  Users,
  Zap,
  TrendingUp,
  CheckCircle,
  X,
  Building2,
  Code,
  Github,
  ExternalLink,
  Mail,
  Phone,
  Calendar,
  Star,
  Heart,
  Target,
  Lightbulb,
  Crown,
  Handshake,
  Clock,
  Infinity,
} from 'lucide-react'
import Link from 'next/link'
import { Scribble2 } from './icons/scribble2'

// Animated background for enterprise feel
const EnterpriseBackground = () => {
  return (
    <div className="absolute inset-0 -z-10">
      {/* Professional gradient orbs */}
      <div className="animate-blob absolute left-10 top-20 h-96 w-96 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-10 mix-blend-multiply blur-3xl filter"></div>
      <div className="animate-blob animation-delay-2000 absolute right-10 top-40 h-80 w-80 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 opacity-10 mix-blend-multiply blur-3xl filter"></div>
      <div className="animate-blob animation-delay-4000 absolute bottom-32 left-1/2 h-72 w-72 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 opacity-10 mix-blend-multiply blur-3xl filter"></div>

      {/* Subtle enterprise grid */}
      <div className="bg-grid-pattern opacity-3 absolute inset-0"></div>
    </div>
  )
}

// Comparison table component
const ComparisonTable = () => {
  const features = [
    {
      feature: 'License Cost',
      apryse: '$50K-700K+/year',
      nutrient: '$25K-400K+/year',
      embedpdf: 'Free (MIT)',
    },
    {
      feature: 'Source Code Access',
      apryse: 'Closed',
      nutrient: 'Closed',
      embedpdf: 'Full Access',
    },
    {
      feature: 'Customization',
      apryse: 'Limited',
      nutrient: 'Limited',
      embedpdf: 'Unlimited',
    },
    {
      feature: 'Vendor Lock-in',
      apryse: 'High',
      nutrient: 'High',
      embedpdf: 'None',
    },
    {
      feature: 'Community Support',
      apryse: 'Paid Only',
      nutrient: 'Paid Only',
      embedpdf: 'Free + Sponsored Options',
    },
    {
      feature: 'Feature Requests',
      apryse: 'Enterprise Only',
      nutrient: 'Enterprise Only',
      embedpdf: 'Community + Sponsored Options',
    },
  ]

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="bg-gradient-to-r from-gray-900 to-blue-900 px-8 py-6">
        <h3 className="text-2xl font-bold text-white">
          Side-by-Side Comparison
        </h3>
        <p className="text-blue-200">
          See how EmbedPDF stacks up against the competition
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left font-bold text-gray-900">
                Feature
              </th>
              <th className="px-6 py-4 text-center font-bold text-red-600">
                Apryse
              </th>
              <th className="px-6 py-4 text-center font-bold text-orange-600">
                Nutrient
              </th>
              <th className="px-6 py-4 text-center font-bold text-green-600">
                EmbedPDF
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((row, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-6 py-4 font-medium text-gray-900">
                  {row.feature}
                </td>
                <td className="px-6 py-4 text-center text-red-600">
                  {row.apryse}
                </td>
                <td className="px-6 py-4 text-center text-orange-600">
                  {row.nutrient}
                </td>
                <td className="px-6 py-4 text-center font-bold text-green-600">
                  {row.embedpdf}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Feature card for enterprise benefits
const EnterpriseFeatureCard = ({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
}) => {
  return (
    <div className="group relative h-full">
      <div
        className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r ${gradient} opacity-20 blur transition duration-300 group-hover:opacity-40`}
      ></div>
      <div
        className={`relative flex h-full flex-col overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-transform group-hover:scale-105`}
      >
        <div
          className={`mb-6 h-16 w-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}
        >
          {icon}
        </div>
        <h3 className="mb-4 text-2xl font-bold text-gray-900">{title}</h3>
        <p className="flex-grow text-lg leading-relaxed text-gray-600">
          {description}
        </p>
      </div>
    </div>
  )
}

// Contact CTA component
const ContactCTA = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log('Form submitted:', formData)
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 text-white">
      {/* Background effects */}
      <div className="absolute right-0 top-0 h-80 w-80 -translate-y-1/2 translate-x-1/2 transform rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 opacity-20 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/2 translate-y-1/2 transform rounded-full bg-gradient-to-br from-purple-400 to-pink-500 opacity-20 blur-3xl"></div>

      <div className="relative z-10 p-8 md:p-12 lg:p-16">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            {/* Left side - Content */}
            <div>
              <div className="mb-6 inline-block rounded-full border border-cyan-400/30 bg-cyan-400/10 px-6 py-2 text-sm font-bold text-slate-300 backdrop-blur-sm">
                🚀 Ready to Switch?
              </div>

              <h2 className="mb-6 text-4xl font-black leading-tight md:text-5xl">
                <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                  Let's Discuss Your
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-red-300 bg-clip-text text-transparent">
                  Migration Strategy
                </span>
              </h2>

              <p className="mb-8 text-xl leading-relaxed text-gray-300">
                Join enterprise teams already making the switch. We'll help you
                plan a smooth migration from Apryse or Nutrient to EmbedPDF.
              </p>

              <div className="space-y-4">
                <div className="flex items-center">
                  <CheckCircle className="mr-3 h-6 w-6 text-green-400" />
                  <span className="text-gray-300">
                    Free migration consultation
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-3 h-6 w-6 text-green-400" />
                  <span className="text-gray-300">
                    Custom development support
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-3 h-6 w-6 text-green-400" />
                  <span className="text-gray-300">
                    Priority feature development
                  </span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="mr-3 h-6 w-6 text-green-400" />
                  <span className="text-gray-300">
                    Long-term partnership options
                  </span>
                </div>
              </div>
            </div>

            {/* Right side - Contact form */}
            <div className="rounded-2xl bg-white/10 p-8 backdrop-blur-sm">
              <h3 className="mb-6 text-2xl font-bold">Get Started Today</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Your Name"
                    className="w-full rounded-lg bg-white/20 px-4 py-3 text-white placeholder-gray-300 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Work Email"
                    className="w-full rounded-lg bg-white/20 px-4 py-3 text-white placeholder-gray-300 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Company Name"
                    className="w-full rounded-lg bg-white/20 px-4 py-3 text-white placeholder-gray-300 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Tell us about your current PDF solution and challenges..."
                    rows={4}
                    className="w-full rounded-lg bg-white/20 px-4 py-3 text-white placeholder-gray-300 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-4 font-bold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                >
                  Schedule a Call
                  <Calendar className="ml-2 inline h-5 w-5" />
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                  Or reach out directly at{' '}
                  <a
                    href="mailto:enterprise@embedpdf.com"
                    className="text-cyan-400 hover:text-cyan-300"
                  >
                    enterprise@embedpdf.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Enterprise() {
  return (
    <>
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-6 py-20">
          {/* Personal Badge */}
          <div className="mb-8">
            <span className="inline-block rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-800">
              🔓 A message from Bob Singor, Founder of CloudPDF & EmbedPDF
            </span>
          </div>

          <h1 className="mb-8 text-5xl font-black leading-tight md:text-6xl">
            I Was Quoted <span className="text-red-600">$180,000/year</span>
            <br />
            For a PDF SDK.
            <br />
            <span className="gradient-text">So I Built My Own.</span>
          </h1>

          <div className="prose prose-xl mb-12 max-w-none text-gray-700">
            <p className="mb-6 text-2xl font-light leading-relaxed">
              Three years ago, I was running CloudPDF and needed a PDF SDK for
              our platform. The quotes I received made my jaw drop:
            </p>

            <div className="mb-8 rounded-xl bg-gray-100 p-8">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="mb-2 text-3xl font-bold text-red-600">
                    Apryse
                  </div>
                  <div className="text-xl">$180,000/year</div>
                </div>
                <div className="text-center">
                  <div className="mb-2 text-3xl font-bold text-orange-600">
                    Nutrient
                  </div>
                  <div className="text-xl">$95,000/year</div>
                </div>
                <div className="text-center">
                  <div className="mb-2 text-3xl font-bold text-yellow-600">
                    ComPDF
                  </div>
                  <div className="text-xl">$65,000/year</div>
                </div>
              </div>
            </div>

            <p className="mb-6 text-xl leading-relaxed">
              But it wasn't just the price that frustrated me. It was the{' '}
              <strong>"black box" nature</strong> of these SDKs. Zero code
              transparency. Complete vendor lock-in. One price hike away from
              killing our business.
            </p>

            <p className="text-xl font-semibold leading-relaxed">
              That's when I decided:{' '}
              <span className="text-blue-600">
                If the PDF SDK industry won't change, I'll change it myself.
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <a
              href="#join-movement"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-8 py-4 text-lg font-bold text-white transition hover:bg-blue-700"
            >
              Join the Movement
              <svg
                className="ml-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                ></path>
              </svg>
            </a>
            <a
              href="https://github.com/embedpdf/embed-pdf-viewer"
              target="_blank"
              className="inline-flex items-center justify-center rounded-lg border-2 border-gray-800 px-8 py-4 text-lg font-bold text-gray-800 transition hover:bg-gray-800 hover:text-white"
            >
              <svg
                className="mr-2 h-5 w-5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836a9.59 9.59 0 012.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"></path>
              </svg>
              1,800+ Stars on GitHub
            </a>
          </div>
        </div>
      </section>
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-4xl font-black">
            This Week Alone, I've Heard Your Stories
          </h2>

          <div className="mb-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <div className="mb-3 font-bold text-red-600">
                FinTech Startup, Series B
              </div>
              <p className="mb-3 text-gray-700">
                "We're paying Apryse $85,000/year. Our CFO nearly had a heart
                attack at renewal time."
              </p>
              <div className="text-sm text-gray-500">— CTO, via email</div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-lg">
              <div className="mb-3 font-bold text-orange-600">
                Healthcare SaaS
              </div>
              <p className="mb-3 text-gray-700">
                "Nutrient wants $120,000 for features we'll barely use. We have
                no alternatives."
              </p>
              <div className="text-sm text-gray-500">
                — Head of Engineering, Zoom call
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-lg">
              <div className="mb-3 font-bold text-yellow-600">
                EdTech Platform
              </div>
              <p className="mb-3 text-gray-700">
                "The vendor lock-in terrifies me. One price hike could kill our
                margins."
              </p>
              <div className="text-sm text-gray-500">— Founder, Discord DM</div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-lg">
              <div className="mb-3 font-bold text-blue-600">
                Legal Tech Company
              </div>
              <p className="mb-3 text-gray-700">
                "We can't audit the code. For a security-critical application,
                that's insane."
              </p>
              <div className="text-sm text-gray-500">
                — Security Lead, LinkedIn
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-lg">
              <div className="mb-3 font-bold text-purple-600">
                Enterprise Software
              </div>
              <p className="mb-3 text-gray-700">
                "We're quoted $350,000/year. That's 3 engineer salaries."
              </p>
              <div className="text-sm text-gray-500">
                — VP Engineering, Phone call
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-lg">
              <div className="mb-3 font-bold text-green-600">
                Startup (Pre-seed)
              </div>
              <p className="mb-3 text-gray-700">
                "$25,000 minimum? That's our entire tools budget for the year."
              </p>
              <div className="text-sm text-gray-500">
                — Solo founder, Twitter
              </div>
            </div>
          </div>

          <div className="rounded-lg border-l-4 border-blue-600 bg-blue-50 p-6">
            <p className="text-xl font-semibold text-blue-900">
              The pattern is clear: The PDF SDK industry is broken.
            </p>
            <p className="mt-2 text-lg text-blue-800">
              Companies are being held hostage by closed-source vendors charging
              whatever they want.
            </p>
          </div>
        </div>
      </section>
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-8 text-center text-4xl font-black">
            So I'm Building <span className="gradient-text">EmbedPDF</span>
          </h2>

          <div className="mb-12 text-center">
            <p className="mx-auto max-w-3xl text-2xl text-gray-700">
              A <strong>100% open-source, MIT-licensed</strong> PDF SDK that
              will be owned by the community forever. No vendor lock-in. No
              black boxes. No surprises.
            </p>
          </div>

          <div className="mb-12 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                <svg
                  className="h-10 w-10 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold">Save 90%+ on Costs</h3>
              <p className="text-gray-600">
                Stop paying $50K-$700K/year. Support only what you need.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
                <svg
                  className="h-10 w-10 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  ></path>
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold">100% Open Source</h3>
              <p className="text-gray-600">
                Full code transparency. Audit, modify, and extend as needed.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
                <svg
                  className="h-10 w-10 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  ></path>
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold">Built on PDFium</h3>
              <p className="text-gray-600">
                The same engine that powers Chrome. Battle-tested by billions.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 p-8">
            <h3 className="mb-4 text-2xl font-bold">What's Already Built:</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <div className="mb-3 flex items-center">
                  <svg
                    className="mr-2 h-6 w-6 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span className="font-semibold">
                    Web SDK (Live & Working)
                  </span>
                </div>
                <div className="mb-3 flex items-center">
                  <svg
                    className="mr-2 h-6 w-6 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span className="font-semibold">1,800+ GitHub Stars</span>
                </div>
                <div className="mb-3 flex items-center">
                  <svg
                    className="mr-2 h-6 w-6 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span className="font-semibold">
                    Core Viewing & Annotation
                  </span>
                </div>
              </div>
              <div>
                <div className="mb-3 flex items-center">
                  <div className="mr-2 h-6 w-6 rounded border-2 border-gray-400"></div>
                  <span className="text-gray-600">
                    Native iOS SDK (Planned)
                  </span>
                </div>
                <div className="mb-3 flex items-center">
                  <div className="mr-2 h-6 w-6 rounded border-2 border-gray-400"></div>
                  <span className="text-gray-600">
                    Native Android SDK (Planned)
                  </span>
                </div>
                <div className="mb-3 flex items-center">
                  <div className="mr-2 h-6 w-6 rounded border-2 border-gray-400"></div>
                  <span className="text-gray-600">
                    Advanced Form Filling (Planned)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="py-20" id="join-movement">
        <div className="mx-auto max-w-4xl px-6">
          <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 p-12 text-center text-white">
            <h2 className="mb-6 text-4xl font-black">Here's My Proposal:</h2>

            <p className="mb-8 text-2xl leading-relaxed">
              Instead of paying $50K-$700K/year to a vendor who doesn't care
              about you, become a <strong>founding sponsor</strong> of an
              open-source alternative that you'll own forever.
            </p>

            <div className="mb-8 rounded-xl bg-white/20 p-8 backdrop-blur">
              <h3 className="mb-4 text-3xl font-bold">
                The Goal: $10,000/month
              </h3>
              <p className="mb-6 text-xl">
                This allows me to work full-time on EmbedPDF and ensures the
                project's sustainability.
              </p>

              <div className="mb-4 h-6 rounded-full bg-white/30">
                <div className="flex h-6 w-1/4 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-600">
                  25%
                </div>
              </div>
              <p className="text-lg">
                Current: $2,500/month from early sponsors
              </p>
            </div>

            <div className="mb-8 rounded-xl bg-white/10 p-6 text-left">
              <h4 className="mb-3 text-xl font-bold">
                When we hit $10,000/month:
              </h4>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-0.5 h-6 w-6 flex-shrink-0 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span>I go full-time on EmbedPDF development</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-0.5 h-6 w-6 flex-shrink-0 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span>Complete PDFium integration goes open source</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-0.5 h-6 w-6 flex-shrink-0 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span>Mobile SDK development begins</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-0.5 h-6 w-6 flex-shrink-0 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span>Regular releases and community support</span>
                </li>
              </ul>
            </div>

            <a
              href="#contact"
              className="inline-flex items-center justify-center rounded-lg bg-white px-10 py-5 text-xl font-bold text-blue-600 transition hover:shadow-2xl"
            >
              Let's Talk About Sponsorship
              <svg
                className="ml-2 h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                ></path>
              </svg>
            </a>
          </div>
        </div>
      </section>
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-4xl font-black">
            Sponsorship Options
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border-2 border-gray-200 p-8 transition hover:border-blue-500">
              <div className="mb-6 text-center">
                <h3 className="mb-2 text-2xl font-bold">Bronze Sponsor</h3>
                <div className="text-4xl font-black text-gray-600">$500</div>
                <div className="text-gray-500">per month</div>
              </div>
              <ul className="mb-8 space-y-3">
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-0.5 h-5 w-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span>Logo on website & README</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-0.5 h-5 w-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span>Priority issue response</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-0.5 h-5 w-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span>Sponsor newsletter</span>
                </li>
              </ul>
            </div>

            <div className="relative scale-105 transform rounded-2xl border-2 border-blue-500 p-8 shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                <span className="rounded-full bg-blue-500 px-4 py-1 text-sm font-bold text-white">
                  MOST POPULAR
                </span>
              </div>
              <div className="mb-6 text-center">
                <h3 className="mb-2 text-2xl font-bold">Silver Sponsor</h3>
                <div className="text-4xl font-black text-blue-600">$2,500</div>
                <div className="text-gray-500">per month</div>
              </div>
              <ul className="mb-8 space-y-3">
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-0.5 h-5 w-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span>Everything in Bronze</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-0.5 h-5 w-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span>Prominent logo placement</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-0.5 h-5 w-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span>Monthly roadmap calls</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-0.5 h-5 w-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span>Feature request priority</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border-2 border-gray-200 p-8 transition hover:border-blue-500">
              <div className="mb-6 text-center">
                <h3 className="mb-2 text-2xl font-bold">Gold Sponsor</h3>
                <div className="text-4xl font-black text-yellow-600">
                  $5,000+
                </div>
                <div className="text-gray-500">per month</div>
              </div>
              <ul className="mb-8 space-y-3">
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-0.5 h-5 w-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span>Everything in Silver</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-0.5 h-5 w-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span>Direct access to founder</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-0.5 h-5 w-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span>Custom feature development</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="mr-2 mt-0.5 h-5 w-5 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  <span>Migration support</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="mb-4 text-gray-600">
              Still paying annual licenses? Compare the cost:
            </p>
            <p className="text-2xl font-bold">
              Silver sponsorship ($2,500/mo) ={' '}
              <span className="text-green-600">$30,000/year</span>
              <br />
              <span className="text-lg text-gray-500">
                vs Apryse at $180,000/year ={' '}
                <span className="text-red-600">83% savings</span>
              </span>
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="mb-12 text-center text-4xl font-black">
            Common Questions
          </h2>

          <div className="space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <h3 className="mb-3 text-xl font-bold">
                Why should I trust this will succeed?
              </h3>
              <p className="text-gray-700">
                I've already built CloudPDF, a successful PDF platform. The Web
                SDK is live with 1,800+ GitHub stars. This isn't a concept—it's
                a working product that needs funding to reach its full
                potential.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-lg">
              <h3 className="mb-3 text-xl font-bold">
                What happens to my sponsorship if you get acquired?
              </h3>
              <p className="text-gray-700">
                The code is MIT licensed forever. Even if I get hit by a bus
                tomorrow, the community owns the code. That's the beauty of open
                source—no single entity can take it away.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-lg">
              <h3 className="mb-3 text-xl font-bold">
                How is this different from other open-source PDF libraries?
              </h3>
              <p className="text-gray-700">
                Most open-source PDF libraries are either abandoned,
                feature-incomplete, or have restrictive licenses. EmbedPDF is
                built on PDFium (Chrome's PDF engine), actively maintained, and
                MIT licensed.
              </p>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-lg">
              <h3 className="mb-3 text-xl font-bold">
                Can I try it before sponsoring?
              </h3>
              <p className="text-gray-700">
                Absolutely! The Web SDK is already open source. Check it out on
                GitHub, star it if you like it, and reach out when you're ready
                to help us build the mobile SDKs.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="bg-gradient-to-br from-gray-900 to-blue-900 py-20 text-white"
        id="contact"
      >
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="mb-6 text-4xl font-black md:text-5xl">
            Are You Ready to Break Free?
          </h2>

          <p className="mb-8 text-xl leading-relaxed">
            If you're tired of being held hostage by closed-source PDF SDK
            vendors, let's talk. Whether you want to sponsor, contribute code,
            or just learn more, I want to hear from you.
          </p>

          <div className="mx-auto max-w-2xl rounded-2xl bg-white/10 p-8 backdrop-blur">
            <h3 className="mb-6 text-2xl font-bold">Reach Out Directly</h3>

            <div className="space-y-4 text-lg">
              <a
                href="mailto:bob@embedpdf.com"
                className="flex items-center justify-center hover:text-blue-300"
              >
                <svg
                  className="mr-3 h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
                </svg>
                bob@embedpdf.com
              </a>

              <a
                href="https://twitter.com/bobsingor"
                target="_blank"
                className="flex items-center justify-center hover:text-blue-300"
              >
                <svg
                  className="mr-3 h-6 w-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
                @bobsingor on Twitter
              </a>

              <a
                href="https://calendly.com/embedpdf"
                target="_blank"
                className="flex items-center justify-center rounded-lg bg-blue-600 py-3 font-bold hover:bg-blue-700"
              >
                <svg
                  className="mr-3 h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  ></path>
                </svg>
                Schedule a Call
              </a>
            </div>

            <p className="mt-6 text-sm text-gray-300">
              Or just DM me on Discord, LinkedIn, or wherever you prefer. I
              personally respond to every message.
            </p>
          </div>

          <div className="mt-12">
            <p className="mb-4 text-2xl font-bold">
              Together, we can break the PDF SDK monopoly.
            </p>
            <p className="text-xl">
              Let's build something the community owns. Forever.
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 py-8 text-gray-400">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <p>
            © 2024 EmbedPDF. MIT Licensed. Built with frustration, maintained
            with passion.
          </p>
        </div>
      </footer>
    </>
  )
}
