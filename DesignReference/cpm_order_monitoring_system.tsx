import React, { useState, useEffect } from 'react';
import { 
  Sun, Moon, Menu, X, ArrowRight, 
  CalendarClock, Calculator, ShieldCheck,
  ChevronRight, Activity, CheckCircle2, AlertCircle, FileEdit
} from 'lucide-react';

// --- MAIN APPLICATION COMPONENT ---
export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Toggle dark mode by adding/removing 'dark' class on a wrapper
  const toggleTheme = () => setDarkMode(!darkMode);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <div className={`${darkMode ? 'dark' : ''} scroll-smooth`}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
        
        {/* SECTION 1: HEADER (Navigation Bar) */}
        <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              {/* Branding */}
              <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => window.scrollTo(0,0)}>
                <span className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  CPM Order Monitoring System
                </span>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-8">
                <a href="#home" className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">Home</a>
                <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">System Features</a>
                <a href="#about" className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">About the Portal</a>
                <a href="#dashboard" className="text-sm font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">Order Tracking</a>
                
                <div className="flex items-center space-x-4 pl-4 border-l border-slate-200 dark:border-slate-700">
                  <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" aria-label="Toggle Theme">
                    {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
                  </button>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                    Launch Booking Wizard
                  </button>
                </div>
              </nav>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center space-x-4">
                <button onClick={toggleTheme} className="p-2" aria-label="Toggle Theme">
                  {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
                </button>
                <button onClick={toggleMobileMenu} className="text-slate-600 dark:text-slate-300">
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Drawer */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <div className="px-2 pt-2 pb-6 space-y-1 sm:px-3">
                <a href="#home" onClick={toggleMobileMenu} className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">Home</a>
                <a href="#features" onClick={toggleMobileMenu} className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">System Features</a>
                <a href="#about" onClick={toggleMobileMenu} className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">About the Portal</a>
                <a href="#dashboard" onClick={toggleMobileMenu} className="block px-3 py-2 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md">Order Tracking</a>
                <div className="px-3 pt-4">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg text-base font-semibold transition-colors">
                    Launch Booking Wizard
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>

        <main>
          {/* SECTION 2: HERO SECTION */}
          <section id="home" className="relative pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden bg-white dark:bg-gradient-to-br dark:from-blue-950 dark:via-slate-900 dark:to-slate-950">
            {/* Subtle light mode ambient glow */}
            <div className="absolute top-0 right-0 -mr-48 -mt-48 w-96 h-96 rounded-full bg-blue-100/50 dark:bg-blue-900/20 blur-3xl pointer-events-none"></div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                
                {/* Left Column: Context & Action */}
                <div className="max-w-2xl">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight mb-6">
                    Order Catering and Packed Meals with <span className="text-blue-600 dark:text-sky-400">Operational Precision.</span>
                  </h1>
                  <p className="text-lg text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
                    Step away from spreadsheet chaos. Register multi-day schedules, calculate costs dynamically, and secure booking approvals in one centralized platform.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 group">
                      Create New Booking
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <button className="flex items-center justify-center bg-transparent border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 px-6 py-3.5 rounded-lg font-semibold transition-all duration-200">
                      Manage Existing Orders
                    </button>
                  </div>
                </div>

                {/* Right Column: Visual Mockup */}
                <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
                  <div className="bg-slate-900 dark:bg-slate-900/80 rounded-2xl p-6 shadow-2xl border border-slate-800 transform rotate-1 hover:rotate-0 transition-transform duration-500">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-6">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                      </div>
                      <div className="text-xs font-mono text-slate-400">cpm-admin-console</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {/* KPI Cards Mockup */}
                      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-center space-x-2 text-slate-400 mb-2">
                          <FileEdit className="w-4 h-4" />
                          <span className="text-xs font-medium uppercase tracking-wider">Drafts</span>
                        </div>
                        <div className="text-2xl font-bold text-white">12</div>
                      </div>
                      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-center space-x-2 text-amber-400 mb-2">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs font-medium uppercase tracking-wider">Pending Review</span>
                        </div>
                        <div className="text-2xl font-bold text-white">4</div>
                      </div>
                      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 col-span-2">
                        <div className="flex items-center space-x-2 text-emerald-400 mb-2">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs font-medium uppercase tracking-wider">Approved Events</span>
                        </div>
                        <div className="text-2xl font-bold text-white">142</div>
                      </div>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 space-y-3">
                       <div className="h-2 w-1/3 bg-slate-600 rounded"></div>
                       <div className="h-2 w-full bg-slate-700 rounded"></div>
                       <div className="h-2 w-5/6 bg-slate-700 rounded"></div>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          </section>

          {/* SECTION 3: ABOUT SECTION */}
          <section id="about" className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                
                {/* Left: Editorial/Visual Representation */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-blue-600 dark:bg-blue-800 rounded-2xl transform translate-x-4 translate-y-4 transition-transform group-hover:translate-x-2 group-hover:translate-y-2"></div>
                  <div className="relative bg-slate-200 dark:bg-slate-800 rounded-2xl overflow-hidden aspect-video sm:aspect-square lg:aspect-[4/3] shadow-lg flex items-center justify-center border border-slate-300 dark:border-slate-700">
                    <div className="absolute inset-0 bg-blue-900/20 mix-blend-multiply"></div>
                    <Activity className="w-24 h-24 text-slate-400 dark:text-slate-600 opacity-50" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <p className="text-sm font-medium text-slate-900 dark:text-white text-center">
                          "I gratefully receive" — Operational humility and gratitude.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Content */}
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-6">
                    Welcome to Project Itadakimasu
                  </h2>
                  <div className="space-y-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                    <p>
                      At its core, Project Itadakimasu represents a shift from spreadsheet errors to relational database integrity. We built this platform to ensure that every catering order is treated with the precision it deserves.
                    </p>
                    <ul className="space-y-4 mt-6">
                      <li className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                        </div>
                        <p className="ml-3">
                          <strong className="text-slate-900 dark:text-white font-semibold">Structured Date Spans:</strong> Prevents date formatting inconsistencies. No more "TBA" or unstructured timelines that cause operational delays.
                        </p>
                      </li>
                      <li className="flex items-start">
                        <div className="flex-shrink-0 mt-1">
                          <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-sky-400" />
                        </div>
                        <p className="ml-3">
                          <strong className="text-slate-900 dark:text-white font-semibold">Role-Based Approvals:</strong> Strict workflows ensure that once a budget is approved, it remains locked from unauthorized edits, maintaining financial truth.
                        </p>
                      </li>
                    </ul>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* SECTION 4: PORTAL FEATURES */}
          <section id="features" className="py-20 lg:py-28 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
                  Core System Operations
                </h2>
                <p className="text-lg text-slate-600 dark:text-slate-400">
                  Engineered to automate validations and secure your operational workflows.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group">
                  <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <CalendarClock className="w-7 h-7 text-blue-600 dark:text-sky-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    Dynamic Scheduling Wizard
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Map out multi-day catering timelines with discrete breakfast, lunch, snack, and dinner periods seamlessly.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group">
                  <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Calculator className="w-7 h-7 text-blue-600 dark:text-sky-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    Automated Cost Integrity
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Subtotals are computed automatically using standard menu catalogs (pax * base_rate), preventing human mathematical errors.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-md group">
                  <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-7 h-7 text-blue-600 dark:text-sky-400" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    Strict Validation Safeguards
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    Enforces standard 24-hour time values and verifies profiles. Approved orders are immediately locked from unauthorized modification.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5: ORDER STATUS DASHBOARD PREVIEW */}
          <section id="dashboard" className="py-20 lg:py-28 bg-slate-50 dark:bg-slate-950 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                    Live Order Tracking
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    A real-time look at the tracking queue and approval statuses.
                  </p>
                </div>
                <button className="hidden md:flex items-center text-blue-600 dark:text-sky-400 font-semibold hover:text-blue-700 dark:hover:text-sky-300 transition-colors">
                  View Full Dashboard <ChevronRight className="w-5 h-5 ml-1" />
                </button>
              </div>

              {/* Data Table Mockup */}
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                      <th className="py-4 px-6 font-semibold text-sm text-slate-900 dark:text-slate-300 uppercase tracking-wider">Client / Org</th>
                      <th className="py-4 px-6 font-semibold text-sm text-slate-900 dark:text-slate-300 uppercase tracking-wider">Venue</th>
                      <th className="py-4 px-6 font-semibold text-sm text-slate-900 dark:text-slate-300 uppercase tracking-wider">Date Span</th>
                      <th className="py-4 px-6 font-semibold text-sm text-slate-900 dark:text-slate-300 uppercase tracking-wider text-right">Grand Total</th>
                      <th className="py-4 px-6 font-semibold text-sm text-slate-900 dark:text-slate-300 uppercase tracking-wider text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">DX10 Consulting</td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400">Executive Hall B</td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400">Oct 12 - Oct 14, 2026</td>
                      <td className="py-4 px-6 text-slate-900 dark:text-white font-medium text-right">₱45,500.00</td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          APPROVED
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">CCF Fairview Ministry</td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400">Main Auditorium</td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400">Oct 18, 2026</td>
                      <td className="py-4 px-6 text-slate-900 dark:text-white font-medium text-right">₱12,000.00</td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          PENDING APPROVAL
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">Sun Life Fin. Planning</td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400">Meeting Room 4</td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400">Oct 22, 2026</td>
                      <td className="py-4 px-6 text-slate-900 dark:text-white font-medium text-right">₱8,250.00</td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                          DRAFT
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-slate-900 dark:text-white">Annual Tech Summit</td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400">Grand Ballroom</td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400">Nov 01 - Nov 03, 2026</td>
                      <td className="py-4 px-6 text-slate-900 dark:text-white font-medium text-right">₱210,000.00</td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          FOR UPDATE
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-6 text-center md:hidden">
                <button className="text-blue-600 dark:text-sky-400 font-semibold hover:text-blue-700 dark:hover:text-sky-300 transition-colors">
                  View Full Dashboard →
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 6: CONTACT & INQUIRIES */}
          <section id="contact" className="py-20 lg:py-28 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-8 md:p-12 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-center mb-10">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
                    System Support & Inquiries
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Need technical assistance or onboarding support? Send us a message.
                  </p>
                </div>
                
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        id="fullName" 
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label htmlFor="organization" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Associated Office / Org</label>
                      <input 
                        type="text" 
                        id="organization" 
                        className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
                        placeholder="e.g. Finance Dept"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                    <input 
                      type="email" 
                      id="email" 
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Inquiry Message</label>
                    <textarea 
                      id="message" 
                      rows={4} 
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors outline-none resize-none"
                      placeholder="How can we help you?"
                    ></textarea>
                  </div>
                  <button 
                    type="submit" 
                    className="w-full bg-slate-900 dark:bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    Submit Support Request
                  </button>
                </form>
              </div>
            </div>
          </section>
        </main>

        {/* SECTION 7: FOOTER */}
        <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 border-b border-slate-800 pb-8">
              {/* Row 1/Col 1 */}
              <div className="col-span-1 md:col-span-1">
                <span className="text-xl font-bold text-white tracking-tight block mb-4">
                  CPM Order Monitoring System
                </span>
                <p className="text-sm text-slate-500 max-w-xs">
                  Project Itadakimasu — Operational Stability. Delivering precise and secure catering workflows.
                </p>
              </div>
              
              {/* Row 2/Col 2 & 3 */}
              <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Resources</h4>
                  <ul className="space-y-2 text-sm">
                    <li><a href="#" className="hover:text-white transition-colors">Tech Docs</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Relational API Reference</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">User Manual</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal & Security</h4>
                  <ul className="space-y-2 text-sm">
                    <li><a href="#" className="hover:text-white transition-colors">Security Policy</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Data Privacy</a></li>
                    <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Row 3 */}
            <div className="flex flex-col md:flex-row justify-between items-center text-sm">
              <p>© 2026 CPM Order Monitoring System. All rights reserved.</p>
              <div className="mt-4 md:mt-0 flex space-x-6">
                 {/* Placeholder for social/system status icons */}
                 <span className="flex items-center text-emerald-500">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></div>
                   All Systems Operational
                 </span>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}