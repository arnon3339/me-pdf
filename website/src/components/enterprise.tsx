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
                  Let&apos;s Discuss Your
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-300 via-pink-300 to-red-300 bg-clip-text text-transparent">
                  Migration Strategy
                </span>
              </h2>

              <p className="mb-8 text-xl leading-relaxed text-gray-300">
                Join enterprise teams already making the switch. We&apos;ll help
                you plan a smooth migration from Apryse or Nutrient to EmbedPDF.
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
    <div className="relative min-h-screen">
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(20px, -20px) scale(1.1);
          }
          66% {
            transform: translate(-15px, 15px) scale(0.95);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 12s infinite alternate;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .bg-grid-pattern {
          background-image:
            linear-gradient(
              to right,
              rgba(24, 24, 100, 0.05) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(24, 24, 100, 0.05) 1px,
              transparent 1px
            );
          background-size: 32px 32px;
        }
      `}</style>

      <EnterpriseBackground />

      <div className="pb-16 pt-20 sm:pt-24 lg:pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Hero Section */}
          <div className="relative mb-24 text-center">
            <div className="mb-8 inline-block rounded-full border border-red-200 bg-red-50 px-6 py-3 text-sm font-bold text-red-800">
              🔓 Break Free from Vendor Lock-In
            </div>

            <h1 className="md:text-7xl lg:text-8xl mb-8 text-5xl font-black leading-tight tracking-tight text-gray-900">
              <span className="relative inline-block">
                <span className="relative z-10">An Open-Source</span>
                <div className="absolute bottom-2 left-0 right-0 -z-10 h-6 -rotate-1 transform bg-gradient-to-r from-red-400 to-orange-400 opacity-30"></div>
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Alternative to Apryse
              </span>
              <br />
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent">
                & Nutrient
              </span>
            </h1>

            <p className="mx-auto mb-12 max-w-4xl text-xl leading-relaxed text-gray-600 md:text-2xl">
              Enterprise teams across industries rely on PDFs — but many feel
              stuck with expensive, closed-source SDKs.
              <span className="font-bold text-gray-900">
                {' '}
                EmbedPDF changes that.
              </span>{' '}
              It&apos;s an MIT-licensed, open-source PDF SDK built on the proven
              PDFium engine.
            </p>

            <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
              <a
                href="#contact"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 px-10 py-5 text-lg font-bold text-white shadow-2xl transition-all hover:scale-105"
              >
                <span className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 opacity-0 transition-opacity group-hover:opacity-100"></span>
                <span className="relative z-10 flex items-center">
                  <Building2 className="mr-3 h-6 w-6" />
                  Schedule Enterprise Demo
                  <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-1" />
                </span>
              </a>

              <a
                href="https://github.com/embedpdf/embed-pdf-viewer"
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center justify-center rounded-full border-2 border-gray-800 bg-transparent px-10 py-5 text-lg font-bold text-gray-800 transition-all hover:scale-105 hover:bg-gray-800 hover:text-white"
              >
                <Github className="mr-3 h-6 w-6" />
                <span>View Source Code</span>
                <ExternalLink className="ml-3 h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Why Enterprises Are Switching */}
          <div className="mb-24">
            <div className="mb-16 text-center">
              <h2 className="mb-6 text-4xl font-black text-gray-900 md:text-5xl">
                Why Enterprises Are Switching
              </h2>
              <p className="mx-auto max-w-3xl text-xl text-gray-600">
                Companies are tired of paying premium prices for black-box
                solutions. Here&apos;s why they&apos;re choosing EmbedPDF
                instead.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <EnterpriseFeatureCard
                icon={<DollarSign className="h-8 w-8 text-white" />}
                title="Cut Costs by 80%+"
                description="Apryse and Nutrient licenses can run into six figures per year. With EmbedPDF, you control your budget and support only what you need. Redirect those savings to innovation."
                gradient="from-green-500 to-emerald-600"
              />

              <EnterpriseFeatureCard
                icon={<Eye className="h-8 w-8 text-white" />}
                title="100% Transparent"
                description="With closed-source SDKs, you have no visibility or control. EmbedPDF is fully open-source — audit the code, influence the roadmap, and build without limits."
                gradient="from-blue-500 to-cyan-600"
              />

              <EnterpriseFeatureCard
                icon={<Infinity className="h-8 w-8 text-white" />}
                title="Built for the Future"
                description="Open standards, no vendor lock-in, and an active developer community ensure you'll never be stuck waiting for someone else's roadmap."
                gradient="from-purple-500 to-indigo-600"
              />
            </div>
          </div>

          {/* Comparison Table */}
          <div className="mb-24">
            <div className="mb-12 text-center">
              <h2 className="mb-6 text-4xl font-black text-gray-900 md:text-5xl">
                The Numbers Don&apos;t Lie
              </h2>
              <p className="mx-auto max-w-2xl text-xl text-gray-600">
                See exactly how EmbedPDF compares to the competition
              </p>
            </div>

            <ComparisonTable />
          </div>

          {/* Control, Transparency, Influence Section */}
          <div className="relative mb-24 overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900 text-white">
            {/* Background effects */}
            <div className="absolute right-0 top-0 h-80 w-80 -translate-y-1/3 translate-x-1/3 transform rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 opacity-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 h-64 w-64 -translate-x-1/3 translate-y-1/3 transform rounded-full bg-gradient-to-br from-purple-400 to-blue-500 opacity-20 blur-3xl"></div>

            <div className="relative z-10 p-12 md:p-16 lg:p-20">
              <div className="mx-auto max-w-5xl text-center">
                <h2 className="mb-12 text-4xl font-black leading-tight md:text-6xl">
                  <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                    Control. Transparency. Influence.
                  </span>
                </h2>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                  <div className="text-center">
                    <div className="mb-4 inline-block rounded-full bg-cyan-500/20 p-4">
                      <Github className="h-8 w-8 text-cyan-400" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold">Full Source Code</h3>
                    <p className="text-gray-400">Available on GitHub</p>
                  </div>

                  <div className="text-center">
                    <div className="mb-4 inline-block rounded-full bg-blue-500/20 p-4">
                      <Users className="h-8 w-8 text-blue-400" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold">Direct Access</h3>
                    <p className="text-gray-400">To the development team</p>
                  </div>

                  <div className="text-center">
                    <div className="mb-4 inline-block rounded-full bg-purple-500/20 p-4">
                      <Target className="h-8 w-8 text-purple-400" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold">Clear Roadmap</h3>
                    <p className="text-gray-400">
                      Community and sponsor driven
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="mb-4 inline-block rounded-full bg-pink-500/20 p-4">
                      <Code className="h-8 w-8 text-pink-400" />
                    </div>
                    <h3 className="mb-2 text-xl font-bold">
                      Extend & Customize
                    </h3>
                    <p className="text-gray-400">Without permission</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* For Enterprises Who Want More */}
          <div className="mb-24">
            <div className="mb-12 text-center">
              <h2 className="mb-6 text-4xl font-black text-gray-900 md:text-5xl">
                For Enterprises Who Want More
              </h2>
              <p className="mx-auto max-w-3xl text-xl text-gray-600">
                We&apos;re in active discussions with enterprise teams exploring
                migration paths from Apryse and Nutrient. Many are contributing
                development time, sponsoring features, or funding long-term
                support.
              </p>
            </div>

            <div className="rounded-3xl bg-gradient-to-r from-blue-50 to-purple-50 p-12 md:p-16">
              <div className="mx-auto max-w-4xl text-center">
                <div className="mb-8 inline-block rounded-full bg-blue-100 p-4">
                  <Crown className="h-12 w-12 text-blue-600" />
                </div>

                <h3 className="mb-6 text-3xl font-bold text-gray-900">
                  Your Company Can Shape the Future of PDF Technology
                </h3>

                <p className="mb-8 text-xl text-gray-600">
                  Join forward-thinking enterprises who are actively shaping the
                  roadmap and ensuring EmbedPDF meets their mission-critical
                  needs.
                </p>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <div className="rounded-xl bg-white p-6 shadow-lg">
                    <Lightbulb className="mx-auto mb-4 h-8 w-8 text-yellow-600" />
                    <h4 className="mb-2 font-bold">Contribute Ideas</h4>
                    <p className="text-sm text-gray-600">
                      Shape features that matter to your business
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-6 shadow-lg">
                    <Code className="mx-auto mb-4 h-8 w-8 text-blue-600" />
                    <h4 className="mb-2 font-bold">Development Time</h4>
                    <p className="text-sm text-gray-600">
                      Assign developers to critical features
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-6 shadow-lg">
                    <Heart className="mx-auto mb-4 h-8 w-8 text-red-600" />
                    <h4 className="mb-2 font-bold">Financial Support</h4>
                    <p className="text-sm text-gray-600">
                      Sponsor priority development
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sponsor & Collaborate */}
          <div className="mb-24">
            <div className="mb-12 text-center">
              <h2 className="mb-6 text-4xl font-black text-gray-900 md:text-5xl">
                Sponsor & Collaborate
              </h2>
              <p className="mx-auto max-w-2xl text-xl text-gray-600">
                Sponsoring EmbedPDF accelerates the features your business
                needs, while positioning your company as a leader in sustainable
                open-source technology.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="group relative">
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 opacity-20 blur transition duration-300 group-hover:opacity-40"></div>
                <div className="relative h-full rounded-2xl bg-white p-8 shadow-lg">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="mb-4 text-2xl font-bold text-gray-900">
                    Faster Features
                  </h3>
                  <p className="text-gray-600">
                    Ensure critical enterprise features land faster with
                    dedicated development resources.
                  </p>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 blur transition duration-300 group-hover:opacity-40"></div>
                <div className="relative h-full rounded-2xl bg-white p-8 shadow-lg">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="mb-4 text-2xl font-bold text-gray-900">
                    Priority Input
                  </h3>
                  <p className="text-gray-600">
                    Get priority input into the roadmap and influence the
                    direction of development.
                  </p>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 opacity-20 blur transition duration-300 group-hover:opacity-40"></div>
                <div className="relative h-full rounded-2xl bg-white p-8 shadow-lg">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
                    <Star className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="mb-4 text-2xl font-bold text-gray-900">
                    Thought Leadership
                  </h3>
                  <p className="text-gray-600">
                    Demonstrate leadership in adopting sustainable open-source
                    technology.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* About EmbedPDF */}
          <div className="mb-24 rounded-3xl bg-white p-12 md:p-16">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="mb-8 text-4xl font-black text-gray-900 md:text-5xl">
                About EmbedPDF
              </h2>

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <div className="mb-4 text-4xl font-black text-green-600">
                    100%
                  </div>
                  <div className="font-medium text-gray-600">
                    Open-Source (MIT)
                  </div>
                </div>

                <div className="text-center">
                  <div className="mb-4 text-4xl font-black text-blue-600">
                    PDFium
                  </div>
                  <div className="font-medium text-gray-600">Proven Engine</div>
                </div>

                <div className="text-center">
                  <div className="mb-4 text-4xl font-black text-purple-600">
                    Modern
                  </div>
                  <div className="font-medium text-gray-600">
                    JavaScript/TypeScript
                  </div>
                </div>

                <div className="text-center">
                  <div className="mb-4 text-4xl font-black text-orange-600">
                    Active
                  </div>
                  <div className="font-medium text-gray-600">
                    Maintained & Evolving
                  </div>
                </div>
              </div>

              <div className="mt-12 rounded-2xl bg-gradient-to-r from-gray-50 to-blue-50 p-8">
                <p className="text-xl font-medium text-gray-900">
                  &quot;Join the movement. Break free from black-box PDF SDKs
                  and move to a platform you can trust.&quot;
                </p>
              </div>
            </div>
          </div>

          {/* Contact CTA */}
          <div id="contact">
            <ContactCTA />
          </div>
        </div>
      </div>
    </div>
  )
}
