'use client';

import { ProjectForm } from '@/components/ProjectForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 right-1/3 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <div className="inline-block mb-4">
              <div className="flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-lg rounded-2xl shadow-2xl mb-4 mx-auto">
                <span className="text-4xl">🚀</span>
              </div>
            </div>
            <h1 className="text-6xl font-black text-white mb-4 tracking-tight">
              Sprint<span className="text-yellow-300">Copilot</span>
            </h1>
            <p className="text-xl text-white/90 font-medium max-w-2xl mx-auto">
              Transform feature requests into actionable sprint tickets with AI-powered intelligence
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-white text-sm font-medium">AI-Powered</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                <span className="text-white text-sm font-medium">⚡ Lightning Fast</span>
              </div>
            </div>
          </div>

          {/* Main Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/20 animate-slide-up">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">✨</span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900">
                  Create Your Sprint Plan
                </h2>
              </div>
              <p className="text-gray-600 text-lg">
                Describe your feature and watch AI generate a complete sprint plan with tickets, estimates, and priorities in minutes.
              </p>
            </div>

            <ProjectForm />
          </div>

          {/* Features Grid */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-delayed">
            <div className="group bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-white/20">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-3xl">🎯</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Smart Clarification</h3>
              <p className="text-gray-600">
                AI identifies ambiguities and suggests clarifying questions to ensure perfect understanding
              </p>
            </div>

            <div className="group bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-white/20">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-3xl">🏗️</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">High-Level Design</h3>
              <p className="text-gray-600">
                Generates comprehensive architecture overview with modules, data flows, and technical risks
              </p>
            </div>

            <div className="group bg-white/90 backdrop-blur-lg rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-white/20">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="text-3xl">📋</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 text-lg">Sprint Tickets</h3>
              <p className="text-gray-600">
                Creates detailed, prioritized tickets with accurate estimates and sprint assignments
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-12 bg-white/90 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20">
            <div className="grid grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500 mb-2">
                  5+
                </div>
                <div className="text-gray-600 font-medium">AI Agents</div>
              </div>
              <div>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 mb-2">
                  &lt;3min
                </div>
                <div className="text-gray-600 font-medium">Average Time</div>
              </div>
              <div>
                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-red-500 mb-2">
                  100%
                </div>
                <div className="text-gray-600 font-medium">Automated</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out 0.2s both;
        }

        .animate-fade-in-delayed {
          animation: fade-in 0.8s ease-out 0.4s both;
        }

        .delay-1000 {
          animation-delay: 1s;
        }

        .delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}
